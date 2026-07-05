from fastapi import APIRouter
from backend.storage.db import get_db_connection
import json

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/compare/{session_email}")
async def compare_assessments(session_email: str):
    """
    Returns data comparing the user's earliest assessment with their latest.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM assessments WHERE session_email = ? ORDER BY timestamp ASC", (session_email,))
    rows = cursor.fetchall()
    conn.close()
    
    if len(rows) < 2:
        return {"status": "insufficient_data", "message": "Need at least 2 assessments to compare"}
        
    earliest = dict(rows[0])
    latest = dict(rows[-1])
    
    e_json = json.loads(earliest.get("assessment_json", "{}"))
    l_json = json.loads(latest.get("assessment_json", "{}"))
    
    return {
        "status": "success",
        "earliest": {
            "id": earliest["id"],
            "date": earliest["timestamp"],
            "overall_score": e_json.get("overall_score", 0),
            "criteria": e_json.get("criteria", {})
        },
        "latest": {
            "id": latest["id"],
            "date": latest["timestamp"],
            "overall_score": l_json.get("overall_score", 0),
            "criteria": l_json.get("criteria", {})
        },
        "improvement": round(l_json.get("overall_score", 0) - e_json.get("overall_score", 0), 2)
    }
