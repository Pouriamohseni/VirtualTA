import requests
import subprocess
import sys
from flask_sqlalchemy import SQLAlchemy
import uuid
from flask import Flask
from app import app, db, ConversationMessage
from service_utility import ConfigUtility
from service_logging import ServiceLogger

def service_online_required(func):
    def wrapper(*args, **kwargs):
        try:
            if ConfigUtility.get_config_value('debug_mode',default_return_value=False):
                ServiceLogger.log(resource='RasaAPI', message=f"Debug mode is enabled, skipping service check", criticality='DEBUG')
                return func(*args, **kwargs)
            
            rasa_url = ConfigUtility.get_config_value('rasa_url', default_return_value="http://localhost:5005")
            response = requests.get(f'{rasa_url}/')
            if response.status_code != 200:
                ServiceLogger.log(resource='RasaAPI', message=f"Service is not online", criticality='CRITICAL')
                raise Exception("Service is not online")
            return func(*args, **kwargs)
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Issue with service: {e}", criticality='ERROR')
            raise Exception(f"Issue with service: {e}")
    return wrapper

class RasaAPI:
    @staticmethod
    def check_and_install_rasa() -> None:
        ServiceLogger.log(resource='RasaAPI', message=f"Checking if Rasa is installed", criticality='INFO')
        result = subprocess.run([sys.executable, "-m", "pip", "show", "rasa"], capture_output=True, text=True)
        if 'Name: rasa' not in result.stdout:
            ServiceLogger.log(resource='RasaAPI', message=f"Rasa is not installed. Please run 'pip install -r requirements.txt' in the same directory as this flask server to install Rasa, along with any other dependencies.", criticality='CRITICAL')
            sys.exit(1)
        else:
            ServiceLogger.log(resource='RasaAPI', message=f"Rasa is already installed", criticality='INFO')
            return

    @staticmethod
    def check_and_run_rasa() -> None:
        if not ConfigUtility.get_config_value('startup_check_rasa_running', default_return_value=False):
            return
        try:
            ServiceLogger.log(resource='RasaAPI', message=f"Checking if Rasa is running", criticality='INFO')
            rasa_url = ConfigUtility.get_config_value('rasa_url', default_return_value="http://localhost:5005")
            response = requests.get(rasa_url)
            if response.status_code == 200:
                ServiceLogger.log(resource='RasaAPI', message=f"Rasa is already running", criticality='INFO')
                return
            else:
                raise Exception("Rasa is not running")
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Rasa is not running: {e}", criticality='ERROR')
            print("Rasa is not running...")
            if not ConfigUtility.get_config_value('startup_check_python_version', default_return_value=False):
                return
            ServiceLogger.log(resource='RasaAPI', message=f"Checking that Python 3.9 is version of instance", criticality='INFO')

            if sys.version_info.major != 3 or sys.version_info.minor != 9:
                ServiceLogger.log(resource='RasaAPI', message=f"Error: This application requires Python 3.9", criticality='CRITICAL')
                sys.exit(1)

            ServiceLogger.log(resource='RasaAPI', message=f"Python 3.9 is the version of the instance.", criticality='INFO')
            ServiceLogger.log(resource='RasaAPI', message=f"Checking if Rasa is installed", criticality='INFO')

            if not ConfigUtility.get_config_value('startup_check_rasa_installed', default_return_value=False):
                return
            RasaAPI.check_and_install_rasa()

            ServiceLogger.log(resource='RasaAPI', message=f"Starting Rasa now...", criticality='INFO')
            
            if ConfigUtility.get_config_value('startup_start_rasa_if_not_running_post_check', default_return_value=False):
                subprocess.Popen([sys.executable, "-m", "rasa", "run"])

    @staticmethod
    @service_online_required
    def generate_response(thread_id: str, message: str, user_id: str) -> dict:
        ServiceLogger.log(resource='RasaAPI', message=f"Generating response for thread_id: {thread_id}, message: {message}", criticality='INFO')
        sender_message_id = str(uuid.uuid4())
        response_message_id = str(uuid.uuid4())
        user_message = ConversationMessage(thread_id=thread_id, message_id=sender_message_id, side='user', message_content=message, user_id=user_id)
        db.session.add(user_message)
        db.session.commit()

        try:
            flagged_response = False
            if not ConfigUtility.get_config_value('debug_mode', default_return_value=False):
                rasa_url = ConfigUtility.get_config_value('rasa_url', default_return_value="http://localhost:5005")
                response = requests.post(f'{rasa_url}/webhooks/rest/webhook', json={'sender': thread_id, 'message': message})
                response_data = response.json()
                # Ensure response_data is not empty and contains 'text'
                if response_data and 'text' in response_data[0]:
                    bot_message_content = response_data[0]['text']
                else:
                    bot_message_content = "I'm sorry, I don't understand. Can you please rephrase your question?"
                    flagged_response = True
            else:
                bot_message_content = "DEBUG MODE: The bot is working fine. Test URL https://www.google.com"
                response_data = [{'text': bot_message_content}]
            bot_message = ConversationMessage(thread_id=thread_id, message_id=response_message_id, side='bot', message_content=bot_message_content, flagged=flagged_response, user_id=user_id)
            db.session.add(bot_message)
            db.session.commit()
            ServiceLogger.log(resource='RasaAPI', message=f"Response generated successfully", criticality='INFO')
            # Assuming you still want to return the modified response data structure
            if response_data:
                response_data[0]['thread_id'] = thread_id
                response_data[0]['sender_message_id'] = sender_message_id
                response_data[0]['response_message_id'] = response_message_id
                return response_data
            else:
                return [{'text': bot_message_content, 'thread_id': thread_id, 'sender_message_id': sender_message_id, 'response_message_id': response_message_id}]
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Failed to generate response: {e}", criticality='ERROR')
            return {'error': 'Failed to generate response'}
        
    @staticmethod
    def search_chat_logs(query_thread_id = None, query_user_id = None, query_message_id = None, query_side = None, query_start_time = None, query_end_time = None, query_flagged = None):
        try:
            query = ConversationMessage.query
            if query_thread_id:
                query = query.filter(ConversationMessage.thread_id == query_thread_id)
            if query_user_id:
                query = query.filter(ConversationMessage.user_id == query_user_id)
            if query_message_id:
                query = query.filter(ConversationMessage.message_id == query_message_id)
            if query_side:
                query = query.filter(ConversationMessage.side == query_side)
            if query_start_time:
                query = query.filter(ConversationMessage.timestamp >= query_start_time)
            if query_end_time:
                query = query.filter(ConversationMessage.timestamp <= query_end_time)
            if query_flagged:
                query = query.filter(ConversationMessage.flagged == query_flagged)
            messages = query.all()
            print(messages)
            return [message.to_dict() for message in messages]
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Failed to search chat logs: {e}", criticality='ERROR')
            return []

    @staticmethod
    def flag_conversation(message_id, flag=True):
        try:
            message = ConversationMessage.query.filter(ConversationMessage.message_id == message_id).first()
            message.flagged = flag
            db.session.commit()
            return {'message': f'Conversation {"flagged" if flag else "unflagged"} successfully'}
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Failed to flag conversation: {e}", criticality='ERROR')
            return {'error': 'Failed to flag conversation'}
        
    @staticmethod
    def get_threads(user_id):
        try:
            # Query the ConversationMessage table to get all entries matching the given user_id
            threads = ConversationMessage.query.filter_by(user_id=user_id).all()
            # Use a set to avoid duplicates and collect all unique thread IDs
            unique_thread_ids = {message.thread_id for message in threads}
            # Convert the set to a list to return it
            return list(unique_thread_ids)
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Failed to get threads for user_id {user_id}: {e}", criticality='ERROR')
            return []
        
    @staticmethod
    def get_threads_with_first_chat_preview(user_id):
        try:
            # Query to get all messages for the given user_id, ordered by thread_id and timestamp
            messages = ConversationMessage.query.filter_by(user_id=user_id).order_by(ConversationMessage.thread_id, ConversationMessage.timestamp).all()

            # Dictionary to store the first message of each thread
            threads_preview = {}
            for message in messages:
                # Check if the thread_id is already in the dictionary
                if message.thread_id not in threads_preview:
                    # Extract the first 5 words of the message content
                    preview_words = ' '.join(message.message_content.split()[:5])
                    # Store the thread_id and the message preview in the dictionary
                    threads_preview[message.thread_id] = {
                        'thread_id': message.thread_id,
                        'first_message_preview': preview_words,
                        'created': message.timestamp
                    }

            # Convert the dictionary values to a list for return
            return list(threads_preview.values())
        except Exception as e:
            ServiceLogger.log(resource='RasaAPI', message=f"Failed to get threads with chat preview for user_id {user_id}: {e}", criticality='ERROR')
            return []
        
if __name__ == '__main__':
    with app.app_context():
        thread_id = str(uuid.uuid4())
        bot_message = ConversationMessage(thread_id=thread_id, side='bot', message_content="This is another thread here bla bla bla bla")
        user_message = ConversationMessage(thread_id=thread_id, side='user', message_content="Beep boop me no have training data yet beep booooooooop")
        db.session.add(bot_message)
        db.session.add(user_message)
        db.session.commit()