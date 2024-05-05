# IF NEEDING TO CREATE A VIRTUAL ENVIROMENT, USE THE FOLLOWING COMMANDS:
# NOTE: REPLACE THE PATH WITH THE PATH TO YOUR PYTHON EXECUTABLE (PYTHON39)

# "C:\Users\kev\AppData\Local\Programs\Python\Python39\python.exe" -m venv env
# env\Sripts\activate
# pip install rasa

import subprocess
import os
import sys
from flask import Flask, jsonify, request, send_from_directory

import requests
from rasa_api import RasaAPI
from openai_helper import OpenAIHelper
from training_handler import RasaTrainingHandler
import uuid
from file_helper import FileHelper
from service_utility import ConfigUtility
from service_logging import ServiceLogger
from app import app, db, User, Session
import yaml
from datetime import datetime, timedelta
import pyotp

# static file serving (temp only)
@app.route('/styles', methods=['GET'])
def static_files():
    return send_from_directory('static', 'styles.css')

@app.route('/admin', methods=['GET'])
def static_admin():
    return send_from_directory('static/html', 'admin_rasa_config.html')

@app.route('/static/html/<page_name>', methods=['GET'])
def static_html_pages(page_name):
    return send_from_directory('static/html', page_name)

# login related imports


@app.route('/api/rasa', methods=['POST'])
def rasa():
    RasaAPI.check_and_run_rasa()
    return jsonify({'status': 'ok'})

@app.route('/enhanced_inputs_available', methods=['GET'])
def check_openai_service():
    return jsonify({'status': OpenAIHelper.online()})

@app.route('/healthcheck', methods=['GET', 'POST', 'PUT', 'DELETE'])
def healthcheck():
    return jsonify({'status': 'ok'})

@app.route('/version', methods=['GET'])
def ServerVersion():
    return jsonify({'version':'24.16.3'})

@app.route('/api/threads/get-threads/<user_id>', methods=['GET'])
def get_threads(user_id):
    return jsonify(RasaAPI.get_threads(user_id))

@app.route('/api/threads/get-threads-with-preview/<user_id>', methods=['GET'])
def get_threads_with_first_chat_preview(user_id):
    threads_with_preview = RasaAPI.get_threads_with_first_chat_preview(user_id)
    return jsonify(threads_with_preview)

@app.route('/api/threads/<thread_id>', methods=['GET'])
def get_thread(thread_id):
    return jsonify(RasaAPI.search_chat_logs(query_thread_id=thread_id)), 200

@app.route('/admin/rasaserver1/generate_response', methods=['POST'])
@app.route('/generate_response', methods=['POST'])
@app.route('/webhooks/rest/webhook', methods=['POST']) # mirroring route that Rasa uses for seamless switching
def rasa_webhook():
    text_content = ""
    thread_id = request.json.get('sender', None)
    if not thread_id:
        thread_id = str(uuid.uuid4())

    if thread_id in ConfigUtility.get_config_value('chat_banned_thread_ids', []):
        return jsonify({'error': 'Chat banned'}), 403
    
    user_id = request.json.get('user_id', 'dev-test')

    if user_id in ConfigUtility.get_config_value('chat_banned_user_ids', []):
        return jsonify({'error': 'User banned from chat'}), 403

    # check if rate limit is hit
    if ConfigUtility.is_rate_limit_hit(thread_id):
        return jsonify({'error': 'Rate limit hit'}), 429
    
    message = request.json.get('message', '')
    text_content += message

    # Handle audio file if present
    audio_file = request.files.get('audio_file')
    if audio_file:
        file = request.files['audio_file']
        extension = request.headers.get('File-Extension', '')
        format = extension.replace('.', '')
        try:
            audio_text = OpenAIHelper.whisper_v1(file, extension, format)
            if audio_text:
                text_content += audio_text
        except Exception as e:
            ServiceLogger.log(resource='OpenAI', message=f"Failed to generate speech with OpenAI: {e}", criticality='ERROR')
            # return jsonify({'error': 'Failed to transcribe audio'}), 500

    # Ensure there's content to process
    if not text_content:
        return jsonify({'error': 'Missing content to process'}), 400
    
    # Use the RasaAPI to generate a response based on the aggregated text_content
    try:
        ServiceLogger.log(resource='RasaAPI', message=f"Generating response for thread_id: {thread_id}, message: {text_content}", criticality='INFO')
        response = RasaAPI.generate_response(thread_id, text_content, user_id)
        return jsonify(response)
    except Exception as e:
        return jsonify({'error': 'An error occurred while generating a response. Please try again later, or contact a developer.'}), 500

