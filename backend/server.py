import os
import json
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from agent import OpenzessAgent
from db import get_db, DBSession, DBMessage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    api_key: str
    session_id: Optional[str] = None

@app.get("/api/sessions")
async def get_sessions(db: Session = Depends(get_db)):
    sessions = db.query(DBSession).order_by(DBSession.updated_at.desc()).all()
    return {"sessions": [{"id": s.id, "title": s.title, "updated_at": s.updated_at} for s in sessions]}

@app.post("/api/sessions")
async def create_session(db: Session = Depends(get_db)):
    new_session = DBSession(title="New Chat")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"id": new_session.id}

@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSession).filter(DBSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(DBMessage).filter(DBMessage.session_id == session_id).order_by(DBMessage.created_at.asc()).all()
    return {
        "id": session.id,
        "title": session.title,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content": m.content,
                "tools": m.tools
            } for m in messages
        ]
    }

@app.post("/api/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
        
    session_id = request.session_id
    if not session_id:
        new_session = DBSession(title=request.message[:30] + "...")
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id
    else:
        session_obj = db.query(DBSession).filter(DBSession.id == session_id).first()
        if session_obj and session_obj.title == "New Chat":
            session_obj.title = request.message[:30] + "..."
            db.commit()

    user_msg = DBMessage(session_id=session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()

    db_messages = db.query(DBMessage).filter(DBMessage.session_id == session_id).order_by(DBMessage.created_at.asc()).all()
    history = []
    for msg in db_messages[:-1]: # exclude the latest user payload
        history.append({
            "role": "model" if msg.role == "agent" else "user",
            "parts": [msg.content]
        })

    agent = OpenzessAgent(api_key=request.api_key, history=history)
    
    try:
        response = agent.chat(request.message)
        
        agent_msg = DBMessage(
            session_id=session_id, 
            role="agent", 
            content=response["reply"],
            tools=response.get("tools", [])
        )
        db.add(agent_msg)
        
        session_obj = db.query(DBSession).filter(DBSession.id == session_id).first()
        if session_obj:
            session_obj.updated_at = agent_msg.created_at
            
        db.commit()
        
        return {
            "session_id": session_id,
            "reply": response["reply"],
            "tools": response.get("tools", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/files")
async def list_files():
    try:
        current_dir = os.getcwd()
        items = os.listdir(current_dir)
        files = [{"name": item, "is_dir": os.path.isdir(os.path.join(current_dir, item))} for item in items]
        return {"directory": current_dir, "files": sorted(files, key=lambda x: (not x["is_dir"], x["name"].lower()))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/tools")
async def list_tools():
    return {
        "tools": [
            {"name": "run_terminal_command", "description": "Execute local shell commands."},
            {"name": "search_the_web", "description": "Perform web searches via DuckDuckGo."},
            {"name": "read_web_page", "description": "Scrape and read URL text content."}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
