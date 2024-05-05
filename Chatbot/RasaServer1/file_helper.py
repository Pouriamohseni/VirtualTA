import os
import requests
from service_utility import ConfigUtility
from service_logging import ServiceLogger

TEMP_DIR = "temp"

class FileHelper:
    @staticmethod
    def download_file(file_url, file_name):
        if not os.path.exists(TEMP_DIR):
            ServiceLogger.log(ticket='System', message=f"Creating temp directory: {TEMP_DIR}", criticality='INFO')
            os.makedirs(TEMP_DIR)
        file_path = os.path.join(TEMP_DIR, file_name)
        if not os.path.exists(file_path):
            ServiceLogger.log(ticket='System', message=f"Downloading file from {file_url} to {file_path}", criticality='INFO')

            response = requests.get(file_url)
            if response.status_code == 200:
                ServiceLogger.log(ticket='System', message=f"File downloaded successfully", criticality='INFO')
                with open(file_path, "wb") as file:
                    file.write(response.content)
            else:
                ServiceLogger.log(ticket='System', message=f"Failed to download the file. Status code: {response.status_code}", criticality='ERROR')
                raise Exception(f"Failed to download the file. Status code: {response.status_code}")
        return file_path
    
    @staticmethod
    def delete_file(file_path):
        if os.path.exists(file_path):
            ServiceLogger.log(ticket='System', message=f"Deleting file: {file_path}", criticality='INFO')
            os.remove(file_path)

    @staticmethod
    def get_file_extension(file_name):
        return os.path.split(file_name)[1].split('.')[-1]