@app.route('/admin/rasaserver1/admin/training_data/<name>', methods=['GET'])
@app.route('/training_data/<name>', methods=['GET'])
def get_training_data(name):
    data = RasaTrainingHandler.get_training_data(name)
    return jsonify(data), 200

@app.route('/admin/rasaserver1/admin/training_data/nlu', methods=['POST'])
@app.route('/training_data/nlu', methods=['POST'])
def update_nlu():
    data = request.json
    intent_name = data['intent_name']
    examples = data['examples']
    return jsonify(RasaTrainingHandler.update_nlu(intent_name, examples)), 200

@app.route('/admin/rasaserver1/admin/training_data/domain', methods=['POST'])
@app.route('/training_data/domain', methods=['POST'])
def update_domain():
    data = request.json
    intents = data.get('intents', [])
    responses = data.get('responses', {})
    return jsonify(RasaTrainingHandler.update_domain(intents, responses)), 200

@app.route('/admin/rasaserver1/admin/training_data/stories', methods=['POST'])
@app.route('/training_data/stories', methods=['POST'])
def update_stories():
    data = request.json
    story_name = data['story_name']
    steps = data['steps']
    return jsonify(RasaTrainingHandler.update_stories(story_name, steps)), 200

@app.route('/admin/rasaserver1/admin/training_data/rules', methods=['POST'])
@app.route('/training_data/rules', methods=['POST'])
def update_rules():
    data = request.json
    rule_name = data['rule_name']
    conditions = data.get('conditions', None)
    steps = data['steps']
    return jsonify(RasaTrainingHandler.update_rules(rule_name, conditions, steps)), 200

@app.route('/admin/rasaserver1/admin/training_data/compile', methods=['POST'])
@app.route('/training/compile', methods=['POST'])
def compile_training_files():
    RasaTrainingHandler.compile_training_files()
    return jsonify({'message': 'Training files compiled successfully'}), 200

@app.route('/admin/rasaserver1/admin/training_data/update', methods=['POST'])
@app.route('/training/retrain', methods=['POST'])
def train_model():
    RasaTrainingHandler.train_model()
    return jsonify({'message': 'Model retraining initiated successfully'}), 200

@app.route('/admin/rasaserver1/admin/training_data/update_nlu', methods=['POST'])
@app.route('/training/last_modification_date', methods=['GET'])
def get_last_modification_date():
    last_mod_date = RasaTrainingHandler.get_last_modification_date()
    return jsonify({'last_modification_date': last_mod_date}), 200

@app.route('/admin/rasaserver1/admin/training_data/test', methods=['POST'])
@app.route('/training/file_modification_dates', methods=['GET'])
def get_file_modification_dates():
    mod_dates = RasaTrainingHandler.get_current_date_on_files()
    return jsonify(mod_dates), 200

# config management
@app.route('/admin/rasaserver1/admin/get_config', methods=['GET'])
@app.route('/admin/get_config', methods=['GET'])
def get_config():
    return jsonify(ConfigUtility.get_config()), 200

@app.route('/admin/rasaserver1/admin/get_config_value', methods=['GET'])
@app.route('/admin/get_config_value', methods=['GET'])
def get_config_value():
    key = request.args.get('key')
    return jsonify(ConfigUtility.get_config_value(key)), 200

@app.route('/admin/rasaserver1/admin/set_config_value', methods=['POST'])
@app.route('/admin/set_config_value', methods=['POST'])
def set_config_value():
    data = request.json
    key = data['key']
    value = data['value']
    return jsonify(ConfigUtility.set_config_value(key, value)), 200

@app.route('/admin/rasaserver1/admin/delete_config_value', methods=['POST'])
@app.route('/admin/delete_config_value', methods=['POST'])
def delete_config_value():
    data = request.json
    key = data['key']
    if not key:
        return jsonify({'error': 'Key not provided'}), 400
    return jsonify(ConfigUtility.delete_config_value(key)), 200

@app.route('/admin/rasaserver1/admin/regenerate_default_config', methods=['POST','GET'])
@app.route('/admin/regenerate_default_config', methods=['POST','GET'])
def regenerate_default_config():
    return jsonify(ConfigUtility.regenerate_default_config()), 200

