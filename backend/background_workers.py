import uuid
import time
from typing import Dict, List
from apscheduler.schedulers.background import BackgroundScheduler
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os
import requests

# ----------------- CRON MANAGER -----------------
class CronManager:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self.jobs = {}

    def _execute_job(self, job_id: str, command: str):
        # We simulate firing the execution by calling the agent via the internal API or directly.
        # Calling localhost /api/chat seamlessly.
        try:
            print(f"[CRON RUN] Executing job {job_id} -> {command}")
            # Use Localhost API with dummy details to let the Agent run the command
            requests.post("http://localhost:8000/api/chat", json={
                "message": command,
                "api_key": os.environ.get("OPENAI_API_KEY", "system-cron-call"), # Bypass safely if native 
                "provider": "openai",
                "system_instruction": "You are a background CRON processor. Execute the request seamlessly."
            }, timeout=30)
        except Exception as e:
            print(f"[CRON ERR] {e}")

    def add_job(self, command: str, interval_minutes: int) -> str:
        job_id = str(uuid.uuid4())
        
        # Schedule the APScheduler Job
        job = self.scheduler.add_job(
            self._execute_job, 
            'interval', 
            minutes=interval_minutes, 
            args=[job_id, command],
            id=job_id
        )
        
        self.jobs[job_id] = {
            "id": job_id,
            "command": command,
            "interval_minutes": interval_minutes,
            "created_at": time.time(),
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "status": "active"
        }
        return job_id

    def get_jobs(self) -> List[dict]:
        active = []
        for jid, data in self.jobs.items():
            aps_job = self.scheduler.get_job(jid)
            if aps_job:
                data["next_run_time"] = aps_job.next_run_time.isoformat() if aps_job.next_run_time else None
                active.append(data)
        return active

    def remove_job(self, job_id: str):
        if job_id in self.jobs:
            try:
                self.scheduler.remove_job(job_id)
            except:
                pass
            del self.jobs[job_id]

# ----------------- WATCHDOG MANAGER -----------------
class AgentWatchdogHandler(FileSystemEventHandler):
    def __init__(self, action: str):
        super().__init__()
        self.action = action
        self.last_trigger = 0

    def on_modified(self, event):
        if event.is_directory:
            return
        
        # Debounce rapid triggers
        if time.time() - self.last_trigger < 5:
            return
            
        self.last_trigger = time.time()
        filepath = event.src_path
        
        command = f"File {filepath} was just modified. Immediate Agent Action required: {self.action}"
        print(f"[WATCHDOG MSG] {command}")
        try:
             requests.post("http://localhost:8000/api/chat", json={
                "message": command,
                "api_key": os.environ.get("OPENAI_API_KEY", "system-watchdog-call"),
                "provider": "openai",
                "system_instruction": "You are a watchdog event listener. A file change just occurred. Execute your mandated action."
             }, timeout=30)
        except Exception as e:
            pass

class WatchManager:
    def __init__(self):
        self.observers = {}

    def add_watchdog(self, directory: str, action: str) -> str:
        if not os.path.exists(directory):
            raise Exception("Directory does not exist.")
            
        watch_id = str(uuid.uuid4())
        event_handler = AgentWatchdogHandler(action=action)
        observer = Observer()
        observer.schedule(event_handler, directory, recursive=True)
        observer.start()
        
        self.observers[watch_id] = {
            "id": watch_id,
            "directory": directory,
            "action": action,
            "observer": observer,
            "created_at": time.time(),
            "status": "listening"
        }
        return watch_id

    def get_watchdogs(self) -> List[dict]:
        return [{
            "id": w["id"],
            "directory": w["directory"],
            "action": w["action"],
            "status": "listening"
        } for w in self.observers.values()]

    def remove_watchdog(self, watch_id: str):
        if watch_id in self.observers:
            obs = self.observers[watch_id]["observer"]
            obs.stop()
            obs.join()
            del self.observers[watch_id]

# Global singletons
cron_manager = CronManager()
watch_manager = WatchManager()
