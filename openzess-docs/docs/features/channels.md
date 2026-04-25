# Channels (Telegram & Discord)

OpenZess can deploy your agent as a bot on **Telegram** and **Discord**, responding to messages in real-time.

## Telegram Integration

### Setup

1. Create a bot via [BotFather](https://t.me/BotFather) and get your bot token
2. Go to **Channels** in the OpenZess sidebar
3. Enter your bot token, LLM provider, and API key
4. Click **Start**

### How It Works

The Telegram worker runs in a background thread, polling for new messages:

```python
def start_telegram_listener(bot_token, provider, api_key):
    # Creates a dedicated session for Telegram messages
    # Routes each message through OpenzessAgent
    # Sends the response back to the Telegram chat
```

Each Telegram chat gets its own session ID (`telegram_{chat_id}`), so conversation context is preserved across messages.

## Discord Integration

### Setup

1. Create a Discord Application at [Discord Developer Portal](https://discord.com/developers)
2. Create a Bot and copy the token
3. Invite the bot to your server
4. Configure in OpenZess Channels page

### Features

- Responds to all messages in channels where the bot has access
- Each Discord channel gets its own session for context preservation
- Supports the full agent tool suite (with auto-approval for bot contexts)

## API Endpoints

### Telegram

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/channels/telegram/start` | Start the Telegram listener |
| `POST` | `/api/channels/telegram/stop` | Stop the listener |
| `GET` | `/api/channels/telegram/status` | Check if running |

### Discord

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/channels/discord/start` | Start the Discord listener |
| `POST` | `/api/channels/discord/stop` | Stop the listener |
| `GET` | `/api/channels/discord/status` | Check if running |
