import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from agent import OpenzessAgent, memory_collection
import database

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
database.init_db()

class ChatRequest(BaseModel):
    message: str
    api_key: str
    session_id: Optional[str] = None
    system_instruction: Optional[str] = None
    allowed_tools: Optional[List[str]] = None

# Store session agents locally for speed, hydrate from DB on restart
sessions: Dict[str, OpenzessAgent] = {}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.api_key:
        raise HTTPException(status_code=400, detail="API Key is required")
        
    session_id = request.session_id
    if not session_id:
        title = request.message[:40] + ("..." if len(request.message) > 40 else "")
        session_id = database.create_session(title=title)
    
    need_instantiation = False
    if session_id not in sessions:
        need_instantiation = True
    elif request.system_instruction or request.allowed_tools is not None:
        need_instantiation = True
        
    if need_instantiation:
        # Hydrate from DB
        db_messages = database.get_session_messages(session_id)
        history = []
        for msg in db_messages:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})
        
        sessions[session_id] = OpenzessAgent(
            api_key=request.api_key, 
            history=history,
            system_instruction=request.system_instruction,
            allowed_tools=request.allowed_tools
        )
        
    agent = sessions[session_id]
    
    try:
        # 1. Save user message to database
        database.add_message(session_id, "user", request.message)
        
        # 2. Get AI response
        response = agent.chat(request.message)
        
        # 3. Save AI response back to database ONLY if execution is completed
        if not response.get("auth_required") and response.get("reply"):
            database.add_message(session_id, "agent", response.get("reply"))
        
        response["session_id"] = session_id
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ApprovalRequest(BaseModel):
    session_id: str
    pending_calls: list
    approved: bool

@app.post("/api/chat/approve")
async def chat_approve(request: ApprovalRequest):
    agent = sessions.get(request.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found in memory.")
    
    try:
        response = agent.execute_pending_tools(request.pending_calls, request.approved)
        if not response.get("auth_required") and response.get("reply"):
            database.add_message(request.session_id, "agent", response.get("reply"))
            
        response["session_id"] = request.session_id
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions")
async def list_sessions():
    try:
        return {"sessions": database.get_all_sessions()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    try:
        messages = database.get_session_messages(session_id)
        return {"messages": messages}
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
            {"name": "create_file", "description": "Create a brand new local file safely."},
            {"name": "read_file", "description": "Read standard text elements inside a local file."},
            {"name": "edit_code", "description": "Find & replace logic to precisely edit code lines safely."},
            {"name": "search_the_web", "description": "Perform web searches via DuckDuckGo."},
            {"name": "read_web_page", "description": "Scrape and read URL text content."}
        ]
    }

@app.get("/api/memory")
async def get_memories():
    try:
        if memory_collection is None:
            return {"memories": []}
            
        results = memory_collection.get()
        memories = []
        if results and results.get("ids"):
            for i in range(len(results["ids"])):
                memories.append({
                    "id": results["ids"][i],
                    "document": results["documents"][i],
                    "metadata": results["metadatas"][i] if results.get("metadatas") else None
                })
        return {"memories": memories}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: str):
    try:
        if memory_collection is None:
            raise HTTPException(status_code=400, detail="Memory vault is disabled.")
            
        memory_collection.delete(ids=[memory_id])
        return {"status": "success", "deleted_id": memory_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/memory")
async def clear_all_memories():
    try:
        if memory_collection is None:
            raise HTTPException(status_code=400, detail="Memory vault is disabled.")
            
        # Get all ids to delete
        results = memory_collection.get()
        if results and results.get("ids") and len(results["ids"]) > 0:
            memory_collection.delete(ids=results["ids"])
            
        return {"status": "success", "message": "All memories cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
