import json
import base64
from PIL import Image
import os

def parse_tavern_png(file_path: str):
    """
    Parses a SillyTavern Character Card (PNG) to extract the hidden base64 'chara' JSON payload
    from the EXIF tEXt chunks, and returns the unified dictionary alongside the avatar base64.
    """
    try:
        with Image.open(file_path) as img:
            img.load()
            text_metadata = img.info
            
            chara_data = text_metadata.get('chara')
            if not chara_data:
                raise ValueError("No 'chara' embedded data found in this PNG. It may not be a valid SillyTavern V2/V3 card.")
                
            decoded_bytes = base64.b64decode(chara_data)
            decoded_str = decoded_bytes.decode('utf-8')
            data = json.loads(decoded_str)
            
            # Usually nested under 'data'
            char_info = data.get("data", data)
            
        with open(file_path, "rb") as image_file:
            avatar_b64 = "data:image/png;base64," + base64.b64encode(image_file.read()).decode('utf-8')
            
        return {
            "name": char_info.get("name", "Unknown Persona"),
            "description": char_info.get("description", ""),
            "personality": char_info.get("personality", ""),
            "scenario": char_info.get("scenario", ""),
            "first_mes": char_info.get("first_mes", ""),
            "mes_example": char_info.get("mes_example", ""),
            "avatar_base64": avatar_b64
        }
    except Exception as e:
        raise Exception(f"Failed to parse Tavern PNG: {e}")

def parse_tavern_json(file_path: str):
    """
    Fallback parser for direct JSON character files.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            char_info = data.get("data", data)
            return {
                "name": char_info.get("name", "Unknown Persona"),
                "description": char_info.get("description", ""),
                "personality": char_info.get("personality", ""),
                "scenario": char_info.get("scenario", ""),
                "first_mes": char_info.get("first_mes", ""),
                "mes_example": char_info.get("mes_example", ""),
                "avatar_base64": "" # No avatar in json cards natively without a separate file
            }
    except Exception as e:
         raise Exception(f"Failed to parse Tavern JSON: {e}")
