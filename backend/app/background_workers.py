import uuid
import time
from typing import List
from apscheduler.schedulers.background import BackgroundScheduler
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import os
import requests

# ----------------- CRON MANAGER -----------------
def _get_active_llm_credentials():
    for env_key, prov in [
        ("GEMINI_API_KEY", "gemini"),
        ("DEEPSEEK_API_KEY", "deepseek"),
        ("OPENAI_API_KEY", "openai"),
        ("NVIDIA_API_KEY", "nvidia"),
        ("OPENROUTER_API_KEY", "openrouter"),
    ]:
        val = os.environ.get(env_key)
        if val:
            return val, prov
    return "system-background-call", "gemini"

class CronManager:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self.jobs = {}

    def _execute_job(self, job_id: str, command: str):
        """Fire the agent via the internal /api/chat endpoint."""
        try:
            print(f"[CRON RUN] Executing job {job_id} -> {command}")
            api_key, provider = _get_active_llm_credentials()
            
            requests.post("http://localhost:8000/api/chat", json={
                "message": command,
                "api_key": api_key, 
                "provider": provider,
                "system_instruction": "You are a background CRON processor. Execute the request seamlessly using the tools provided to you. When asked to email, always use the send_email tool.",
                "allowed_tools": ["run_terminal_command", "create_file", "search_the_web", "read_web_page", "read_file", "edit_code", "send_email"]
            }, timeout=120)
        except Exception as e:
            print(f"[CRON ERR] {e}")

    def _schedule_job(self, job_id: str, command: str, schedule_type: str, interval_minutes: int, cron_time: str = None):
        """Register a job with APScheduler under an explicit id."""
        if schedule_type == "time" and cron_time:
            try:
                hour, minute = map(int, cron_time.split(':'))
            except:
                hour, minute = 10, 0
            job = self.scheduler.add_job(
                self._execute_job, 
                'cron', 
                hour=hour,
                minute=minute,
                args=[job_id, command],
                id=job_id
            )
        else:
            schedule_type = "interval"
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
            "schedule_type": schedule_type,
            "interval_minutes": interval_minutes,
            "cron_time": cron_time,
            "created_at": time.time(),
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "status": "active"
        }

    def add_job(self, command: str, schedule_type: str = "interval", interval_minutes: int = 60, cron_time: str = None, persist: bool = True) -> str:
        job_id = str(uuid.uuid4())
        self._schedule_job(job_id, command, schedule_type, interval_minutes, cron_time)
        if persist:
            try:
                from . import database
                database.save_cron_job(job_id, command, schedule_type, interval_minutes, cron_time)
            except Exception as e:
                print(f"[CRON PERSIST ERR] {e}")
        return job_id

    def restore_jobs(self):
        """Re-register persisted cron jobs (with their original ids) after a restart."""
        try:
            from . import database
            restored = 0
            for j in database.get_all_cron_jobs():
                if j["id"] in self.jobs or self.scheduler.get_job(j["id"]):
                    continue
                self._schedule_job(
                    job_id=j["id"],
                    command=j["command"],
                    schedule_type=j["schedule_type"],
                    interval_minutes=j["interval_minutes"],
                    cron_time=j["cron_time"],
                )
                restored += 1
            print(f"[CRON RESTORE] Restored {restored} persisted job(s)", flush=True)
        except Exception as e:
            print(f"[CRON RESTORE ERR] {e}")

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
        try:
            from . import database
            database.remove_cron_job(job_id)
        except Exception as e:
            print(f"[CRON PERSIST ERR] {e}")

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
            api_key, provider = _get_active_llm_credentials()
            requests.post("http://localhost:8000/api/chat", json={
                "message": command,
                "api_key": api_key,
                "provider": provider,
                "system_instruction": "You are a watchdog event listener. A file change just occurred. Execute your mandated action.",
                "allowed_tools": ["run_terminal_command", "create_file", "search_the_web", "read_web_page", "read_file", "edit_code"]
            }, timeout=30)
        except Exception:
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

# ----------------- REPO SENTRY (Autonomous Repo Watcher & Auto-Test/Commit) -----------------
import threading
import subprocess

class RepoSentryHandler(FileSystemEventHandler):
    def __init__(self, repo_id: str, sentry_manager: "RepoSentry"):
        super().__init__()
        self.repo_id = repo_id
        self.sentry_manager = sentry_manager
        self.last_trigger = 0

    def on_modified(self, event):
        if event.is_directory:
            return
        path = event.src_path.replace("\\", "/")
        if any(ign in path for ign in ["/.git/", "/__pycache__/", "/node_modules/", "/dist/", "/.venv/", "/venv/", "/target/", ".db", ".sqlite"]):
            return
        if time.time() - self.last_trigger < 15:
            return
        self.last_trigger = time.time()
        threading.Thread(target=self.sentry_manager.scan_repo, args=[self.repo_id], daemon=True).start()

