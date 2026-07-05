from fastapi import APIRouter, HTTPException, status
from backend.models.schemas import TextAssessmentRequest, AssessmentResponse
from backend.services.deterministic_metrics import compute_text_metrics
from backend.services.gemini_client import evaluate_text_with_gemini
import datetime

router = APIRouter(prefix="/api/assess", tags=["Assessment"])

@router.post("/text", response_model=AssessmentResponse)
async def assess_text(payload: TextAssessmentRequest):
    """
    Endpoint to assess written communication text.
    Computes deterministic metrics locally and LLM-based rubric scores via Gemini.
    """
    if not payload.text or not payload.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text input cannot be empty."
        )
        
    try:
        # 1. Compute deterministic metrics
        metrics = compute_text_metrics(payload.text)
        
        # 2. Query Gemini for rubric assessment
        assessment = evaluate_text_with_gemini(payload.text, payload.framework)
        
        # 3. Assemble response and save
        assessment_dict = assessment.model_dump() if hasattr(assessment, "model_dump") else assessment.dict()
        
        response_dict = {
            "session_name": payload.session_name,
            "session_email": payload.session_email,
            "timestamp": datetime.datetime.now().isoformat(),
            "word_count": metrics["word_count"],
            "sentence_count": metrics["sentence_count"],
            "avg_words_per_sentence": metrics["avg_words_per_sentence"],
            "flesh_reading_ease": metrics["flesh_reading_ease"],
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
            detail=f"An error occurred during assessment: {str(e)}"
        )
