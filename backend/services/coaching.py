import json
import logging
import google.generativeai as genai
from backend.config import config

logger = logging.getLogger(__name__)

def generate_coaching_plan(assessment_history: list) -> dict:
    """
    Generates a personalized long-term communication coaching plan based on
    the candidate's assessment history.
    """
    if not config.GEMINI_API_KEY:
        return {
            "weak_areas": ["Clarity & Conciseness"],
            "recommendations": ["Practice slowing down and pausing when speaking."],
            "weekly_goal": "Record a 1-minute daily check-in focusing on active verb usage."
        }
        
    if not assessment_history:
        return {
            "weak_areas": ["Awaiting initial assessment data."],
            "recommendations": ["Submit your first text or spoken assessment to receive coaching tips."],
            "weekly_goal": "Complete your first communication benchmark."
        }

    # Format history summary for the LLM
    history_summary = []
    for idx, item in enumerate(assessment_history[:5]): # Look at top 5 latest
        overall_score = item.get("assessment", {}).get("overall_score", 0)
        c_scores = item.get("assessment", {}).get("criteria", {})
        filler_count = item.get("filler_word_count")
        wpm = item.get("wpm")
        
        history_summary.append({
            "index": idx + 1,
            "overall_score": overall_score,
            "clarity_conciseness": c_scores.get("clarity_conciseness", 0),
            "grammar_mechanics": c_scores.get("grammar_mechanics", 0),
            "tone_professionalism": c_scores.get("tone_professionalism", 0),
            "organization_structure": c_scores.get("organization_structure", 0),
            "wpm": wpm,
            "filler_word_count": filler_count
        })

    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an AI Communication Coach. Analyze the following candidate assessment history:
    {json.dumps(history_summary, indent=2)}
    
    Provide a personalized coaching plan containing:
    1. Weak Areas (2-3 items: identifying patterns of difficulty across sessions)
    2. Practice Recommendations (3-5 items: concrete, actionable exercises they can perform)
    3. Weekly Goal (1 sentence: a specific, measurable target for this week)
    
    Your response must be in JSON format adhering strictly to this schema:
    {{
        "weak_areas": ["string"],
        "recommendations": ["string"],
        "weekly_goal": "string"
    }}
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Error generating coaching plan: {str(e)}")
        # Default safety fallback
        return {
            "weak_areas": ["Clarity & Conciseness", "Tone consistency"],
            "recommendations": [
                "Practice reading your written texts aloud to catch structural pacing issues.",
                "Avoid filler words by taking deliberate deep breaths between sentences."
            ],
            "weekly_goal": "Complete one daily assessment focusing on conciseness."
        }
