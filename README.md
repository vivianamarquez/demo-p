# Vibe Check AI

🎭 **Vibe Check AI** is a web app that decodes Gen Z emotions, one message at a time! Enter a message, and the app uses OpenAI's language model to determine the intent behind the text. The right side of the interface is reserved for future features.

## Features
- Modern, colorful UI inspired by Gen Z aesthetics
- Input box for user messages (up to 200 characters)
- Uses OpenAI's GPT model to classify the intent of the message
- Secure API key management using a `.env` file
- Right panel left blank for future functionality

## Setup

### 1. Clone the repository
```
git clone <your-repo-url>
cd demo-p
```

### 2. Install dependencies
```
pip install flask openai python-dotenv
```

### 3. Set up your OpenAI API key
- Create a file named `.env` in the project root (same folder as `app.py`).
- Add this line to `.env`:
  ```
  OPENAI_API_KEY=your_openai_api_key_here
  ```
  Replace `your_openai_api_key_here` with your actual OpenAI API key.

## Usage

Start the Flask app:
```
python app.py
```

Open your browser and go to [http://localhost:5000](http://localhost:5000).

- Enter a message in the left panel and click **Read the Vibes 🔮**.
- The app will display the detected intent below the input box.
- The right panel is currently blank and reserved for future features.

## Project Structure
```
app.py                # Main Flask app
/templates/index.html # HTML template for the UI
.env                  # Your API key (not tracked by git)
.gitignore            # Ensures .env is not committed
```

## License
MIT 