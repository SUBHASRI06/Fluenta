from fastapi import APIRouter, HTTPException, status
import logging
import json
import google.generativeai as genai
from backend.storage.db import get_db_connection
from backend.config import config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/practice", tags=["Practice"])

@router.get("/generate/{email}")
def generate_practice(email: str):
    """
    Generates a targeted speaking prompt based on the user's weakest criteria
    from their recent assessment history.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT assessment_json FROM assessments 
        WHERE session_email = ? 
        ORDER BY timestamp DESC 
        LIMIT 1
    """, (email,))
    
    row = cursor.fetchone()
    conn.close()
    
    weakest_area = "General Communication"
    
    if row and row["assessment_json"]:
        try:
            data = json.loads(row["assessment_json"])
            criteria = data.get("criteria", {})
            if criteria:
                # Find the key with the lowest score
                weakest_key = min(criteria, key=criteria.get)
                weakest_area = weakest_key.replace("_", " ").title()
        except Exception as e:
            logger.error(f"Error parsing assessment_json for practice generation: {str(e)}")
            
    if not config.GEMINI_API_KEY:
        # Fallback if no Gemini key
        return {
            "exercise": f"Explain the concept of 'Cloud Computing' to a 10-year-old child in less than 2 minutes. Try to avoid technical jargon.",
            "focus": weakest_area
        }
        
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""
        You are an expert communication coach. Your student needs to practice their communication skills.
        Their weakest area currently is: {weakest_area}.
        
        Generate a single, short, practical speaking or writing prompt (1-2 sentences max) for them to practice right now.
        The prompt should force them to work on their weakness.
        For example, if their weakness is 'Tone Professionalism', ask them to deliver bad news to a client.
        If their weakness is 'Clarity Conciseness', ask them to explain a complex topic to a 5-year-old.
        
        Return ONLY the prompt text, nothing else. No intro, no quotes.
        """
        
        response = model.generate_content(
            prompt,
            request_options={"timeout": 30}
        )
        
        exercise = response.text.strip()
        # Remove surrounding quotes if model added them
        if exercise.startswith('"') and exercise.endswith('"'):
            exercise = exercise[1:-1]
            
        return {
            "exercise": exercise,
            "focus": weakest_area
        }
        
    except Exception as e:
        logger.error(f"Error generating dynamic practice: {str(e)}")
        return {
            "exercise": "Deliver an impromptu 2-minute speech on a random topic of your choice.",
            "focus": weakest_area
        }
