# Tavern & Personas

OpenZess supports importing AI character cards from the **TavernAI/SillyTavern** ecosystem, enabling rich persona-based roleplay conversations.

## Importing Characters

### Supported Formats
- **PNG** files with embedded character data (TavernAI format)
- **JSON** character definition files

### How to Import

1. Navigate to the **Tavern** page in the sidebar
2. Click **Import Character**
3. Upload a `.png` or `.json` character card

The character's name, description, personality, scenario, and example dialogues are parsed and stored in the database.

## Character Card Schema

```json
{
    "name": "Luna",
    "description": "A mysterious stargazer...",
    "personality": "Curious, whimsical, thoughtful",
    "scenario": "You meet Luna at an observatory...",
    "mes_example": "{{user}}: Hello!\n{{char}}: *looks up from telescope*"
}
```

## How Personas Work in Chat

When you select a persona in the Tavern and start chatting, the system instruction is dynamically constructed:

```python
system_instruction = f"""
You are {persona.name}, roleplaying in a group chat room.

Description: {persona.description}
Personality: {persona.personality}
Scenario: {persona.scenario}

Example Dialogues: {persona.mes_example}

Respond naturally to the conversation IN CHARACTER as {persona.name}.
"""
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/personas/import` | Import a character card |
| `GET` | `/api/personas` | List all imported personas |
| `DELETE` | `/api/personas/{id}` | Delete a persona |
| `POST` | `/api/tavern/chat` | Chat with a specific persona |
