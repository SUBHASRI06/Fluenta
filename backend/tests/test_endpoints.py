import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app
from backend.models.schemas import AssessmentResultSchema, CriterionScores
from backend.storage.db import init_db

# Ensure test DB is initialized
init_db()

client = TestClient(app)

def test_health_endpoint():
    with TestClient(app) as test_client:
        response = test_client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

@patch("backend.routes.text_assessment.evaluate_text_with_gemini")
def test_text_assessment_endpoint(mock_evaluate):
    # Setup mock return value
    mock_scores = CriterionScores(
        clarity_conciseness=22.0,
        grammar_mechanics=23.0,
        tone_professionalism=24.0,
        organization_structure=21.0
    )
    mock_evaluate.return_value = AssessmentResultSchema(
        overall_score=90.0,
        criteria=mock_scores,
        deductions=[
            {
                "criterion": "Clarity & Conciseness",
                "evidence": "extremely vital and important",
                "issue": "Wordy phrase. 'Vital' or 'important' alone is sufficient.",
                "correction": "vital",
                "points_lost": 2.0
            }
        ],
        coaching_tips=["Keep sentences concise."]
    )

    test_payload = {
        "text": "This is extremely vital and important for the project development.",
        "framework": "general",
        "session_name": "Test User",
        "session_email": "test@example.com"
    }

    response = client.post("/api/assess/text", json=test_payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["word_count"] == 10
    assert data["sentence_count"] == 1
    assert data["avg_words_per_sentence"] == 10.0
    assert data["assessment"]["overall_score"] == 90.0
    assert len(data["assessment"]["deductions"]) == 1
    assert data["assessment"]["deductions"][0]["evidence"] == "extremely vital and important"

@patch("backend.routes.audio_assessment.transcribe_audio")
@patch("backend.routes.audio_assessment.evaluate_text_with_gemini")
def test_audio_assessment_endpoint(mock_evaluate, mock_transcribe):
    # Mock transcript return
    mock_transcribe.return_value = "Uh, like, this is a very interesting project, you know."
    
    # Mock assessment return
    mock_scores = CriterionScores(
        clarity_conciseness=18.0,
        grammar_mechanics=20.0,
        tone_professionalism=22.0,
        organization_structure=20.0
    )
    mock_evaluate.return_value = AssessmentResultSchema(
        overall_score=80.0,
        criteria=mock_scores,
        deductions=[
            {
                "criterion": "Clarity & Conciseness",
                "evidence": "Uh, like",
                "issue": "Starts with filler words.",
                "correction": "This is",
                "points_lost": 2.0
            }
        ],
        coaching_tips=["Minimize filler words."]
    )

    # Use a mock audio file
    audio_file = ("test.wav", b"fake audio data")
    
    response = client.post(
        "/api/assess/audio",
        files={"file": audio_file},
        data={
            "framework": "Pitch Presentation",
            "session_name": "Speaker User",
            "session_email": "speaker@example.com",
            "duration_seconds": 10.0
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["word_count"] == 10
    assert data["filler_word_count"] == 3
    assert data["wpm"] == 60 # (10 words / 10 seconds) * 60 = 60 WPM
    assert data["assessment"]["overall_score"] == 80.0
