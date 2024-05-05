import json
import os
import logging
import datetime

# Global logger setup
LOG_FILE = 'Service_logs.log'
logger = logging.getLogger('ServiceLogger')
logger.setLevel(logging.DEBUG)  # Adjust as needed
handler = logging.FileHandler(LOG_FILE)
handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)

class ServiceLogger:
    @staticmethod
    def log(resource='System', message='', criticality='INFO'):
        print(f'Logging: {message}')
        log_entry = {
            'timestamp': str(datetime.datetime.now()),
            'resource': resource,
            'message': message,
            'criticality': criticality
        }
        # Log the message with appropriate criticality level
        if criticality == 'CRITICAL':
            logger.critical(json.dumps(log_entry))
        elif criticality == 'ERROR':
            logger.error(json.dumps(log_entry))
        elif criticality == 'WARNING':
            logger.warning(json.dumps(log_entry))
        elif criticality == 'DEBUG':
            logger.debug(json.dumps(log_entry))
        else:
            logger.info(json.dumps(log_entry))

    @staticmethod
    def search_logs(query_criticality=None, query_start_time=None, query_end_time=None, query_resource=None):
        default_end_time = datetime.datetime.now()
        default_start_time = default_end_time - datetime.timedelta(days=1)
        start_time = query_start_time if query_start_time else default_start_time.strftime('%Y-%m-%d %H:%M:%S')
        end_time = query_end_time if query_end_time else default_end_time.strftime('%Y-%m-%d %H:%M:%S')

        matching_logs = []

        with open(LOG_FILE, 'r') as f:
            for line in f:
                try:
                    json_start_index = line.find('{"timestamp":')
                    if json_start_index == -1:
                        continue  # Skip lines that don't contain JSON part

                    json_str = line[json_start_index:]  # Extract the JSON string
                    log_entry = json.loads(json_str)   # Parse the JSON string
                    log_time = datetime.datetime.strptime(log_entry['timestamp'], '%Y-%m-%d %H:%M:%S.%f')
                    log_time_in_range = start_time <= log_time.strftime('%Y-%m-%d %H:%M:%S') <= end_time
                    criticality_match = query_criticality is None or log_entry.get('criticality') == query_criticality
                    resource_match = query_resource is None or log_entry.get('resource') == query_resource

                    if log_time_in_range and criticality_match and resource_match:
                        matching_logs.append(log_entry)
                except json.JSONDecodeError as e:
                    print(f'There was an issue decoding the line: {e}')
                    continue  # Skip lines that are not valid JSON

        # Sort the logs in descending order by timestamp
        sorted_logs = sorted(matching_logs, key=lambda x: x['timestamp'], reverse=True)
        return sorted_logs


if __name__ == '__main__':
    ServiceLogger.log(resource='System', message='This is a test log message', criticality='INFO')
    ServiceLogger.log(resource='System', message='This is a test debug message', criticality='DEBUG')
    ServiceLogger.log(resource='System', message='This is a test warning message', criticality='WARNING')
    ServiceLogger.log(resource='System', message='This is a test error message', criticality='ERROR')
    ServiceLogger.log(resource='System', message='This is a test critical message', criticality='CRITICAL')