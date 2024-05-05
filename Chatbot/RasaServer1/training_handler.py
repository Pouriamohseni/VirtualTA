import os
import datetime
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from app import app, db
import yaml
from service_logging import ServiceLogger

class RasaTrainingHandler:
    @staticmethod
    def get_training_data(name):
        ServiceLogger.log(resource='RasaTrainingHandler', message=f"Getting training data for {name}", criticality='INFO')
        return RasaTrainingHandler.read_yaml(f'data/{name}.yml')
        
    @staticmethod
    def read_yaml(file_path):
        ServiceLogger.log(resource='RasaTrainingHandler', message=f"Reading YAML file: {file_path}", criticality='INFO')
        try:
            with open(file_path, 'r') as file:
                return yaml.safe_load(file) or {}
        except Exception as e:
            ServiceLogger.log(resource='RasaTrainingHandler', message=f"Failed to read YAML file: {file_path}, error: {e}", criticality='ERROR')
            return {}

    @staticmethod
    def write_yaml(file_path, data):
        ServiceLogger.log(resource='RasaTrainingHandler', message=f"Writing YAML file: {file_path}", criticality='INFO')
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'w') as file:
                yaml.safe_dump(data, file, sort_keys=False)
        except Exception as e:
            ServiceLogger.log(resource='RasaTrainingHandler', message=f"Failed to write YAML file: {file_path}, error: {e}", criticality='ERROR')

    @staticmethod
    def update_nlu(intent_name, examples):
        try:
            nlu_path = 'data/nlu.yml'
            nlu_data = RasaTrainingHandler.read_yaml(nlu_path)
            
            # Check if intent already exists
            existing_intent = next((item for item in nlu_data['nlu'] if item.get('intent') == intent_name), None)
            if existing_intent:
                # Update examples
                existing_intent['examples'] = examples
            else:
                # Add new intent
                nlu_data['nlu'].append({'intent': intent_name, 'examples': examples})
            
            with open(nlu_path, 'w') as file:
                yaml.safe_dump(nlu_data, file)
                
            return {'message': 'NLU data updated successfully'}
        except Exception as e:
            ServiceLogger.log(resource='RasaTrainingHandler', message=f"Failed to update NLU data: {e}", criticality='ERROR')
            return {'error': str(e)}

    @staticmethod
    def update_domain(intents=None, responses=None):
        domain_path = 'data/domain.yml'
        domain_data = RasaTrainingHandler.read_yaml(domain_path)
        
        if intents:
            if 'intents' not in domain_data:
                domain_data['intents'] = []
            domain_data['intents'].extend(intents)

        if responses:
            if 'responses' not in domain_data:
                domain_data['responses'] = {}
            domain_data['responses'].update(responses)

        RasaTrainingHandler.write_yaml(domain_path, domain_data)
        return {'message': 'Domain data updated successfully'}

    @staticmethod
    def update_stories(story_name, steps):
        stories_path = 'data/stories.yml'
        stories_data = RasaTrainingHandler.read_yaml(stories_path)
        
        if 'stories' not in stories_data:
            stories_data['stories'] = []

        # Append new story
        stories_data['stories'].append({'story': story_name, 'steps': steps})

        RasaTrainingHandler.write_yaml(stories_path, stories_data)
        return {'message': 'Story data updated successfully'}
    
    @staticmethod
    def update_rules(rule_name, conditions, steps):
        rules_path = 'data/rules.yml'
        rules_data = RasaTrainingHandler.read_yaml(rules_path)
        
        if 'rules' not in rules_data:
            rules_data['rules'] = []

        new_rule = {'rule': rule_name, 'steps': steps}
        if conditions:
            new_rule['condition'] = conditions
        # Append new rule
        rules_data['rules'].append(new_rule)

        RasaTrainingHandler.write_yaml(rules_path, rules_data)
        return {'message': 'Rule data updated successfully'}




    @staticmethod
    def compile_training_files():
        # Compile training data from DB into Rasa format
        return
        # etc.
        # Write this data to the respective Rasa training files

    @staticmethod
    def train_model():
        # Trigger Rasa training
        RasaTrainingHandler.compile_training_files()
        os.system('rasa train')

    @staticmethod
    def test_model():
        # Test the trained model (optional method for convenience)
        os.system('rasa shell nlu')

    @staticmethod
    def get_last_modification_date():
        return

    @staticmethod
    def get_current_date_on_files():
        # Assuming training files are stored in a standard Rasa project structure
        nlu_file_path = 'data/nlu.yml'
        stories_file_path = 'data/stories.yml'
        domain_file_path = 'domain.yml'

        def file_modification_date(file_path):
            try:
                modification_time = os.path.getmtime(file_path)
                return datetime.datetime.fromtimestamp(modification_time)
            except OSError:
                return None

        nlu_mod_date = file_modification_date(nlu_file_path)
        stories_mod_date = file_modification_date(stories_file_path)
        domain_mod_date = file_modification_date(domain_file_path)

        return {
            'nlu.yml': nlu_mod_date,
            'stories.yml': stories_mod_date,
            'domain.yml': domain_mod_date
        }
