import threading
import telebot
import requests
import json

TELEGRAM_THREAD = None
TELEGRAM_BOT = None
IS_RUNNING = False

def start_telegram_listener(bot_token: str, provider: str, api_key: str):
    global TELEGRAM_THREAD, TELEGRAM_BOT, IS_RUNNING
    
    if IS_RUNNING:
        stop_telegram_listener()
        
    try:
        TELEGRAM_BOT = telebot.TeleBot(bot_token)
    except ValueError as e:
        raise Exception("Invalid API Token format. Telegram tokens must contain a colon (e.g. 123456:ABC...).")
        
    IS_RUNNING = True
    
    @TELEGRAM_BOT.message_handler(func=lambda message: True)
    def handle_all_messages(message):
        if not IS_RUNNING:
            return
            
        chat_id = message.chat.id
        text = message.text
        
        # We uniquely identify the session using the telegram chat ID
        # so memory is preserved for this specific telegram user
        session_id = f"telegram_{chat_id}"
        
        # We need to send a typing action so the user knows Openzess is thinking
        TELEGRAM_BOT.send_chat_action(chat_id, 'typing')
        
        try:
            # Route through the local FastAPI server directly to share DB & Agent state
            response = requests.post("http://127.0.0.1:8000/api/chat", json={
                "message": text,
                "api_key": api_key,
                "provider": provider,
                "session_id": session_id,
                "system_instruction": "You are Openzess, an AI assistant operating within the user's local operating system. You are currently communicating with the user via Telegram. Keep your responses concise and readable for a messaging app."
            }, timeout=120)
            if response.ok:
                data = response.json()
                reply = data.get("reply", "AI returned an empty response.")
            else:
                try:
                    error_data = response.json()
                    detail = error_data.get("detail", response.text)
                    reply = f"System Warning: {detail}"
                except:
                    reply = f"System Error {response.status_code}: {response.text}"
            
            # Telegram markdown requires careful escaping for special characters if using MarkdownV2,
            # so we'll use standard Markdown or no formatting if it fails.
            try:
                TELEGRAM_BOT.send_message(chat_id, reply, parse_mode="Markdown")
            except Exception:
                # Fallback to plain text if markdown parsing fails
                TELEGRAM_BOT.send_message(chat_id, reply)
                
        except Exception as e:
            TELEGRAM_BOT.send_message(chat_id, f"⚠️ Connection to Openzess Local Server Failed: {str(e)}")

    def poll():
        while IS_RUNNING:
            try:
                print(f"[Channels] Telegram Worker is now ONLINE and listening...")
                TELEGRAM_BOT.polling(none_stop=True, interval=1, timeout=20)
            except Exception as e:
                print(f"[Channels] Telegram Worker Polling Exception: {e}")
                import time
                time.sleep(3)

    TELEGRAM_THREAD = threading.Thread(target=poll, daemon=True)
    TELEGRAM_THREAD.start()
    return True

def stop_telegram_listener():
    global TELEGRAM_BOT, IS_RUNNING
    IS_RUNNING = False
    if TELEGRAM_BOT:
        TELEGRAM_BOT.stop_polling()
        TELEGRAM_BOT = None
    print("[Channels] Telegram Worker offline.")
    return True

def get_status():
    return IS_RUNNING
