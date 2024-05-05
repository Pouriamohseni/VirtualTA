import os
import datetime
import json
from service_logging import ServiceLogger

CONFIG_FILE = "config.json"
CONFIG = None

LAST_ACTION_TIMES = {}

def require_loaded_config(func):
    def wrapper(*args, **kwargs):
        if not CONFIG:
            ServiceLogger.log(resource='System', message=f"Config not loaded, loading now", criticality='WARNING')
            load_config()
        return func(*args, **kwargs)
    return wrapper

def load_config():
    global CONFIG
    ServiceLogger.log(resource='System', message=f"Loading config.json", criticality='INFO')
    if not os.path.exists(CONFIG_FILE):
        ServiceLogger.log(resource='System', message=f"Config file not found. Regenerating default config.json", criticality='WARNING')
        ConfigUtility.regenerate_default_config()
    with open(CONFIG_FILE, 'r') as file:
        CONFIG = json.load(file)
    if not CONFIG:
        ServiceLogger.log(resource='System', message=f"Config is blank, regenerating default config", criticality='WARNING')
        CONFIG = ConfigUtility.regenerate_default_config()
    ServiceLogger.log(resource='System', message=f"Successfully loaded config.json", criticality='INFO')
    return CONFIG

class ConfigUtility:
    @staticmethod
    @require_loaded_config
    def get_config():
        return CONFIG
    
    @staticmethod
    @require_loaded_config
    def save_config():
        try:
            with open(CONFIG_FILE, 'w') as f:
                json.dump(CONFIG, f, indent=2)
            ServiceLogger.log(resource='Admin', message=f"Saved {CONFIG_FILE}", criticality='INFO')
        except Exception as e:
            ServiceLogger.log(resource='Admin', message=f"Failed to save {CONFIG_FILE}: {e}", criticality='ERROR')

    @staticmethod
    def regenerate_default_config():
        global CONFIG
        CONFIG = {
            "logs_alert_on_criticality": {
                "DEBUG": False,
                "INFO": False,
                "WARNING": False,
                "ERROR": False,
                "CRITICAL": True
            },
            "chat_rate_limit": False,
            "chat_rate_limit_seconds": 5,
            "chat_banned_uuids": [
                "12345678-1234-5678-1234-567812345678",
                "87654321-4321-8765-4321-876543218765"
            ],
            "admin_uuids": [
                'admin',
                'dev-test'
            ],
            "chat_banned_thread_ids": [],
            "chat_banned_user_ids": [],
            "startup_check_python_version": False,
            "startup_check_rasa_installed": False,
            "startup_check_rasa_running": False,
            "startup_start_rasa_if_not_running_post_check": False,
            "ai_helper_enabled": True,
            "rasa_url": "http://localhost:5005",
            "debug_mode": False,
        }
        ServiceLogger.log(resource='Admin', message=f"Regenerating default {CONFIG_FILE}", criticality='CRITICAL')
        ConfigUtility.save_config()
        return CONFIG

    @staticmethod
    @require_loaded_config
    def get_config_value(key, default_return_value = None):
        ServiceLogger.log(resource='System', message=f'Getting config value: {key}', criticality='INFO')
        key_parts = key.split('.')
        target = CONFIG
        for part in key_parts:
            if part not in target:
                ServiceLogger.log(resource='System', message=f"Failed to get config value: {key}", criticality='WARNING')
                return default_return_value
            target = target[part]
        ServiceLogger.log(resource='System', message=f"Successfully got config value {key}. Current Value: {target}", criticality='DEBUG')
        return target

    @staticmethod
    @require_loaded_config
    def set_config_value(key, value):
        key_parts = key.split('.')
        target = CONFIG
        for part in key_parts[:-1]:
            if part not in target:
                target[part] = {}
            target = target[part]
        target[key_parts[-1]] = value

        with open(CONFIG_FILE, 'w') as file:
            json.dump(CONFIG, file, indent=4)
        ServiceLogger.log(resource='System', message=f"Updated config.json: {key}={value}", criticality='DEBUG')

    @staticmethod
    @require_loaded_config
    def delete_config_value(key):
        key_parts = key.split('.')
        target = CONFIG
        for part in key_parts[:-1]:
            if part not in target:
                # If part doesn't exist, no need to delete
                return
            target = target[part]
        if key_parts[-1] in target:
            del target[key_parts[-1]]

        with open(CONFIG_FILE, 'w') as file:
            json.dump(CONFIG, file, indent=4)
        ServiceLogger.log(resource='System', message=f"Deleted config value: {key}", criticality='DEBUG')

    @staticmethod
    def is_rate_limit_hit(thread_id):
        ServiceLogger.log(resource='System', message=f"Checking rate limit for thread_id: {thread_id}", criticality='INFO')
        rate_limit_enabled = ConfigUtility.get_config_value('chat_rate_limit')
        if not rate_limit_enabled:
            ServiceLogger.log(resource='System', message=f"Rate limit not enabled", criticality='INFO')
            return False
        rate_limit_seconds = ConfigUtility.get_config_value('chat_rate_limit_seconds')
        if not rate_limit_seconds or rate_limit_seconds < 1:
            ServiceLogger.log(resource='System', message=f"Rate limit seconds not set", criticality='WARNING')
            return False
        
        last_action_time = LAST_ACTION_TIMES.get(thread_id)
        if not last_action_time:
            ServiceLogger.log(resource='System', message=f"No last action time found for thread_id: {thread_id}", criticality='INFO')
            return False
        
        time_since_last_action = datetime.datetime.now() - last_action_time
        if time_since_last_action.total_seconds() < rate_limit_seconds:
            ServiceLogger.log(resource='System', message=f"Rate limit hit for thread_id: {thread_id}", criticality='INFO')
            return True
        

        
# Example Usage
if __name__ == '__main__':
    print("")
    ConfigUtility.regenerate_default_config()
    