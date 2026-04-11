import psutil
import platform
import os
from plugin_loader import plugin_registry

@plugin_registry.register(
    name="get_system_health",
    description="Retrieves live natively-polled hardware diagnostics (RAM, CPU, and Disk metrics). Useful for system administrator monitoring tasks.",
    schema_params={"properties": {}, "required": []}
)
def get_system_health():
    """
    Returns an aggressively formatted string of current PC metrics.
    """
    try:
        # Memory Info
        ram_info = psutil.virtual_memory()
        total_ram = round(ram_info.total / (1024**3), 2)
        used_ram = round(ram_info.used / (1024**3), 2)
        ram_percent = ram_info.percent

        # CPU Info
        cpu_percent = psutil.cpu_percent(interval=0.5)
        cpu_cores = psutil.cpu_count(logical=True)
        cpu_freq = psutil.cpu_freq()
        freq_str = f" @ {round(cpu_freq.current, 2)}Mhz" if cpu_freq else ""

        # Disk Info
        disk_info = psutil.disk_usage('/')
        total_disk = round(disk_info.total / (1024**3), 2)
        used_disk = round(disk_info.used / (1024**3), 2)

        sys_os = f"{platform.system()} {platform.release()}"

        return f"""[LIVE HARDWARE DIAGNOSTICS]
OS: {sys_os}
CPU: {cpu_percent}% Utilized across {cpu_cores} cores{freq_str}
RAM: {ram_percent}% Utilized ({used_ram}GB / {total_ram}GB)
ROOT DISK (/): {disk_info.percent}% Full ({used_disk}GB / {total_disk}GB)
"""
    except Exception as e:
        return f"Error gathering diagnostic health data: {e}"
