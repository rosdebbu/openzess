import os
import uuid
from datetime import datetime
from typing import Optional, Dict
import json
from contextlib import contextmanager
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, event
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from fastapi import HTTPException

# Enforce override to bust the cache when restarting WSL
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

# Use local home dir if default sqlite to avoid OneDrive cloud sync disk I/O locks on Windows
default_db_dir = os.path.expanduser("~/.openzess")
os.makedirs(default_db_dir, exist_ok=True)
default_db_path = os.path.join(default_db_dir, "chat_history.db").replace("\\", "/")

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL or DATABASE_URL in ("sqlite:///./chat_history.db", "sqlite:///chat_history.db"):
    DATABASE_URL = f"sqlite:///{default_db_path}"

# SQLAlchemy postgresql+psycopg2 expects this prefix: 
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = "sqlite" not in DATABASE_URL
connect_args = {} if IS_POSTGRES else {"check_same_thread": False}
kwargs = {}
if IS_POSTGRES:
    kwargs["pool_size"] = 10
    kwargs["max_overflow"] = 20
    kwargs["pool_pre_ping"] = True       # Auto-reconnect on stale Neon connections
    kwargs["pool_recycle"] = 300          # Recycle connections every 5 min (Neon drops idle)
    kwargs["pool_timeout"] = 30           # Wait up to 30s for a connection from pool

