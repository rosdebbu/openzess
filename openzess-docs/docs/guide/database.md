# Database (Neon PostgreSQL)

OpenZess uses [Neon](https://neon.tech) — a serverless PostgreSQL service — as its primary database.

## Why Neon?

Previously, OpenZess used a local SQLite file (`chat_history.db`). This caused critical problems:

- **Data loss risk**: If WSL crashed or Docker containers were reset, all chat history was destroyed
- **No portability**: The database was locked to a single machine
- **No concurrent access**: SQLite has limited write concurrency

Neon solves all of these:

| Feature | SQLite (Old) | Neon PostgreSQL (Current) |
|---------|-------------|--------------------------|
| Data persistence | ❌ Local file | ✅ Cloud-hosted |
| Crash resilience | ❌ Lost on reset | ✅ Always safe |
| Multi-device access | ❌ Single machine | ✅ Any machine |
| Branching | ❌ None | ✅ Git-like DB branches |
| Vector search | ❌ None | ✅ pgvector support |
| Free tier | ✅ | ✅ Generous free tier |

## Schema

The database contains 5 core tables managed by SQLAlchemy ORM:

### `sessions`
```sql
CREATE TABLE sessions (
    id VARCHAR PRIMARY KEY,
    title VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### `messages`
```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR REFERENCES sessions(id),
    role VARCHAR,        -- 'user', 'agent', 'agent:PersonaName'
    content TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

### `personas`
Stores imported TavernAI character cards with fields for name, description, personality, scenario, and example dialogues.

### `mcp_servers`
Tracks connected MCP servers with their commands, arguments, and active status for auto-reconnection on restart.

### `notes`
The Knowledge Base / Canvas personal notes system with title, content, and category.

## Connection Configuration

The connection string is set in your `.env` file:

```env
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-your-host.neon.tech/neondb?sslmode=require
```

The backend automatically handles the connection in `database.py`:

```python
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./chat_history.db")

# Auto-fix prefix for psycopg2 compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)
```

::: tip
The fallback to SQLite means you can still run OpenZess without Neon for local development. Just don't set `DATABASE_URL` in your `.env`.
:::