class RepoSentry:
    def __init__(self):
        self.repos = {}

    def add_repo(self, path: str, test_cmd: str = "pytest", auto_commit: bool = False, interval_minutes: int = 30) -> str:
        if not os.path.exists(path):
            raise Exception("Repository directory does not exist.")

        repo_id = str(uuid.uuid4())
        handler = RepoSentryHandler(repo_id, self)
        observer = Observer()
        observer.schedule(handler, path, recursive=True)
        observer.start()

        cron_job_id = None
        if interval_minutes > 0:
            cron_job_id = cron_manager.add_job(
                command=f"Repo Sentry scheduled health check on {path}",
                schedule_type="interval",
                interval_minutes=interval_minutes
            )

        self.repos[repo_id] = {
            "id": repo_id,
            "path": os.path.abspath(path),
            "test_cmd": test_cmd,
            "auto_commit": auto_commit,
            "interval_minutes": interval_minutes,
            "observer": observer,
            "cron_job_id": cron_job_id,
            "last_scan_time": None,
            "last_status": "initialized",
            "last_error": None,
            "created_at": time.time(),
        }
        return repo_id

    def scan_repo(self, repo_id: str) -> dict:
        if repo_id not in self.repos:
            return {"error": "Repo watcher not found"}
        data = self.repos[repo_id]
        path = data["path"]
        test_cmd = data["test_cmd"]
        auto_commit = data["auto_commit"]

        data["last_scan_time"] = time.time()
        print(f"[REPO SENTRY] Running scan on {path} with: {test_cmd}")

        try:
            res = subprocess.run(test_cmd, shell=True, cwd=path, capture_output=True, text=True, timeout=120)
            if res.returncode == 0:
                data["last_status"] = "clean"
                data["last_error"] = None
                print(f"[REPO SENTRY] All tests passed cleanly on {path}")
                return {"status": "clean", "output": res.stdout[:500]}
            else:
                data["last_status"] = "failing"
                data["last_error"] = (res.stderr or res.stdout or "Test failed")[:1000]
                print(f"[REPO SENTRY] Tests failed on {path}! Alerting agent...")
                
                api_key, provider = _get_active_llm_credentials()
                prompt = (
                    f"Autonomous Sentry Alert: Tests failed in repository '{path}' with command '{test_cmd}'.\n"
                    f"Exit code: {res.returncode}\n"
                    f"Failure output:\n{data['last_error']}\n\n"
                    f"Please read the failing test/file, identify the root cause, apply the required fix using edit_code, and re-verify."
                )
                if auto_commit:
                    prompt += "\nOnce fixed and verified, run a git commit with a clear description."

                try:
                    requests.post("http://localhost:8000/api/chat", json={
                        "message": prompt,
                        "api_key": api_key,
                        "provider": provider,
                        "system_instruction": "You are Openzess Autonomous Repo Sentry. You repair failing tests and maintain codebase health.",
                        "allowed_tools": ["run_terminal_command", "read_file", "edit_code", "create_file"]
                    }, timeout=180)
                except Exception as post_err:
                    print(f"[REPO SENTRY ERR] {post_err}")

                return {"status": "failing", "error": data["last_error"]}
        except Exception as e:
            data["last_status"] = "error"
            data["last_error"] = str(e)
            return {"status": "error", "error": str(e)}

    def get_repos(self) -> List[dict]:
        return [{
            "id": r["id"],
            "path": r["path"],
            "test_cmd": r["test_cmd"],
            "auto_commit": r["auto_commit"],
            "interval_minutes": r["interval_minutes"],
            "last_scan_time": r["last_scan_time"],
            "last_status": r["last_status"],
            "last_error": r["last_error"],
        } for r in self.repos.values()]

    def remove_repo(self, repo_id: str):
        if repo_id in self.repos:
            r = self.repos[repo_id]
            if r.get("observer"):
                r["observer"].stop()
                r["observer"].join()
            if r.get("cron_job_id"):
                cron_manager.remove_job(r["cron_job_id"])
            del self.repos[repo_id]

# Global singletons
cron_manager = CronManager()
watch_manager = WatchManager()
repo_sentry = RepoSentry()
