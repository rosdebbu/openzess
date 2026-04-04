import os
import uuid
from datetime import datetime
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
        results = db.query(Session).order_by(Session.created_at.desc()).all()
        return [{"id": s.id, "title": s.title, "created_at": s.created_at.isoformat()} for s in results]
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
