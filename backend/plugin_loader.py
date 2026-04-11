import os
import importlib.util

class ToolRegistrar:
    def __init__(self):
        self.funcs = {}
        self.schemas = []

    def register(self, name: str, description: str, schema_params: dict):
        """
        Decorator to register a custom python tool into the agent native ecosystem!
        """
        def decorator(func):
            self.funcs[name] = func
            self.schemas.append({
                "type": "function",
                "function": {
                    "name": name,
                    "description": description,
                    "parameters": {
                        "type": "object",
                        "properties": schema_params.get("properties", {}),
                        "required": schema_params.get("required", [])
                    }
                }
            })
            return func
        return decorator

# Global registry so ANY plugin file can easily import and decorate!
plugin_registry = ToolRegistrar()

def load_plugins():
    """Scans the designated plugins directory and hot-loads all valid python modules natively."""
    plugins_dir = os.path.join(os.path.dirname(__file__), "plugins")
    os.makedirs(plugins_dir, exist_ok=True)
    
    # Optional explicitly write a readme in the folder
    readme_path = os.path.join(plugins_dir, "README.md")
    if not os.path.exists(readme_path):
        with open(readme_path, "w") as f:
            f.write("# Openzess Plugin Ecosystem\n\nDrop custom python scripts here. Decorate your functions with `@plugin_registry.register` to add them dynamically to the Agent's brain!")
    
    count = 0
    for filename in os.listdir(plugins_dir):
        if filename.endswith(".py") and not filename.startswith("__"):
            filepath = os.path.join(plugins_dir, filename)
            module_name = f"plugins.{filename[:-3]}"
            spec = importlib.util.spec_from_file_location(module_name, filepath)
            if spec and spec.loader:
                try:
                    module = importlib.util.module_from_spec(spec)
                    # Expose the global registry natively into the module's namespace
                    module.plugin_registry = plugin_registry
                    spec.loader.exec_module(module)
                    count += 1
                except Exception as e:
                    print(f"[Plugin System] Failed to load plugin {filename}: {e}")
                    
    if count > 0:
        print(f"[Plugin System] Successfully hot-loaded {len(plugin_registry.funcs)} custom tools from {count} plugin files!")
