import os
from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
from typing import Optional, List, Dict, Any
from agent import OpenzessAgent, memory_collection
import database
from mcp_manager import mcp_registry
import background_workers
import telegram_worker
from gtts import gTTS
import io
import uuid
import shutil
import tavern_parser
from swarm_manager import swarm_manager

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
    agent_name: Optional[str] = None

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
                        db_role = f"agent:{request.agent_name}" if request.agent_name else "agent"
                        database.add_message(session_id, db_role, chunk.get("reply"))
            return StreamingResponse(event_generator(), media_type="text/event-stream")
        else:
            response = agent.chat(request.message)
            if not response.get("auth_required") and response.get("reply"):
                db_role = f"agent:{request.agent_name}" if request.agent_name else "agent"
                database.add_message(session_id, db_role, response.get("reply"))
            
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

class CronCreateRequest(BaseModel):
    command: str
    interval_minutes: int

@app.post("/api/cron")
async def create_cron_job(request: CronCreateRequest):
    try:
        job_id = background_workers.cron_manager.add_job(request.command, request.interval_minutes)
        return {"status": "created", "job_id": job_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cron")
async def get_cron_jobs():
    return {"jobs": background_workers.cron_manager.get_jobs()}

@app.delete("/api/cron/{job_id}")
async def delete_cron_job(job_id: str):
    background_workers.cron_manager.remove_job(job_id)
    return {"status": "deleted"}

class WatchdogCreateRequest(BaseModel):
    directory: str
    action: str

@app.post("/api/watchdog")
async def create_watchdog(request: WatchdogCreateRequest):
    try:
        watch_id = background_workers.watch_manager.add_watchdog(request.directory, request.action)
        return {"status": "created", "watch_id": watch_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/watchdog")
async def get_watchdogs():
    return {"watchdogs": background_workers.watch_manager.get_watchdogs()}

@app.delete("/api/watchdog/{watch_id}")
async def delete_watchdog(watch_id: str):
    background_workers.watch_manager.remove_watchdog(watch_id)
    return {"status": "deleted"}

# ================================
# PERSONA / TAVERN
# ================================
@app.post("/api/personas/import")
async def import_persona(file: UploadFile = File(...)):
    file_path = f"temp_{uuid.uuid4()}_{file.filename}"
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        if file.filename.endswith(".png"):
            persona_data = tavern_parser.parse_tavern_png(file_path)
        elif file.filename.endswith(".json"):
            persona_data = tavern_parser.parse_tavern_json(file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")
            
        persona_id = str(uuid.uuid4())
        database.add_or_update_persona(persona_id, persona_data)
        
        if os.path.exists(file_path): os.remove(file_path)
        return {"status": "success", "persona_id": persona_id, "name": persona_data["name"]}
    except Exception as e:
        if os.path.exists(file_path): os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/personas")
async def get_personas():
    try:
        return {"personas": database.get_all_personas()}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/personas/{persona_id}")
async def delete_persona(persona_id: str):
    database.delete_persona(persona_id)
    return {"status": "deleted"}

class TavernChatRequest(BaseModel):
    message: str
    api_key: str
    provider: str = 'gemini'
    session_id: str
    target_persona_id: str
    allowed_tools: Optional[List[str]] = None
    stream: bool = False

@app.post("/api/tavern/chat")
async def tavern_chat(request: TavernChatRequest):
    db = database.SessionLocal()
    try:
        persona = db.query(database.Persona).filter(database.Persona.id == request.target_persona_id).first()
        if not persona:
            raise HTTPException(status_code=404, detail="Persona not found")
            
        system_instruction = f"You are {persona.name}, roleplaying in a group chat room.\n\nDescription: {persona.description}\nPersonality: {persona.personality}\nScenario: {persona.scenario}\n\nExample Dialogues: {persona.mes_example}\n\nRespond naturally to the conversation IN CHARACTER as {persona.name}."
        agent_name = persona.name
    finally:
        db.close()
        
    chat_req = ChatRequest(
        message=request.message,
        api_key=request.api_key,
        provider=request.provider,
        session_id=request.session_id,
        system_instruction=system_instruction,
        allowed_tools=request.allowed_tools,
        stream=request.stream,
        agent_name=agent_name
    )
    return await chat(chat_req)

# ================================
# DEVELOPER API (OpenAI & Anthropic)
# ================================
class OpenAIMessage(BaseModel):
    role: str
    content: str
    
class OpenAIChatRequest(BaseModel):
    model: str = "openzess"
    messages: List[OpenAIMessage]
    stream: bool = False

@app.get("/v1/models")
async def get_openai_models():
    return {
        "object": "list",
        "data": [{ "id": "openzess", "object": "model", "created": 1686935002, "owned_by": "openzess" }]
    }

def guess_provider(key: str) -> str:
    if key.startswith("sk-ant"): return "anthropic"
    if key.startswith("gsk_"): return "groq"
    if key.startswith("sk-"): return "openai"
    return "gemini"

@app.post("/v1/chat/completions")
async def openai_chat_completions(request: OpenAIChatRequest, api_req: Request):
    auth_header = api_req.headers.get("Authorization") or api_req.headers.get("x-api-key")
    api_key = auth_header.replace("Bearer ", "").strip() if auth_header else ""
    provider = guess_provider(api_key)
        
    if not request.messages:
         raise HTTPException(status_code=400, detail="Messages array cannot be empty.")
         
    last_msg = request.messages[-1].content
    history = []
    for m in request.messages[:-1]:
         role = "user" if m.role == "user" else "model"
         history.append({"role": role, "parts": [m.content]})
         
    try:
        agent = OpenzessAgent(api_key=api_key, provider=provider, history=history)
        response = agent.chat(last_msg)
        reply = response.get("reply", "")
        
        return {
            "id": "chatcmpl-" + str(uuid.uuid4()),
            "object": "chat.completion",
            "created": 1677652288,
            "model": request.model,
            "choices": [{
                "index": 0,
                "message": { "role": "assistant", "content": reply },
                "finish_reason": "stop"
            }]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnthropicMessage(BaseModel):
    role: str
    content: str

class AnthropicChatRequest(BaseModel):
    model: str = "openzess"
    messages: List[AnthropicMessage]
    system: Optional[str] = None
    max_tokens: Optional[int] = 1024
    stream: bool = False

@app.post("/v1/messages")
async def anthropic_messages(request: AnthropicChatRequest, api_req: Request):
    auth_header = api_req.headers.get("x-api-key") or api_req.headers.get("Authorization")
    api_key = auth_header.replace("Bearer ", "").strip() if auth_header else ""
    provider = guess_provider(api_key)
        
    if not request.messages:
         raise HTTPException(status_code=400, detail="Messages array cannot be empty.")
         
    last_msg = request.messages[-1].content
    history = []
    for m in request.messages[:-1]:
         role = "user" if m.role == "user" else "model"
         history.append({"role": role, "parts": [m.content]})
         
    try:
        agent = OpenzessAgent(api_key=api_key, provider=provider, history=history, system_instruction=request.system)
        response = agent.chat(last_msg)
        reply = response.get("reply", "")
        
        return {
            "id": "msg-" + str(uuid.uuid4()),
            "type": "message",
            "role": "assistant",
            "model": request.model,
            "content": [{ "type": "text", "text": reply }],
            "stop_reason": "end_turn",
            "stop_sequence": None,
            "usage": { "input_tokens": 0, "output_tokens": 0 }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

# ================================
# SWARM / WAR ROOM
# ================================
class SwarmSquadRequest(BaseModel):
    message: str
    squad: List[Dict[str, Any]]

    # squad is e.g. [{"role_name": "Coder", "provider": "openai", "api_key": "xxx", "system_instruction": "You are a senior dev"}, ...]

@app.post("/api/swarm/squad")
async def swarm_squad(request: SwarmSquadRequest):
    if not request.squad:
        raise HTTPException(status_code=400, detail="Squad configuration cannot be empty")
        
    try:
        async def event_generator():
            async for chunk in swarm_manager.dispatch_squad_stream(request.message, request.squad):
                yield f"data: {json.dumps(chunk)}\n\n"
        
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# KNOWLEDGE BASE (Personal Canvas)
# ================================
class NoteCreateRequest(BaseModel):
    title: str
    content: str
    category: str = "General"

class NoteUpdateRequest(BaseModel):
    title: str
    content: str
    category: str

@app.post("/api/notes")
async def create_note(request: NoteCreateRequest):
    try:
        note_id = database.create_note(request.title, request.content, request.category)
        return {"status": "created", "note_id": note_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/notes")
async def get_notes():
    try:
        return {"notes": database.get_all_notes()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/notes/{note_id}")
async def update_note(note_id: str, request: NoteUpdateRequest):
    try:
        success = database.update_note(note_id, request.title, request.content, request.category)
        if not success:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"status": "updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/notes/{note_id}")
async def delete_note(note_id: str):
    try:
        success = database.delete_note(note_id)
        if not success:
            raise HTTPException(status_code=404, detail="Note not found")
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
