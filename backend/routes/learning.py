from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import json
from backend.storage.db import get_db_connection
from backend.services.learning_pathway import generate_learning_pathway

router = APIRouter(prefix="/api/learning", tags=["Learning"])

class GeneratePathwayRequest(BaseModel):
    session_email: str
    assessment_id: int

@router.post("/generate")
def create_learning_pathway(payload: GeneratePathwayRequest):
    """
    Generates a 4-week learning pathway based on a specific assessment's deductions.
    Saves the pathway to the database.
    """
    if not payload.session_email:
        raise HTTPException(status_code=400, detail="session_email is required")

    # Fetch assessment
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE id = ? AND session_email = ?", (payload.assessment_id, payload.session_email))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Assessment not found or does not belong to this email")
        
    assessment_data = dict(row)
    if assessment_data.get("assessment_json"):
        assessment_data["assessment"] = json.loads(assessment_data["assessment_json"])
    else:
        assessment_data["assessment"] = {}

    # Generate pathway via Gemini
    pathway_json = generate_learning_pathway(assessment_data)

    # Save to db
    cursor.execute("""
        INSERT INTO learning_pathways (session_email, assessment_id, pathway_data)
        VALUES (?, ?, ?)
    """, (payload.session_email, payload.assessment_id, json.dumps(pathway_json)))
    
    conn.commit()
    conn.close()

    return {"status": "success", "pathway": pathway_json}

@router.get("/{session_email}")
async def get_latest_learning_pathway(session_email: str):
    """
    Retrieves the most recent active learning pathway for a user.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM learning_pathways 
        WHERE session_email = ? AND is_active = 1
        ORDER BY created_at DESC LIMIT 1
    """, (session_email,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {"status": "not_found", "pathway": None}

    return {
        "status": "success",
        "pathway": json.loads(row["pathway_data"]),
        "created_at": row["created_at"],
        "assessment_id": row["assessment_id"]
    }
