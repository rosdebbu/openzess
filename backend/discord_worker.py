import threading
import discord
import asyncio
import requests
import json
import uuid

DISCORD_THREAD = None
DISCORD_CLIENT = None
IS_RUNNING = False
PENDING_AUTH_STATE = {}

def start_discord_listener(bot_token: str, provider: str, api_key: str):
    global DISCORD_THREAD, DISCORD_CLIENT, IS_RUNNING
    
    if IS_RUNNING:
        stop_discord_listener()
        
    IS_RUNNING = True
    
    # We use a separate event loop since Discord requires it
    def run_bot(loop):
        global DISCORD_CLIENT
        
        intents = discord.Intents.default()
        intents.message_content = True # Required to read messages
        
        DISCORD_CLIENT = discord.Client(intents=intents)
        
        class ApprovalView(discord.ui.View):
            def __init__(self, channel_id, pending_calls, session_id):
                super().__init__(timeout=None)
                self.channel_id = channel_id
                self.pending_calls = pending_calls
                self.session_id = session_id

            @discord.ui.button(label="❌ Deny", style=discord.ButtonStyle.danger, custom_id="auth_deny")
            async def deny_callback(self, interaction: discord.Interaction, button: discord.ui.Button):
                await self.process_approval(interaction, False)

            @discord.ui.button(label="✅ Approve & Execute", style=discord.ButtonStyle.success, custom_id="auth_approve")
            async def approve_callback(self, interaction: discord.Interaction, button: discord.ui.Button):
                await self.process_approval(interaction, True)
                
            async def process_approval(self, interaction: discord.Interaction, approved: bool):
                if self.channel_id not in PENDING_AUTH_STATE:
                    await interaction.response.edit_message(content="This authorization request has expired or was already processed.", view=None)
                    return
                    
                await interaction.response.edit_message(content=f"*(Processing {'Approval' if approved else 'Denial'}...)*", view=None)
                
                try:
                    async with interaction.channel.typing():
                        res = requests.post("http://127.0.0.1:8000/api/chat/approve", json={
                            "session_id": self.session_id,
                            "pending_calls": self.pending_calls,
                            "approved": approved
                        }, timeout=120)
                        
                        if res.ok:
                            data = res.json()
                            reply = data.get("reply", "Execution finished but returned empty output.")
                            
                            # Chunk Discord messages to 2000 chars
                            chunks = [reply[i:i+1900] for i in range(0, len(reply), 1900)]
                            for chunk in chunks:
                                await interaction.channel.send(chunk)
                        else:
                            error_detail = res.json().get("detail", res.text) if "application/json" in res.headers.get("content-type", "") else res.text
                            await interaction.channel.send(f"⚠️ Execution failed: {error_detail}")
                except Exception as e:
                    await interaction.channel.send(f"⚠️ Execution error: {str(e)}")
                    
                if self.channel_id in PENDING_AUTH_STATE:
                    del PENDING_AUTH_STATE[self.channel_id]

        @DISCORD_CLIENT.event
        async def on_ready():
            print(f"[Channels] Discord Worker is now ONLINE and logged in as {DISCORD_CLIENT.user}")

        @DISCORD_CLIENT.event
        async def on_message(message):
            if not IS_RUNNING or message.author == DISCORD_CLIENT.user:
                return

            # Optionally, we can enforce that it only responds to DMs or Mentions.
            # Here we follow a policy where it responds to DMs, or if it is mentioned.
            is_dm = isinstance(message.channel, discord.DMChannel)
            is_mentioned = DISCORD_CLIENT.user in message.mentions
            
            if not is_dm and not is_mentioned:
                return
                
            text = message.content.replace(f'<@{DISCORD_CLIENT.user.id}>', '').strip()
            
            # Using channel.id as unique session scope as long as it's a DM, 
            # otherwise compound channel id + user id to separate different users in channels
            if is_dm:
                session_id = f"discord_{message.channel.id}"
            else:
                session_id = f"discord_{message.channel.id}_{message.author.id}"
                
            try:
                async with message.channel.typing():
                    response = requests.post("http://127.0.0.1:8000/api/chat", json={
                        "message": text,
                        "api_key": api_key,
                        "provider": provider,
                        "session_id": session_id,
                        "system_instruction": "You are Openzess, an AI assistant operating within the user's local operating system. You are communicating with the user via Discord. Keep formatting Discord friendly, using backticks for code."
                    }, timeout=120)
                    
                    if response.ok:
                        data = response.json()
                        if data.get("auth_required"):
                            pending = data.get("pending_calls", [])
                            PENDING_AUTH_STATE[message.channel.id] = pending
                            
                            tools_str = ""
                            for p in pending:
                                tools_str += f"\n• `{p['name']}`\n  `{json.dumps(p.get('args', {}))}`"
                                
                            warning_msg = f"⚠️ **ACTION REQUIRED**\n\nThe AI wants to execute the following dangerous commands on your host machine:\n{tools_str}\n\nDo you want to authorize this?"
                            
                            view = ApprovalView(message.channel.id, pending, session_id)
                            await message.channel.send(warning_msg, view=view)
                            return
                        else:
                            reply = data.get("reply", "AI returned an empty response.")
                    else:
                        try:
                            error_data = response.json()
                            detail = error_data.get("detail", response.text)
                            reply = f"System Warning: {detail}"
                        except:
                            reply = f"System Error {response.status_code}: {response.text}"
                    
                    # Send reply safely split to 2000 chars max which is the discord limit
                    chunks = [reply[i:i+1900] for i in range(0, len(reply), 1900)]
                    for chunk in chunks:
                        await message.channel.send(chunk)
            except Exception as e:
                await message.channel.send(f"⚠️ Connection to Openzess Local Server Failed: {str(e)}")

        try:
            loop.create_task(DISCORD_CLIENT.start(bot_token))
            loop.run_forever()
        except discord.errors.LoginFailure:
            print("[Channels] Invalid Discord Token provided.")
        except Exception as e:
            print(f"[Channels] Discord Worker Error: {e}")

    discord_loop = asyncio.new_event_loop()
    DISCORD_THREAD = threading.Thread(target=run_bot, args=(discord_loop,), daemon=True)
    DISCORD_THREAD.start()
    return True

def stop_discord_listener():
    global DISCORD_CLIENT, IS_RUNNING
    IS_RUNNING = False
    
    if DISCORD_CLIENT and DISCORD_CLIENT.loop:
        future = asyncio.run_coroutine_threadsafe(DISCORD_CLIENT.close(), DISCORD_CLIENT.loop)
        try:
            future.result(timeout=5)
        except Exception as e:
            print(f"[Channels] Expected error during discord close: {e}")
        finally:
            DISCORD_CLIENT.loop.call_soon_threadsafe(DISCORD_CLIENT.loop.stop)
            
    DISCORD_CLIENT = None
    print("[Channels] Discord Worker offline.")
    return True

def get_status():
    return IS_RUNNING