# Event log viewing
@app.route('/admin/rasaserver1/admin/event_log', methods=['GET'])
@app.route('/admin/event_log', methods=['GET'])
def event_log():
    query_criticality = request.args.get('criticality')
    query_start_time = request.args.get('start_time')
    query_end_time = request.args.get('end_time')
    query_resource = request.args.get('resource')

    logs = ServiceLogger.search_logs(query_criticality, query_start_time, query_end_time, query_resource)
    return jsonify(logs), 200

# Chat log viewing
@app.route('/admin/rasaserver1/admin/chat_log', methods=['GET'])
@app.route('/admin/chat_log', methods=['GET'])
def chat_log():
    query_thread_id = request.args.get('thread_id')
    query_user_id = request.args.get('user_id')
    query_message_id = request.args.get('message_id')
    query_side = request.args.get('side')
    query_start_time = request.args.get('start_time')
    query_end_time = request.args.get('end_time')
    query_flagged = request.args.get('flagged')
    return jsonify(RasaAPI.search_chat_logs(query_thread_id, query_user_id, query_message_id, query_side, query_start_time, query_end_time, query_flagged)), 200


@app.route('/api/flag_message/<message_id>', methods=['PUT'])
@app.route('/admin/rasaserver1/admin/flag_conversation/<message_id>', methods=['PUT'])
@app.route('/admin/flag_conversation/<message_id>', methods=['PUT'])
def flag_conversation(message_id):
    return jsonify(RasaAPI.flag_conversation(message_id, flag=True)), 200

@app.route('/admin/rasaserver1/admin/unflag_conversation/<message_id>', methods=['PUT'])
@app.route('/admin/unflag_conversation/<message_id>', methods=['PUT'])
def unflag_conversation(message_id):
    return jsonify(RasaAPI.flag_conversation(message_id, flag=False)), 200

@app.route('/admin/rasaserver1/admin/ban_chat/<thread_id>', methods=['POST'])
@app.route('/admin/sessions', methods=['GET'])
def list_sessions():
    # Add your admin check logic here
    sessions = Session.query.all()
    sessions_info = [{'id': session.id, 'user_email': session.user_email, 'expires_at': session.expires_at} for session in sessions]
    return jsonify(sessions_info), 200

@app.route('/admin/sessions/revoke/<int:session_id>', methods=['POST'])
def revoke_session(session_id):
    # Add your admin check logic here
    if Session.revoke_session(session_id):
        return jsonify({"msg": "Session revoked successfully"}), 200
    else:
        return jsonify({"msg": "Session not found"}), 404
    
@app.route('/api/users/is-admin/<user_id>', methods=['GET'])
def is_admin(user_id):
    return jsonify({"is_admin": user_id in ConfigUtility.get_config_value('admin_uuids')}), 200
    
@app.route('/register', methods=['POST'])
def register():
    payload = request.json
    username = payload.get('username')
    password = payload.get('password')
    first_name = payload.get('first_name')
    last_name = payload.get('last_name')
    mfa_enabled = payload.get('mfa_enabled', False)

    # Check if user already exists
    user = User.query.filter_by(username=username).first()
    if user:
        return jsonify({"msg": "User already exists"}), 400
    
    # Generate MFA secret if MFA is enabled
    mfa_secret = None
    if mfa_enabled:
        mfa_secret = pyotp.random_base32()

    # Create user
    user = User(username=username, first_name=first_name, last_name=last_name, mfa_secret=mfa_secret)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({
        "msg": "User created successfully",
        "mfa_secret": mfa_secret if mfa_secret else None
    }), 201


@app.route('/admin/validate-mfa', methods=['POST'])
def validate_mfa_on_signin():
    data = request.json
    mfa_secret = data.get('mfa_secret', None)

    if not mfa_secret:
        return jsonify({"msg": "MFA secret not provided"}), 400
    
    mfa_key = pyotp.TOTP(mfa_secret).now()
    return jsonify({"mfa_key": mfa_key}), 200

@app.route('/api/audio_transcription/whisper', methods=['POST'])
def transcribe_audio_whisper():
    print(f'Current Working Directory: {os.getcwd()}')

    if 'upload' not in request.files:
        return jsonify({'message': 'No file provided'}), 400

    file = request.files['upload']
    extension = request.headers.get('File-Extension', '')
    format = extension.replace('.', '')

    try:
        return jsonify({'message': OpenAIHelper.whisper_v1(file, extension, format)}), 200
    except Exception as e:
        return jsonify({'message': str(e)}), 500

if __name__ == '__main__':
    RasaAPI.check_and_run_rasa()
    app.run(port='37821', host='0.0.0.0', debug=False)