engine = create_engine(
    DATABASE_URL, 
    connect_args=connect_args,
    **kwargs
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in DATABASE_URL:
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA journal_mode=WAL")
        except Exception:
            try:
                cursor.execute("PRAGMA journal_mode=DELETE")
            except Exception:
                pass
        try:
            cursor.execute("PRAGMA synchronous=NORMAL")
            cursor.execute("PRAGMA cache_size=-64000")
        except Exception:
            pass
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    user_id = Column(String, index=True, nullable=True)  # owner (NULL = legacy/shared)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    user_id = Column(String, index=True, nullable=True)  # owner (NULL = legacy/shared)
    role = Column(String) # 'user' or 'agent'
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    session = relationship("Session", back_populates="messages")

class MCPServer(Base):
    __tablename__ = "mcp_servers"
    server_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    command = Column(String)
    args_json = Column(String) # JSON string array
    is_active = Column(Integer, default=1) # 1=active, 0=inactive
    transport = Column(String, default="stdio")   # stdio | sse | streamable_http
    url = Column(String, default="")              # remote endpoint (HTTP/SSE transports)
    env_json = Column(String)                     # JSON object of env vars
    headers_json = Column(String)                 # JSON object of HTTP headers

class Persona(Base):
    __tablename__ = "personas"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    personality = Column(String)
    scenario = Column(String)
    first_mes = Column(String)
    mes_example = Column(String)
    avatar_base64 = Column(String)
    user_id = Column(String, index=True, nullable=True)  # owner (NULL = legacy/shared)
    created_at = Column(DateTime, default=datetime.utcnow)

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    category = Column(String, default="General")
    user_id = Column(String, index=True, nullable=True)  # owner (NULL = legacy/shared)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, index=True)

class CronJob(Base):
    """Persisted cron jobs so scheduled tasks survive server restarts."""
    __tablename__ = "cron_jobs"
    id = Column(String, primary_key=True, index=True)
    command = Column(String)
    schedule_type = Column(String, default="interval")
    interval_minutes = Column(Integer, default=60)
    cron_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def _auto_migrate():
    """Lightweight auto-migration: add user_id columns to existing tables.

    Runs before create_all so pre-existing SQLite/Postgres databases from
    older versions gain the ownership columns without manual steps.
    (For full versioned migrations use Alembic; this keeps upgrades turnkey.)
    """
    from sqlalchemy import text as sql_text
    targets = [
        ("sessions", "user_id"),
        ("messages", "user_id"),
        ("notes", "user_id"),
        ("personas", "user_id"),
        ("users", "display_name"),
        ("users", "avatar_url"),
        ("users", "bio"),
        ("users", "preferences_json"),
    ]
    with engine.connect() as conn:
        for table, col in targets:
            try:
                if IS_POSTGRES:
                    check = conn.execute(sql_text(
                        "SELECT 1 FROM information_schema.columns "
                        "WHERE table_name=:t AND column_name=:c"
                    ), {"t": table, "c": col}).fetchone()
                    if not check:
                        conn.execute(sql_text(f'ALTER TABLE "{table}" ADD COLUMN {col} VARCHAR'))
                        conn.execute(sql_text(f'CREATE INDEX IF NOT EXISTS ix_{table}_{col} ON "{table}" ({col})'))
                else:
                    cols = [row[1] for row in conn.execute(sql_text(f"PRAGMA table_info({table})")).fetchall()]
                    if cols and col not in cols:
                        conn.execute(sql_text(f"ALTER TABLE {table} ADD COLUMN {col} VARCHAR"))
                conn.commit()
            except Exception as e:
                print(f"Auto-migrate: skipped {table}.{col} ({e})", flush=True)


def init_db():
    _auto_migrate()
    Base.metadata.create_all(bind=engine)
    try:
        from sqlalchemy import inspect, text
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        with engine.begin() as conn:
            for tbl in ["sessions", "messages", "notes", "personas"]:
                if tbl in existing_tables:
                    cols = [c["name"] for c in inspector.get_columns(tbl)]
                    if "user_id" not in cols:
                        conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN user_id VARCHAR"))
    except Exception:
        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def _session():
    """Context manager for safe DB sessions with auto-rollback on errors."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def create_session(title: str = "New Chat", user_id: Optional[str] = None) -> str:
    with _session() as db:
        session_id = str(uuid.uuid4())
        new_session = Session(id=session_id, title=title, user_id=user_id)
        db.add(new_session)
        return session_id

def add_message(session_id: str, role: str, content: str, user_id: Optional[str] = None):
    with _session() as db:
        new_msg = Message(session_id=session_id, role=role, content=content, user_id=user_id)
        db.add(new_msg)

def get_all_sessions(user_id: Optional[str] = None, limit: int = 50, offset: int = 0):
    with _session() as db:
        q = db.query(Session)
        if user_id is not None:
            q = q.filter(Session.user_id == user_id)
        results = q.order_by(Session.created_at.desc()).offset(offset).limit(limit).all()
        return [{"id": s.id, "title": s.title, "user_id": getattr(s, "user_id", None), "created_at": s.created_at.isoformat()} for s in results]

def update_session_title(session_id: str, title: str) -> bool:
    """Rename a chat session."""
    with _session() as db:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            session.title = title
            return True
        return False

def delete_session(session_id: str):
    with _session() as db:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            db.delete(session)
            return True
        return False

def get_session_messages(session_id: str, limit: int = 100, before_id: Optional[int] = None):
    with _session() as db:
        # Check if session exists
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        q = db.query(Message).filter(Message.session_id == session_id)
        if before_id is not None:
            q = q.filter(Message.id < before_id)
        recent = q.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit).all()
        results = list(reversed(recent))
        return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in results]

def get_recent_activity(limit: int = 50):
    with _session() as db:
        results = db.query(Message).order_by(Message.created_at.desc()).limit(limit).all()
        results = list(reversed(results))
        error_count = sum(1 for m in results if "error" in (m.content or "").lower() and m.role != "user")
        feed = [
            {
                "id": m.id,
                "session_id": m.session_id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in results
        ]
        return {"feed": feed, "error_count": error_count}

_mcp_columns_ready = False

def _ensure_mcp_columns():
    """One-time migration: add transport/url/env/headers to mcp_servers for DBs
    created before these columns existed (create_all never alters existing tables)."""
    global _mcp_columns_ready
    if _mcp_columns_ready:
        return
    from sqlalchemy import inspect as sa_inspect, text as sa_text
    try:
        inspector = sa_inspect(engine)
        existing = {c["name"] for c in inspector.get_columns("mcp_servers")}
        stmts = []
        if "transport" not in existing:
            stmts.append("ALTER TABLE mcp_servers ADD COLUMN transport VARCHAR DEFAULT 'stdio'")
        if "url" not in existing:
            stmts.append("ALTER TABLE mcp_servers ADD COLUMN url VARCHAR DEFAULT ''")
        if "env_json" not in existing:
            stmts.append("ALTER TABLE mcp_servers ADD COLUMN env_json VARCHAR")
        if "headers_json" not in existing:
            stmts.append("ALTER TABLE mcp_servers ADD COLUMN headers_json VARCHAR")
        if stmts:
            with engine.begin() as conn:
                for stmt in stmts:
                    conn.execute(sa_text(stmt))
        _mcp_columns_ready = True
    except Exception:
        pass  # Table may not exist yet (init_db creates it) — retried on next call

def add_or_update_mcp_server(server_id: str, name: str, command: str, args: list, is_active: bool = True,
                             transport: str = "stdio", url: str = "",
                             env: Optional[Dict[str, str]] = None,
                             headers: Optional[Dict[str, str]] = None):
    """Persist the FULL MCP connection config — without transport/url/env/headers,
    HTTP/SSE servers break on every backend restart (auto-reconnect used stdio)."""
    _ensure_mcp_columns()
    args_str = json.dumps(args)
    env_str = json.dumps(env) if env else None
    headers_str = json.dumps(headers) if headers else None
    if IS_POSTGRES:
        # Native atomic upsert — no race conditions on Neon
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        with _session() as db:
            stmt = pg_insert(MCPServer).values(
                server_id=server_id, name=name, command=command,
                args_json=args_str, is_active=1 if is_active else 0,
                transport=transport, url=url, env_json=env_str, headers_json=headers_str
            ).on_conflict_do_update(
                index_elements=["server_id"],
                set_={"name": name, "command": command, "args_json": args_str,
                      "is_active": 1 if is_active else 0, "transport": transport,
                      "url": url, "env_json": env_str, "headers_json": headers_str}
            )
            db.execute(stmt)
    else:
        # SQLite fallback — ORM pattern
        with _session() as db:
            server = db.query(MCPServer).filter(MCPServer.server_id == server_id).first()
            if server:
                server.name = name
                server.command = command
                server.args_json = args_str
                server.is_active = 1 if is_active else 0
                server.transport = transport
                server.url = url
                server.env_json = env_str
                server.headers_json = headers_str
            else:
                db.add(MCPServer(
                    server_id=server_id, name=name, command=command,
                    args_json=args_str, is_active=1 if is_active else 0,
                    transport=transport, url=url, env_json=env_str, headers_json=headers_str
                ))

def get_all_mcp_servers():
    _ensure_mcp_columns()
    with _session() as db:
        results = db.query(MCPServer).all()
        return [{
            "id": s.server_id, 
            "name": s.name, 
            "command": s.command, 
            "args": json.loads(s.args_json) if s.args_json else [],
            "is_active": bool(s.is_active),
            "transport": s.transport or "stdio",
            "url": s.url or "",
            "env": json.loads(s.env_json) if s.env_json else None,
            "headers": json.loads(s.headers_json) if s.headers_json else None,
        } for s in results]

def remove_mcp_server(server_id: str):
    with _session() as db:
        server = db.query(MCPServer).filter(MCPServer.server_id == server_id).first()
        if server:
            db.delete(server)

def save_cron_job(job_id: str, command: str, schedule_type: str, interval_minutes: int, cron_time: Optional[str] = None):
    with _session() as db:
        job = db.query(CronJob).filter(CronJob.id == job_id).first()
        if job:
            job.command = command
            job.schedule_type = schedule_type
            job.interval_minutes = interval_minutes
            job.cron_time = cron_time
        else:
            db.add(CronJob(
                id=job_id, command=command, schedule_type=schedule_type,
                interval_minutes=interval_minutes, cron_time=cron_time
            ))

def get_all_cron_jobs():
    with _session() as db:
        results = db.query(CronJob).all()
        return [{
            "id": j.id,
            "command": j.command,
            "schedule_type": j.schedule_type,
            "interval_minutes": j.interval_minutes,
            "cron_time": j.cron_time,
        } for j in results]

def remove_cron_job(job_id: str):
    with _session() as db:
        job = db.query(CronJob).filter(CronJob.id == job_id).first()
        if job:
            db.delete(job)

def add_or_update_persona(persona_id: str, data: dict):
    if IS_POSTGRES:
        # Native atomic upsert for Postgres/Neon
        from sqlalchemy.dialects.postgresql import insert as pg_insert
        with _session() as db:
            values = {
                "id": persona_id,
                "name": data.get("name", "Unknown"),
                "description": data.get("description", ""),
                "personality": data.get("personality", ""),
                "scenario": data.get("scenario", ""),
                "first_mes": data.get("first_mes", ""),
                "mes_example": data.get("mes_example", ""),
                "avatar_base64": data.get("avatar_base64", ""),
            }
            update_fields = {k: v for k, v in values.items() if k != "id"}
            # Only update avatar if a new one was provided
            if not data.get("avatar_base64"):
                update_fields.pop("avatar_base64", None)
            stmt = pg_insert(Persona).values(**values).on_conflict_do_update(
                index_elements=["id"],
                set_=update_fields
            )
            db.execute(stmt)
    else:
        # SQLite fallback
        with _session() as db:
            persona = db.query(Persona).filter(Persona.id == persona_id).first()
            if persona:
                persona.name = data.get("name", persona.name)
                persona.description = data.get("description", persona.description)
                persona.personality = data.get("personality", persona.personality)
                persona.scenario = data.get("scenario", persona.scenario)
                persona.first_mes = data.get("first_mes", persona.first_mes)
                persona.mes_example = data.get("mes_example", persona.mes_example)
                if data.get("avatar_base64"):
                    persona.avatar_base64 = data["avatar_base64"]
            else:
                db.add(Persona(
                    id=persona_id,
                    name=data.get("name", "Unknown"),
                    description=data.get("description", ""),
                    personality=data.get("personality", ""),
                    scenario=data.get("scenario", ""),
                    first_mes=data.get("first_mes", ""),
                    mes_example=data.get("mes_example", ""),
                    avatar_base64=data.get("avatar_base64", "")
                ))

def get_all_personas():
    with _session() as db:
        results = db.query(Persona).all()
        return [{
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "personality": p.personality,
            "scenario": p.scenario,
            "first_mes": p.first_mes,
            "mes_example": p.mes_example,
            "avatar_base64": p.avatar_base64
        } for p in results]

def delete_persona(persona_id: str):
    with _session() as db:
        p = db.query(Persona).filter(Persona.id == persona_id).first()
        if p:
            db.delete(p)

# --- NOTES (Personal Canvas) ---
def create_note(title: str, content: str, category: str = "General", user_id: Optional[str] = None) -> str:
    with _session() as db:
        note_id = str(uuid.uuid4())
        new_note = Note(
            id=note_id,
            title=title,
            content=content,
            category=category,
            user_id=user_id
        )
        db.add(new_note)
        return note_id

def get_all_notes(user_id: Optional[str] = None):
    with _session() as db:
        q = db.query(Note)
        if user_id is not None:
            q = q.filter(Note.user_id == user_id)
        results = q.order_by(Note.updated_at.desc()).all()
        return [{
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "category": n.category,
            "user_id": getattr(n, "user_id", None),
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "updated_at": n.updated_at.isoformat() if n.updated_at else None
        } for n in results]

def update_note(note_id: str, title: str, content: str, category: str):
    with _session() as db:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note:
            note.title = title
            note.content = content
            note.category = category
            # updated_at handles itself via onupdate hook in SQLAlchemy
            return True
        return False

def delete_note(note_id: str):
    with _session() as db:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note:
            db.delete(note)
            return True
        return False

def delete_message(message_id: int):
    with _session() as db:
        msg = db.query(Message).filter(Message.id == message_id).first()
        if msg:
            db.delete(msg)
            return True
        return False
