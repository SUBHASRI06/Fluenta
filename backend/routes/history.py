from fastapi import APIRouter, HTTPException, status
from typing import List
from backend.models.schemas import AssessmentResponse
from backend.storage.db import get_assessment_history

router = APIRouter(prefix="/api/history", tags=["History"])

@router.get("", response_model=List[AssessmentResponse])
async def get_history():
    """
    Retrieves the complete list of communication assessments
    ordered from newest to oldest.
    """
    try:
        history = get_assessment_history()
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch assessment history: {str(e)}"
        )
