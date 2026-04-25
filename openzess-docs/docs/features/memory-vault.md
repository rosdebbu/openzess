# Memory Vault (ChromaDB)

The Memory Vault gives your agent persistent, searchable long-term memory using vector embeddings.

## Overview

OpenZess uses [ChromaDB](https://www.trychroma.com/) — an open-source vector database — to store important context that persists across sessions.

Unlike regular chat history (which is stored in PostgreSQL), the Memory Vault uses **semantic similarity search**. This means the agent can find relevant memories based on meaning, not just keywords.

## How It Works

```python
import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_db")
memory_collection = chroma_client.get_or_create_collection(
    name="openzess_memory"
)
```

### Storing Memories
The agent can store text snippets with metadata:

```python
memory_collection.add(
    documents=["User prefers Python over JavaScript"],
    ids=["mem-001"],
    metadatas=[{"source": "conversation", "topic": "preferences"}]
)
```

### Retrieving Memories
Retrieve memories based on semantic similarity:

```python
results = memory_collection.query(
    query_texts=["What language does the user like?"],
    n_results=3
)
```

## Managing Memories

The frontend provides a dedicated Memory Vault page where you can:

- **View all memories** with their stored text and metadata
- **Delete individual memories** that are no longer relevant
- **Clear all memories** to start fresh

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/memory` | List all stored memories |
| `DELETE` | `/api/memory/{id}` | Delete a specific memory |
| `DELETE` | `/api/memory` | Clear all memories |
