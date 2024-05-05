import requests
import os
import openai
import pydub
import json
from werkzeug.utils import secure_filename
from service_logging import ServiceLogger

BASEURL = "http://127.0.0.1:34201"
TEMP_DIR = "temp"

def service_online_required(func):
    def wrapper(*args, **kwargs):
        try:
            response = requests.get(f'{BASEURL}/healthcheck')
            if response.status_code != 200:
                raise Exception("Service is not online")
            return func(*args, **kwargs)
        except Exception as e:
            raise Exception(f"Issue with service: {e}")
    return wrapper

def valid_token_required(func):
    def wrapper(*args, **kwargs):
        SERVER_TOKEN = os.environ.get('openai_token')
        if SERVER_TOKEN is None:
            try:
                with open('token.json', 'r') as file:
                    config = json.load(file)
                    SERVER_TOKEN = config.get('api_token')
                    openai.api_key = SERVER_TOKEN
            except Exception as e:
                print(f"Failed to load server token from config.json: {e}")
        if SERVER_TOKEN is None:
            raise Exception("No server token detected.")
        return func(*args, **kwargs)
    return wrapper

class OpenAIHelper:
    """Use this method if we want a boolean response for if the service is online,
    otherwise use the decorator, which raises an exception if the service if offline."""
    @staticmethod
    def online():
        try:
            response = requests.get(f'{BASEURL}/healthcheck')
            if response.status_code == 200:
                return True
        except:
            pass
        return False
    
    @staticmethod
    def whisper_v1(file, extension, format):
        print(f"Received file: {file.filename}")
        print(f"Received file format: {format}")
        if not format:
            format = file.filename.split('.')[-1]

        if format not in ['mp3','wav']:
            raise ValueError("File format not supported")
        
        filename = secure_filename(file.filename)
        if not os.path.exists('uploads'):
            os.makedirs('uploads')
        file_path = os.path.join('uploads', filename)
        file.save(file_path)

        # Function to process the audio segment
        def process_audio_segment(segment, format):
            segment_file = os.path.join('uploads', f'segment.{format}')
            segment.export(segment_file, format=format)
            with open(segment_file, "rb") as audio_file:
                response = openai.Audio.transcribe("whisper-1", audio_file)
            return response['text']

        # Function to clean up files
        def clean_up_files(file_path, segments):
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                for segment_file in segments:
                    if os.path.exists(segment_file):
                        os.remove(segment_file)
            except Exception as e:
                print(f"Error during cleanup: {e}")

        # Check file size and process accordingly
        file_size = os.path.getsize(file_path)
        max_size = 25 * 1024 * 1024  # 25MB in bytes
        transcript = ""

        segment_files = []
        if file_size <= max_size:
            print("Processing file as a whole for audio transcription")
            with open(file_path, "rb") as audio_file:
                response = openai.Audio.transcribe("whisper-1", audio_file)
            transcript = response['text']
        else:
            audio = pydub.AudioSegment.from_file(file_path)
            # PyDub handles time in milliseconds, here we break it into 5-minute segments
            segment_duration = 5 * 60 * 1000
            for i in range(0, len(audio), segment_duration):
                print(f"Processing segment {i}")
                segment = audio[i:i + segment_duration]
                transcript += process_audio_segment(segment, format)
                segment_files.append(os.path.join('uploads', f'segment.{format}'))

        # Clean up files
        clean_up_files(file_path, segment_files)
        return transcript


class FileHelper:
    @staticmethod
    def download_file(file_url, file_name):
        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR)
        file_path = os.path.join(TEMP_DIR, file_name)
        if not os.path.exists(file_path):

            response = requests.get(file_url)
            if response.status_code == 200:
                with open(file_path, "wb") as file:
                    file.write(response.content)
            else:
                raise Exception(f"Failed to download the file. Status code: {response.status_code}")
        return file_path
    
    @staticmethod
    def delete_file(file_path):
        if os.path.exists(file_path):
            os.remove(file_path)

    @staticmethod
    def get_file_extension(file_name):
        return os.path.split(file_name)[1].split('.')[-1]