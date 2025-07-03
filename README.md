# AI Intent Evaluation with Prolific

This project demonstrates how to create and run human evaluation studies on Prolific to assess AI model performance in intent recognition tasks. The system automatically generates surveys, recruits participants, and collects human judgments on whether an AI correctly interpreted user messages.

## 🎯 Project Overview

The project consists of a Jupyter notebook (`DemoProlific.ipynb`) that:

1. **Takes a user message** and sends it to an LLM for intent interpretation
2. **Creates a survey** on Prolific asking human evaluators if the AI's interpretation was correct
3. **Recruits participants** based on specified criteria (age, country, etc.)
4. **Collects responses** and provides analysis tools
5. **Exports results** for further analysis

## 🚀 Quick Start

### Prerequisites

- Python 3.7+
- Prolific account with API access
- Required Python packages (see Installation section)

### Installation

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd demo-p
   ```

2. **Install required packages**
   ```bash
   pip install openai python-dotenv pandas requests
   ```

3. **Set up environment variables**
   Create a `.env` file in the project directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PROLIFIC_API_TOKEN=your_prolific_token_here
   ```

### Usage

1. **Open the Jupyter notebook**
   ```bash
   jupyter notebook DemoProlific.ipynb
   ```

2. **Follow the notebook sections**:
   - **Section 1-4**: Setup and authentication
   - **Section 5**: Define your test message
   - **Section 6-8**: Get AI interpretation and build survey
   - **Section 9-22**: Create and publish the study
   - **Section 23-30**: Monitor results and analyze data

## 📋 Detailed Workflow

### 1. Setup and Authentication
- Import required libraries (OpenAI, Prolific API, pandas, etc.)
- Load API keys from environment variables
- Authenticate with both OpenAI and Prolific APIs
- Fetch your Prolific researcher ID

### 2. Message Processing
- Define a user message to test
- Send it to OpenAI's GPT model for intent interpretation
- Extract the AI's response

### 3. Survey Creation
- Generate unique identifiers for survey components
- Build survey structure with the question: "Did the AI get the intent right?"
- Create the survey on Prolific's platform

### 4. Study Configuration
- Set study parameters:
  - Reward: $0.50 per participant
  - Participants: 10 (configurable)
  - Estimated time: 2 minutes
  - Age range: 18-28
  - Countries: US
- Generate completion codes and filters

### 5. Study Publication
- Create the study with all parameters
- Publish it to make it available to participants
- Monitor study status and participant recruitment

### 6. Data Collection and Analysis
- Monitor participant submissions
- Export results in CSV format
- Load data into pandas DataFrame for analysis
- Calculate completion times and response statistics

## 🔧 Configuration Options

### Study Parameters
You can modify these parameters in the notebook:

```python
study_config = {
    "reward": 0.50,           # Payment per participant
    "participants": 10,       # Number of participants needed
    "estimated_time": 2,      # Estimated completion time (minutes)
    "max_time": 10,          # Maximum allowed time (minutes)
    "age_range": "18-28",    # Target age range
    "countries": ["US"]      # Target countries
}
```

## 📊 Understanding the Results

The exported data includes:

- **Participant demographics**: Age, gender, ethnicity, country, etc.
- **Response data**: Yes/No answers to whether AI interpretation was correct
- **Timing information**: Start time, completion time, time taken
- **Status information**: Approval status, review status
