from flask import Flask, render_template, request, jsonify
import openai
import os
import requests
import json
import urllib.parse
from datetime import datetime
from dotenv import load_dotenv

# Load API keys from .env file
load_dotenv()
openai.api_key = os.getenv('OPENAI_API_KEY')
PROLIFIC_API_TOKEN = os.getenv('PROLIFIC_API_TOKEN')

app = Flask(__name__)

# Prolific API configuration
PROLIFIC_BASE_URL = "https://api.prolific.com/api/v1"

class ProlificAPI:
    def __init__(self, api_token):
        self.api_token = api_token
        self.headers = {
            'Authorization': f'Token {api_token}',
            'Content-Type': 'application/json'
        }
    
    def create_study(self, study_data):
        """Create a new study on Prolific"""
        url = f"{PROLIFIC_BASE_URL}/studies/"
        response = requests.post(url, headers=self.headers, json=study_data)
        if response.ok:
            return response.json()
        else:
            print(f"Prolific API error: {response.status_code} - {response.text}")
            return None
    
    def publish_study(self, study_id):
        """Publish a study to make it active"""
        url = f"{PROLIFIC_BASE_URL}/studies/{study_id}/transition/"
        transition_data = {"action": "PUBLISH"}
        response = requests.post(url, headers=self.headers, json=transition_data)
        if response.ok:
            return response.json()
        else:
            print(f"Prolific publish error: {response.status_code} - {response.text}")
            return None
    
    def get_study(self, study_id):
        """Get study details"""
        url = f"{PROLIFIC_BASE_URL}/studies/{study_id}/"
        response = requests.get(url, headers=self.headers)
        return response.json() if response.ok else None
    
    def get_submissions(self, study_id):
        """Get all submissions for a study"""
        url = f"{PROLIFIC_BASE_URL}/studies/{study_id}/submissions/"
        response = requests.get(url, headers=self.headers)
        return response.json() if response.ok else []

# Initialize Prolific API
prolific_api = ProlificAPI(PROLIFIC_API_TOKEN) if PROLIFIC_API_TOKEN else None

# Store active studies (in production, use a database)
active_studies = {}

@app.route('/', methods=['GET', 'POST'])
def index():
    intent = None
    user_message = ''
    if request.method == 'POST':
        user_message = request.form.get('user_message', '')
        if user_message:
            # Call OpenAI to get intent
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Given a user message, respond what do you think is the intention behind the message in a short sentence."},
                    {"role": "user", "content": user_message}
                ]
            )
            intent = response.choices[0].message['content'].strip()
    return render_template('index.html', intent=intent, user_message=user_message)

