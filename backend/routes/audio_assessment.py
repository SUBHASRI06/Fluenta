import os
import shutil
import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from backend.models.schemas import AssessmentResponse
from backend.services.speech_to_text import transcribe_audio
from backend.services.deterministic_metrics import compute_text_metrics, compute_audio_metrics
from backend.services.gemini_client import evaluate_text_with_gemini

router = APIRouter(prefix="/api/assess", tags=["Assessment"])

@router.post("/audio", response_model=AssessmentResponse)
async def assess_audio(
    file: UploadFile = File(...),
    framework: str = Form("General Assessment"),
    session_name: str = Form(None),
    session_email: str = Form(None),
    duration_seconds: float = Form(None)
):
    """
    Endpoint to assess spoken communication audio.
    Transcribes audio using Gemini File API and computes speech and structural metrics.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp3", ".wav", ".webm", ".m4a", ".ogg", ".aac"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format {ext}. Please upload MP3, WAV, WEBM, M4A, OGG, or AAC."
        )

    # Save to a temporary workspace file
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    temp_dir = os.path.join(backend_dir, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    temp_file_path = os.path.join(temp_dir, f"audio_{datetime.datetime.now().timestamp()}{ext}")
    
    try:
        # Write the uploaded file content to disk
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Transcribe the audio
        transcript = transcribe_audio(temp_file_path)
        
        if not transcript or not transcript.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Transcription yielded empty text. Please check the audio quality."
            )
            
        # 2. Compute local text metrics
        text_metrics = compute_text_metrics(transcript)
        
        # 3. Compute speech delivery metrics (WPM, fillers)
        audio_metrics = compute_audio_metrics(transcript, duration_seconds or 0.0)
        
        # 4. Perform Gemini rubric evaluation
        assessment = evaluate_text_with_gemini(transcript, framework)
        
        # Assemble Response and save
        assessment_dict = assessment.model_dump() if hasattr(assessment, "model_dump") else assessment.dict()
        
        response_dict = {
            "session_name": session_name,
            "session_email": session_email,
            "timestamp": datetime.datetime.now().isoformat(),
            "word_count": text_metrics["word_count"],
            "sentence_count": text_metrics["sentence_count"],
            "avg_words_per_sentence": text_metrics["avg_words_per_sentence"],
            "flesh_reading_ease": text_metrics["flesh_reading_ease"],
            "transcript": transcript,
            "wpm": audio_metrics["wpm"],
            "filler_word_count": audio_metrics["filler_word_count"],
            "assessment": assessment_dict
        }
        
        # Fetch history to generate comparative coaching plan
        from backend.storage.db import get_assessment_history
        from backend.services.coaching import generate_coaching_plan
        
        history_list = get_assessment_history()
        history_plus_current = [response_dict] + history_list
        coaching_plan = generate_coaching_plan(history_plus_current)
        response_dict["coaching_plan"] = coaching_plan
        
        from backend.storage.db import save_assessment
        db_id = save_assessment(response_dict)
        response_dict["id"] = str(db_id)
        
        return AssessmentResponse(**response_dict)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during audio assessment: {str(e)}"
        )
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception as cleanup_err:
                pass
