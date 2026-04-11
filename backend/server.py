import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from typing import Optional, List, Dict
from agent import OpenzessAgent, memory_collection
import database
from mcp_manager import mcp_registry
import background_workers
import telegram_worker
from gtts import gTTS
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
import asyncio
database.init_db()

# Auto-reconnect active MCP servers
def init_active_mcps():
    servers = database.get_all_mcp_servers()
    for s in servers:
        if s["is_active"]:
            try:
                print(f"Auto-connecting MCP: {s['name']}")
                mcp_registry.connect(s["id"], s["command"], s["args"])
            except Exception as e:
                print(f"Failed to auto-connect MCP {s['name']}: {e}")

# Run the initialization
init_active_mcps()

class ChatRequest(BaseModel):
    message: str
    api_key: str
    provider: str = 'gemini'
    session_id: Optional[str] = None
    system_instruction: Optional[str] = None
    allowed_tools: Optional[List[str]] = None
    stream: bool = False

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
        try:
            db_messages = database.get_session_messages(session_id)
        except HTTPException:
            # Session doesn't exist yet but ID was hard-provided (e.g., telegram worker)
            title = "Telegram Chat" if session_id.startswith("telegram_") else "External Chat"
            db = database.SessionLocal()
            try:
                new_session = database.Session(id=session_id, title=title)
                db.add(new_session)
                db.commit()
            finally:
                db.close()
            db_messages = []

        history = []
        for msg in db_messages:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})
        
        sessions[session_id] = OpenzessAgent(
            api_key=request.api_key, 
            provider=request.provider,
            history=history,
            system_instruction=request.system_instruction,
            allowed_tools=request.allowed_tools
        )
        
    agent = sessions[session_id]
    
    try:
        # 1. Save user message to database
        database.add_message(session_id, "user", request.message)
        
        if request.stream:
            def event_generator():
                # Stream initialization
                yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"
                
                for chunk in agent.chat_stream(request.message):
                    yield f"data: {json.dumps(chunk)}\n\n"
                    if chunk.get("type") == "done" and not chunk.get("auth_required") and chunk.get("reply"):
                        database.add_message(session_id, "agent", chunk.get("reply"))
            return StreamingResponse(event_generator(), media_type="text/event-stream")
        else:
            response = agent.chat(request.message)
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
    stream: bool = False

@app.post("/api/chat/approve")
async def chat_approve(request: ApprovalRequest):
    agent = sessions.get(request.session_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found in memory.")
    
    try:
        if request.stream:
            def event_generator():
                for chunk in agent.execute_pending_tools_stream(request.pending_calls, request.approved):
                    yield f"data: {json.dumps(chunk)}\n\n"
                    if chunk.get("type") == "done" and not chunk.get("auth_required") and chunk.get("reply"):
                        database.add_message(request.session_id, "agent", chunk.get("reply"))
            return StreamingResponse(event_generator(), media_type="text/event-stream")
        else:
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

class MCPConnectRequest(BaseModel):
    server_id: str
    name: str = ""
    command: str
    args: list

@app.get("/api/mcp/servers")
async def get_mcp_servers():
    return {"servers": mcp_registry.get_status(), "saved_servers": database.get_all_mcp_servers()}

@app.post("/api/mcp/connect")
async def connect_mcp(request: MCPConnectRequest):
    try:
        success = mcp_registry.connect(request.server_id, request.command, request.args)
        if success:
            display_name = request.name if request.name else request.server_id
            database.add_or_update_mcp_server(request.server_id, display_name, request.command, request.args, is_active=True)
        return {"status": "connected" if success else "failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mcp/disconnect/{server_id}")
async def disconnect_mcp(server_id: str):
    mcp_registry.disconnect(server_id)
    saved = database.get_all_mcp_servers()
    for s in saved:
        if s["id"] == server_id:
            database.add_or_update_mcp_server(server_id, s["name"], s["command"], s["args"], is_active=False)
            break
    return {"status": "disconnected"}

@app.delete("/api/mcp/saved/{server_id}")
async def remove_saved_mcp(server_id: str):
    mcp_registry.disconnect(server_id)
    database.remove_mcp_server(server_id)
    return {"status": "deleted"}

@app.get("/api/cron")
async def get_cron_jobs():
    return {"jobs": background_workers.cron_manager.get_jobs()}

@app.delete("/api/cron/{job_id}")
async def delete_cron_job(job_id: str):
    background_workers.cron_manager.remove_job(job_id)
    return {"status": "deleted"}

@app.get("/api/watchdog")
async def get_watchdogs():
    return {"watchdogs": background_workers.watch_manager.get_watchdogs()}

@app.delete("/api/watchdog/{watch_id}")
async def delete_watchdog(watch_id: str):
    background_workers.watch_manager.remove_watchdog(watch_id)
    return {"status": "deleted"}

# ================================
# CHANNELS (Telegram, etc)
# ================================
class TelegramStartRequest(BaseModel):
    bot_token: str
    provider: str
    api_key: str

@app.post("/api/channels/telegram/start")
async def start_telegram(request: TelegramStartRequest):
    try:
        success = telegram_worker.start_telegram_listener(request.bot_token, request.provider, request.api_key)
        return {"status": "started" if success else "failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/channels/telegram/stop")
async def stop_telegram():
    try:
        telegram_worker.stop_telegram_listener()
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/channels/telegram/status")
async def get_telegram_status():
    return {"is_running": telegram_worker.get_status()}

# ================================
# TTS ENGINE
# ================================
class TTSRequest(BaseModel):
    text: str

@app.post("/api/tts")
async def generate_tts(request: TTSRequest):
    try:
        if not request.text or len(request.text.strip()) == 0:
             raise HTTPException(status_code=400, detail="Text cannot be empty.")
        tts = gTTS(text=request.text, lang='en', slow=False)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
