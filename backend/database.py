import os
import uuid
from datetime import datetime
import json
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from fastapi import HTTPException

load_dotenv()

# Use Postgres connection string from ENV
# Fallback to sqlite if postgres is not provided (for local testing without docker)
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./chat_history.db")
# SQLAlchemy postgresql+psycopg2 expects this prefix: 
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL, 
    # Check_same_thread is only needed for sqlite
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    role = Column(String) # 'user' or 'agent'
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("Session", back_populates="messages")

class MCPServer(Base):
    __tablename__ = "mcp_servers"
    server_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    command = Column(String)
    args_json = Column(String) # JSON string array
    is_active = Column(Integer, default=1) # 1=active, 0=inactive

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
    created_at = Column(DateTime, default=datetime.utcnow)

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(String)
    category = Column(String, default="General")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_session(title: str = "New Chat") -> str:
    db = SessionLocal()
    try:
        session_id = str(uuid.uuid4())
        new_session = Session(id=session_id, title=title)
        db.add(new_session)
        db.commit()
        return session_id
    finally:
        db.close()

def add_message(session_id: str, role: str, content: str):
    db = SessionLocal()
    try:
        new_msg = Message(session_id=session_id, role=role, content=content)
        db.add(new_msg)
        db.commit()
    finally:
        db.close()

def get_all_sessions():
    db = SessionLocal()
    try:
        results = db.query(Session).order_by(Session.created_at.desc()).limit(20).all()
        return [{"id": s.id, "title": s.title, "created_at": s.created_at.isoformat()} for s in results]
    finally:
        db.close()

def delete_session(session_id: str):
    db = SessionLocal()
    try:
        session = db.query(Session).filter(Session.id == session_id).first()
        if session:
            db.delete(session)
            db.commit()
            return True
        return False
    finally:
        db.close()

def get_session_messages(session_id: str):
    db = SessionLocal()
    try:
        # Check if session exists
        session = db.query(Session).filter(Session.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        results = db.query(Message).filter(Message.session_id == session_id).order_by(Message.created_at.asc()).all()
        return [{"id": m.id, "role": m.role, "content": m.content, "created_at": m.created_at.isoformat()} for m in results]
    finally:
        db.close()

def add_or_update_mcp_server(server_id: str, name: str, command: str, args: list, is_active: bool = True):
    db = SessionLocal()
    try:
        server = db.query(MCPServer).filter(MCPServer.server_id == server_id).first()
        args_str = json.dumps(args)
        if server:
            server.name = name
            server.command = command
            server.args_json = args_str
            server.is_active = 1 if is_active else 0
        else:
            new_server = MCPServer(
                server_id=server_id, 
                name=name, 
                command=command, 
                args_json=args_str, 
                is_active=1 if is_active else 0
            )
            db.add(new_server)
        db.commit()
    finally:
        db.close()

def get_all_mcp_servers():
    db = SessionLocal()
    try:
        results = db.query(MCPServer).all()
        return [{
            "id": s.server_id, 
            "name": s.name, 
            "command": s.command, 
            "args": json.loads(s.args_json) if s.args_json else [],
            "is_active": bool(s.is_active)
        } for s in results]
    finally:
        db.close()

def remove_mcp_server(server_id: str):
    db = SessionLocal()
    try:
        server = db.query(MCPServer).filter(MCPServer.server_id == server_id).first()
        if server:
            db.delete(server)
            db.commit()
    finally:
        db.close()

def add_or_update_persona(persona_id: str, data: dict):
    db = SessionLocal()
    try:
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
            new_persona = Persona(
                id=persona_id,
                name=data.get("name", "Unknown"),
                description=data.get("description", ""),
                personality=data.get("personality", ""),
                scenario=data.get("scenario", ""),
                first_mes=data.get("first_mes", ""),
                mes_example=data.get("mes_example", ""),
                avatar_base64=data.get("avatar_base64", "")
            )
            db.add(new_persona)
        db.commit()
    finally:
        db.close()

def get_all_personas():
    db = SessionLocal()
    try:
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
    finally:
        db.close()

def delete_persona(persona_id: str):
    db = SessionLocal()
    try:
        p = db.query(Persona).filter(Persona.id == persona_id).first()
        if p:
            db.delete(p)
            db.commit()
    finally:
        db.close()

# --- NOTES (Personal Canvas) ---
def create_note(title: str, content: str, category: str = "General") -> str:
    db = SessionLocal()
    try:
        note_id = str(uuid.uuid4())
        new_note = Note(
            id=note_id,
            title=title,
            content=content,
            category=category
        )
        db.add(new_note)
        db.commit()
        return note_id
    finally:
        db.close()

def get_all_notes():
    db = SessionLocal()
    try:
        results = db.query(Note).order_by(Note.updated_at.desc()).all()
        return [{
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "category": n.category,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "updated_at": n.updated_at.isoformat() if n.updated_at else None
        } for n in results]
    finally:
        db.close()

def update_note(note_id: str, title: str, content: str, category: str):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note:
            note.title = title
            note.content = content
            note.category = category
            # updated_at handles itself via onupdate hook in SQLAlchemy
            db.commit()
            return True
        return False
    finally:
        db.close()

def delete_note(note_id: str):
    db = SessionLocal()
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note:
            db.delete(note)
            db.commit()
            return True
        return False
    finally:
        db.close()

def delete_message(message_id: int):
    db = SessionLocal()
    try:
        msg = db.query(Message).filter(Message.id == message_id).first()
        if msg:
            db.delete(msg)
            db.commit()
            return True
        return False
    finally:
        db.close()
