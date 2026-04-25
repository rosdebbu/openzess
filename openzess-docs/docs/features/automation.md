# Cron Jobs & Watchdogs

OpenZess supports two types of autonomous background automation: **Cron Jobs** for time-based tasks and **Watchdogs** for event-based tasks.

## Cron Jobs

Schedule commands to run automatically at regular intervals.

### Creating a Cron Job

**From the UI:**
Navigate to **Tools → Cron Jobs** and create a new job with a command and interval.

**From the Agent:**
The agent can create cron jobs using the `schedule_background_task` tool:

```
"Schedule a task to check disk usage every 30 minutes"
→ Agent calls: schedule_background_task("df -h", 30)
```

### How It Works

```python
class CronManager:
    def add_job(self, command, interval_minutes):
        job_id = str(uuid.uuid4())
        # Starts a background thread with a timer
        # Executes the command at the specified interval
        return job_id
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cron` | Create a new cron job |
| `GET` | `/api/cron` | List all active jobs |
| `DELETE` | `/api/cron/{id}` | Remove a job |

## Filesystem Watchdogs

Monitor directories for changes and automatically execute actions when files are created, modified, or deleted.

### Creating a Watchdog

**From the Agent:**
```
"Watch the /tmp/downloads folder and notify me when new files appear"
→ Agent calls: monitor_directory("/tmp/downloads", "echo 'New file detected!'")
```

### How It Works

The watchdog system uses filesystem polling to detect changes. When a change is detected, the specified action is executed automatically.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/watchdog` | Create a new watchdog |
| `GET` | `/api/watchdog` | List all active watchdogs |
| `DELETE` | `/api/watchdog/{id}` | Remove a watchdog |

## Use Cases

| Automation | Example |
|------------|---------|
| **Health monitoring** | Check server status every 5 minutes |
| **Auto-backup** | Copy important files every hour |
| **Code watch** | Run tests when source files change |
| **Log analysis** | Parse new log entries as they appear |
