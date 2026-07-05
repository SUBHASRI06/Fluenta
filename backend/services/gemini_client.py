import json
import logging
import google.generativeai as genai
from backend.config import config
from backend.models.schemas import AssessmentResultSchema, CriterionScores

logger = logging.getLogger(__name__)

# Configure Gemini
if config.GEMINI_API_KEY:
    genai.configure(api_key=config.GEMINI_API_KEY)
else:
    logger.warning("GEMINI_API_KEY not found in configuration! Gemini calls will fail.")

def evaluate_text_with_gemini(text: str, framework: str = "general") -> AssessmentResultSchema:
    """
    Evaluates the input text using Gemini API based on a rubric.
    Enforces a strict JSON structure matching AssessmentResultSchema.
    """
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured. Please check your environment variables.")

    # We use gemini-2.5-flash as the default reliable model for structural JSON reasoning
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an expert communication coach. Evaluate the following text using a strict rubric framework: '{framework}'.
    
    Rubric Criteria (Each is worth 25 points, totaling 100 points):
    1. Clarity & Conciseness (Clarity of message, brevity, avoiding fluff or excessive words)
    2. Grammar & Mechanics (Punctuation, spelling, syntax, sentence structure)
    3. Tone & Professionalism (Appropriateness of voice, vocabulary, audience engagement, professionalism)
    4. Organization & Structure (Logical flow, transitions, introduction/conclusion presence)
    
    Analyze the text and identify specific areas of improvement. For each issue found, you MUST:
    - Provide the exact evidence (quoted span of text). It must be a substring from the input text.
    - Categorize it under one of the 4 criteria: 'Clarity & Conciseness', 'Grammar & Mechanics', 'Tone & Professionalism', or 'Organization & Structure'.
    - Explain the issue.
    - Provide the corrected version.
    - Allocate a negative point loss (points_lost) for this deduction.
    
    Make sure the sum of scores for the 4 criteria is equal to the overall_score.
    
    Text to evaluate:
    \"\"\"
    {text}
    \"\"\"
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AssessmentResultSchema
            ),
            request_options={"timeout": 60}
        )
        
        # Parse the JSON response
        data = json.loads(response.text)
        
        # Calculate scores deterministically to prevent LLM math hallucinations
        calculated_scores = {
            "Clarity & Conciseness": 25.0,
            "Grammar & Mechanics": 25.0,
            "Tone & Professionalism": 25.0,
            "Organization & Structure": 25.0,
        }
        
        cleaned_deductions = []
        for ded in data.get("deductions", []):
            crit = ded.get("criterion", "")
            try:
                pts_lost = abs(float(ded.get("points_lost", 0.0)))
            except:
                pts_lost = 0.0
                
            mapped_crit = "Grammar & Mechanics" # fallback
            crit_lower = crit.lower()
            if "clarity" in crit_lower or "concise" in crit_lower:
                mapped_crit = "Clarity & Conciseness"
            elif "grammar" in crit_lower or "mechanic" in crit_lower:
                mapped_crit = "Grammar & Mechanics"
            elif "tone" in crit_lower or "profession" in crit_lower:
                mapped_crit = "Tone & Professionalism"
            elif "organization" in crit_lower or "structure" in crit_lower:
                mapped_crit = "Organization & Structure"
                
            ded["criterion"] = mapped_crit
            ded["points_lost"] = pts_lost
            calculated_scores[mapped_crit] -= pts_lost
            
            cleaned_deductions.append(ded)

        # Clamp individual criteria scores to [0, 25]
        c_clarity = max(0.0, min(25.0, calculated_scores["Clarity & Conciseness"]))
        c_grammar = max(0.0, min(25.0, calculated_scores["Grammar & Mechanics"]))
        c_tone = max(0.0, min(25.0, calculated_scores["Tone & Professionalism"]))
        c_org = max(0.0, min(25.0, calculated_scores["Organization & Structure"]))
        
        data["criteria"] = {
            "clarity_conciseness": round(c_clarity, 2),
            "grammar_mechanics": round(c_grammar, 2),
            "tone_professionalism": round(c_tone, 2),
            "organization_structure": round(c_org, 2)
        }
        
        # Recalculate overall score to ensure it is exactly the sum of its parts
        data["overall_score"] = round(c_clarity + c_grammar + c_tone + c_org, 2)
        data["deductions"] = cleaned_deductions
        
        return AssessmentResultSchema(**data)
        
    except Exception as e:
        logger.error(f"Error evaluating text with Gemini: {str(e)}")
        # Return a fallback assessment rather than breaking the application completely
        fallback_scores = CriterionScores(
            clarity_conciseness=20.0,
            grammar_mechanics=20.0,
            tone_professionalism=20.0,
            organization_structure=20.0
        )
        return AssessmentResultSchema(
            overall_score=80.0,
            criteria=fallback_scores,
            deductions=[
                {
                    "criterion": "Grammar & Mechanics",
                    "evidence": "Error processing with AI",
                    "issue": f"The assessment system encountered an issue processing your request: {str(e)}",
                    "correction": "Ensure your API key is correct and valid, then try again.",
                    "points_lost": 0.0
                }
            ],
            coaching_tips=["Check application logs for Gemini API connection issues."]
        )
