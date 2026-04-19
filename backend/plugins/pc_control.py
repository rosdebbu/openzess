import pyautogui
import os
import base64
from plugin_loader import plugin_registry

# Enforce fail-safe (abort if mouse goes to corner)
pyautogui.FAILSAFE = True

# Disable pauses for AI efficiency
pyautogui.PAUSE = 0.1

@plugin_registry.register(
    name="take_screenshot",
    description="Takes a screenshot of the virtual desktop matrix and mounts it directly into your visual cortex so you can SEE the screen. Use this before trying to click anything to get exact coordinates.",
    schema_params={"properties": {}, "required": []}
)
def take_screenshot():
    try:
        # Note: PyAutoGUI uses scrot natively on linux to screenshot the root X window.
        screenshot_path = os.path.join(os.getcwd(), "temp_matrix_screen.png")
        pyautogui.screenshot(screenshot_path)
        
        # We don't read the base64 here because the LLM standard OpenAPI tool schema doesn't allow image arrays.
        # Instead, agent.py will detect this specific tool name and inject the image natively outside this boundary.
        return f"[SYSTEM SUCCESS] Screenshot created at {screenshot_path}. The Neural Router will intercept this and inject it into your visual cortex immediately."
    except Exception as e:
        return f"Screenshot failed in WSL matrix: {str(e)}"

@plugin_registry.register(
    name="mouse_click",
    description="Moves the mouse to the exact pixel (x, y) on the screen and clicks.",
    schema_params={
        "properties": {
            "x": {"type": "integer"}, 
            "y": {"type": "integer"},
            "clicks": {"type": "integer", "description": "1 for single, 2 for double click (default 1)"}
        }, 
        "required": ["x", "y"]
    }
)
def mouse_click(x: int, y: int, clicks: int = 1):
    try:
        pyautogui.click(x=x, y=y, clicks=clicks)
        return f"Successfully clicked at ({x}, {y})."
    except Exception as e:
        return str(e)

@plugin_registry.register(
    name="keyboard_type",
    description="Types the exact string on the keyboard.",
    schema_params={
        "properties": {
            "text": {"type": "string"},
            "press_enter": {"type": "boolean", "description": "Set to true to press Enter after typing"}
        }, 
        "required": ["text"]
    }
)
def keyboard_type(text: str, press_enter: bool = False):
    try:
        pyautogui.write(text, interval=0.05)
        if press_enter:
            pyautogui.press('enter')
        return f"Successfully typed '{text}'"
    except Exception as e:
        return str(e)

@plugin_registry.register(
    name="keyboard_press",
    description="Presses a specific control key (e.g., 'enter', 'esc', 'win', 'ctrl', 'tab'). Use for navigating.",
    schema_params={
        "properties": {
            "key": {"type": "string"}
        }, 
        "required": ["key"]
    }
)
def keyboard_press(key: str):
    try:
        pyautogui.press(key)
        return f"Pressed key: {key}"
    except Exception as e:
        return str(e)

@plugin_registry.register(
    name="keyboard_hotkey",
    description="Presses a combination of keys simultaneously (e.g., ['ctrl', 't'] to open a new tab, ['ctrl', 'c'] to copy).",
    schema_params={
        "properties": {
            "keys": {
                "type": "array",
                "items": {"type": "string"}
            }
        }, 
        "required": ["keys"]
    }
)
def keyboard_hotkey(keys: list):
    try:
        pyautogui.hotkey(*keys)
        return f"Executed hotkey: {' + '.join(keys)}"
    except Exception as e:
        return str(e)

@plugin_registry.register(
    name="launch_application",
    description="Launches an application or opens a URL in the default browser. e.g. path='chrome', path='https://google.com'",
    schema_params={
        "properties": {
            "path_or_url": {"type": "string", "description": "The command, app name, or URL to open."}
        }, 
        "required": ["path_or_url"]
    }
)
def launch_application(path_or_url: str):
    import webbrowser
    import subprocess
    try:
        if path_or_url.startswith('http://') or path_or_url.startswith('https://'):
            webbrowser.open(path_or_url)
            return f"Opened URL in browser: {path_or_url}"
        else:
            # Simple fallback for OS commands like 'chrome' or 'notepad'
            subprocess.Popen(path_or_url, shell=True)
            return f"Launched application: {path_or_url}"
    except Exception as e:
        return f"Failed to launch: {str(e)}"
