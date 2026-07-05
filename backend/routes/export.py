import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.storage.db import get_db_connection
from backend.services.pdf_generator import generate_assessment_pdf

router = APIRouter(prefix="/api/export", tags=["Export"])

@router.get("/pdf/{assessment_id}/{session_email}")
async def export_pdf(assessment_id: int, session_email: str):
    """
    Generates and returns a PDF for the given assessment.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM assessments WHERE id = ? AND session_email = ?", (assessment_id, session_email))
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    assessment_data = dict(row)
    
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp")
    os.makedirs(temp_dir, exist_ok=True)
    pdf_path = os.path.join(temp_dir, f"report_{assessment_id}.pdf")
    
    generate_assessment_pdf(assessment_data, pdf_path)
    
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"Fluenta_Report_{assessment_id}.pdf")
