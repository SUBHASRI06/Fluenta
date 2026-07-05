# Fluenta: AI Communication Intelligence Platform

Fluenta is a full-stack, AI-driven communication coaching platform. It evaluates written and spoken delivery, providing targeted feedback, dynamic practice exercises, and comprehensive analytics to help users become better communicators.

## 🚀 Features
- **Spoken & Written Analysis:** Record audio or type text to receive instant grading.
- **AI Assessment Engine:** Powered by Google Gemini to evaluate Clarity, Grammar, Tone, and Organization.
- **Dynamic Practice Hub:** Gemini dynamically generates 1-minute practice prompts based on your weakest historical performance.
- **Analytics Dashboard:** Visualizes your communication profile using Radar charts and historical trend lines.
- **Secure Authentication:** JWT-based user authentication securely tied to a SQLite database.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, Vanilla CSS (Glassmorphism), Recharts
- **Backend:** Python, FastAPI, SQLite, JWT (passlib/bcrypt)
- **AI Integration:** Google Gemini API (`gemini-2.5-flash`) with advanced prompt engineering for structured JSON output and strict rubric grading.
- **Deployment:** Docker & Docker Compose

## 📦 Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Google Gemini API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in the root of the project and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```bash
   python -m uvicorn backend.main:app --reload
   ```
   The backend will run on `http://localhost:8000`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

## 🐳 Docker Deployment

To run the entire application stack using Docker:
1. Ensure Docker and Docker Compose are installed.
2. Run the following command in the root directory:
   ```bash
   docker-compose up --build
   ```
3. Access the application at `http://localhost:80`

## 🧠 Prompt Engineering Highlights
The core of Fluenta relies on complex Prompt Engineering techniques:
- **Role Prompting:** Instructing the LLM to act as a strict, professional speech coach.
- **Structured Output:** Forcing the LLM to return strictly formatted JSON matching a Pydantic schema for seamless integration with the React frontend.
- **Dynamic Context Injection:** Passing the user's historical weak areas into the prompt to dynamically generate tailored practice exercises.

---
*Developed as an individual project demonstrating full-stack AI integration.*