@app.route('/api/create_prolific_study', methods=['POST'])
def create_prolific_study():
    """Create a Prolific study for intent evaluation"""
    if not prolific_api:
        return jsonify({'error': 'Prolific API not configured'}), 400
    
    data = request.json
    user_message = data.get('user_message')
    ai_intent = data.get('ai_intent')
    study_config = data.get('study_config', {})
    
    # Debug: Print the incoming data
    print(f"Incoming study_config: {study_config}")
    print(f"Type of reward: {type(study_config.get('reward'))}, Value: {study_config.get('reward')}")
    print(f"Type of participants: {type(study_config.get('participants'))}, Value: {study_config.get('participants')}")
    print(f"Type of estimated_time: {type(study_config.get('estimated_time'))}, Value: {study_config.get('estimated_time')}")
    print(f"Type of max_time: {type(study_config.get('max_time'))}, Value: {study_config.get('max_time')}")
    
    # Generate completion code
    completion_code = f"INTENT_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Ensure all numeric values are properly typed
    estimated_time = int(study_config.get('estimated_time', 2))
    max_time = int(study_config.get('max_time', 10))
    reward_dollars = float(study_config.get('reward', 0.50))
    reward_cents = int(reward_dollars * 100)  # Convert to cents as integer
    participants = int(study_config.get('participants', 10))
    
    # Create study data
    study_data = {
        "name": f"AI Intent Evaluation - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "internal_name": f"AI Intent Study {datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "description": "Evaluate whether an AI correctly identified the intent behind a user message",
        "external_study_url": "https://prolific.com/surveys/6864ccc272575b5933a2da30",
        "completion_codes": [{
            "code": completion_code,
            "code_type": "COMPLETED",
            "actions": [
                {"action": "AUTOMATICALLY_APPROVE"}
            ]
        }],
        "estimated_completion_time": estimated_time,  # minutes
        "maximum_allowed_time": max_time,  # minutes
        "reward": reward_cents,  # USD in cents
        "total_available_places": participants,
        "device_compatibility": ["desktop"],
        "peripheral_requirements": [],
        "privacy_notice": "This study evaluates AI intent classification. Your responses will be used for research purposes only. No personal information will be collected beyond your Prolific ID. All data will be anonymized and used solely for improving AI understanding of user intent.",
        "filters": [
            {
                "filter_id": "approval_rate",
                "selected_range": {
                    "lower": 95,
                    "upper": 100
                }
            }
        ]
    }
    
    # Debug: Print the study data being sent to Prolific
    print(f"Study data being sent to Prolific: {study_data}")
    print(f"Type of reward in study_data: {type(study_data['reward'])}, Value: {study_data['reward']} cents (${study_data['reward']/100:.2f})")
    print(f"Type of total_available_places: {type(study_data['total_available_places'])}, Value: {study_data['total_available_places']}")
    
    # Create study on Prolific
    study_response = prolific_api.create_study(study_data)
    
    if study_response:
        study_id = study_response.get('id')
        
        # Publish the study to make it active
        print(f"Study created successfully: {study_id}")
        print(f"Publishing study...")
        
        publish_response = prolific_api.publish_study(study_id)
        if publish_response:
            print(f"Study published successfully!")
            study_status = "ACTIVE"
        else:
            print(f"Failed to publish study, but study was created")
            study_status = "UNPUBLISHED"
        
        active_studies[study_id] = {
            'user_message': user_message,
            'ai_intent': ai_intent,
            'created_at': datetime.now(),
            'config': study_config,
            'completion_code': completion_code,
            'submissions': [],
            'status': study_status
        }
        
        return jsonify({
            'success': True,
            'study_id': study_id,
            'study_url': study_response.get('external_study_url'),
            'completion_code': completion_code,
            'status': study_status
        })
    
    print(f"Failed to create study. Response: {study_response}")
    return jsonify({'error': 'Failed to create study'}), 500

@app.route('/api/study_results/<study_id>')
def get_study_results(study_id):
    """Get real-time results for a study"""
    if study_id not in active_studies:
        return jsonify({'error': 'Study not found'}), 404
    
    study = active_studies[study_id]
    
    # Get submissions from our local storage
    submissions = study.get('submissions', [])
    
    # Process results
    results = {
        'total_participants': len(submissions),
        'correct_intent': sum(1 for s in submissions if s.get('intent_correct') == 'yes'),
        'incorrect_intent': sum(1 for s in submissions if s.get('intent_correct') == 'no'),
        'completion_time_avg': sum(s.get('time_taken', 0) for s in submissions) / len(submissions) if submissions else 0,
        'submissions': submissions
    }
    
    return jsonify(results)

@app.route('/study')
def study_page():
    """Study page for participants"""
    user_message = request.args.get('user_message', '')
    ai_intent = request.args.get('ai_intent', '')
    completion_code = request.args.get('completion_code', '')
    
    return render_template('study.html', 
                         user_message=user_message, 
                         ai_intent=ai_intent, 
                         completion_code=completion_code)

@app.route('/api/classify', methods=['POST'])
def api_classify():
    data = request.get_json()
    user_message = data.get('text', '')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400
    # Call OpenAI to get intent
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Given a user message, respond what do you think is the intention behind the message in a short sentence."},
            {"role": "user", "content": user_message}
        ]
    )
    intent = response.choices[0].message['content'].strip()
    # For compatibility with frontend, return a dummy structure
    return jsonify({
        'intent': intent,
        'emotion': 'neutral',
        'confidence': 1.0,
        'all_scores': {'neutral': 1.0},
        'needs_human_feedback': False
    })

@app.route('/api/test_preferences', methods=['POST'])
def test_preferences():
    data = request.json
    with open('test_preferences.txt', 'w') as f:
        f.write(str(data))
    return jsonify({'success': True})

@app.route('/api/submit_study_response', methods=['POST'])
def submit_study_response():
    """Handle study response submission from participants"""
    data = request.json
    completion_code = data.get('study_id')  # This is actually the completion code
    participant_id = data.get('participant_id')
    intent_correct = data.get('intent_correct')
    correct_intent = data.get('correct_intent', '')
    time_taken = data.get('time_taken', 0)
    
    # Find the study by completion code
    study_id = None
    for sid, study in active_studies.items():
        if study.get('completion_code') == completion_code:
            study_id = sid
            break
    
    if study_id:
        # Store the submission
        submission = {
            'participant_id': participant_id,
            'intent_correct': intent_correct,
            'correct_intent': correct_intent,
            'time_taken': time_taken,
            'submitted_at': datetime.now().isoformat()
        }
        
        active_studies[study_id]['submissions'].append(submission)
        
        return jsonify({'success': True, 'message': 'Response submitted successfully'})
    
    return jsonify({'error': 'Study not found'}), 404

if __name__ == '__main__':
    app.run(debug=True) 