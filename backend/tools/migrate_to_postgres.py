import sys
import os

# Allow running directly:  python tools/migrate_to_postgres.py  (from backend/)
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "app"))

import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, Session as DBSession, Message, MCPServer, Persona, Note
from dotenv import load_dotenv

# Load env variables to get DATABASE_URL
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL or "postgresql" not in DATABASE_URL:
    print("Error: DATABASE_URL must be set to a PostgreSQL database.")
    exit(1)

# Connect to Postgres using SQLAlchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def migrate():
    # Ensure Postgres schema is created
    print("Creating PostgreSQL tables...")
    Base.metadata.create_all(bind=engine)
    
    # Connect to local SQLite
    sqlite_path = "/tmp/chat_history.db"
    if not os.path.exists(sqlite_path):
        print(f"No SQLite database found at {sqlite_path}. Migration skipped.")
        return
        
    print(f"Connecting to SQLite at {sqlite_path}...")
    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    db = SessionLocal()
    
    try:
        # Migrate Sessions
        print("Migrating Sessions...")
        cursor.execute("SELECT * FROM sessions")
        for row in cursor.fetchall():
            if not db.query(DBSession).filter(DBSession.id == row['id']).first():
                db.add(DBSession(id=row['id'], title=row['title'], created_at=row['created_at']))
        db.commit()
        
        # Migrate Messages
        print("Migrating Messages...")
        cursor.execute("SELECT * FROM messages")
        for row in cursor.fetchall():
            if not db.query(Message).filter(Message.id == row['id']).first():
                db.add(Message(id=row['id'], session_id=row['session_id'], role=row['role'], content=row['content'], created_at=row['created_at']))
        db.commit()

        # Migrate Personas
        print("Migrating Personas...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='personas'")
        if cursor.fetchone():
            cursor.execute("SELECT * FROM personas")
            for row in cursor.fetchall():
                if not db.query(Persona).filter(Persona.id == row['id']).first():
                    db.add(Persona(
                        id=row['id'], name=row['name'], description=row['description'],
                        personality=row['personality'], scenario=row['scenario'],
                        first_mes=row['first_mes'], mes_example=row['mes_example'],
                        avatar_base64=row['avatar_base64'], created_at=row['created_at']
                    ))
            db.commit()

        # Migrate Notes
        print("Migrating Notes...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='notes'")
        if cursor.fetchone():
            cursor.execute("SELECT * FROM notes")
            for row in cursor.fetchall():
                if not db.query(Note).filter(Note.id == row['id']).first():
                    db.add(Note(
                        id=row['id'], title=row['title'], content=row['content'],
                        category=row['category'], created_at=row['created_at'], updated_at=row['updated_at']
                    ))
            db.commit()

        # Migrate MCPServers
        print("Migrating MCPServers...")
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='mcp_servers'")
        if cursor.fetchone():
            cursor.execute("SELECT * FROM mcp_servers")
            for row in cursor.fetchall():
                if not db.query(MCPServer).filter(MCPServer.server_id == row['server_id']).first():
                    db.add(MCPServer(
                        server_id=row['server_id'], name=row['name'], command=row['command'],
                        args_json=row['args_json'], is_active=row['is_active']
                    ))
            db.commit()
            
        print("Migration complete!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()
        conn.close()

if __name__ == "__main__":
    migrate()
