import json
import logging
import google.generativeai as genai
from backend.config import config

logger = logging.getLogger(__name__)

def generate_learning_pathway(assessment_data: dict) -> dict:
    """
    Analyzes assessment deductions and generates a 4-week structured learning pathway.
    """
    if not config.GEMINI_API_KEY:
        # Provide fallback dummy data
        return {
            "weak_areas": [{"skill": "Clarity", "severity": "High"}],
            "weekly_plan": [
                {
                    "week_number": 1,
                    "theme": "Foundations of Clarity",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Write a 5-sentence summary of your day", "duration_mins": 15},
                        {"day": "Tuesday", "task": "Identify and rewrite passive sentences from a news article", "duration_mins": 20},
                        {"day": "Wednesday", "task": "Practice speaking clearly for 1 minute", "duration_mins": 15},
                        {"day": "Thursday", "task": "Eliminate filler words in a mock conversation", "duration_mins": 20},
                        {"day": "Friday", "task": "Review and summarize the week's learnings", "duration_mins": 30}
                    ]
                },
                {
                    "week_number": 2,
                    "theme": "Structuring Your Thoughts",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Draft a persuasive email using bullet points", "duration_mins": 20},
                        {"day": "Tuesday", "task": "Create an outline for a 5-minute presentation", "duration_mins": 30},
                        {"day": "Wednesday", "task": "Record yourself giving the presentation", "duration_mins": 20},
                        {"day": "Thursday", "task": "Analyze your recording for logical flow", "duration_mins": 20},
                        {"day": "Friday", "task": "Refine the presentation based on analysis", "duration_mins": 30}
                    ]
                },
                {
                    "week_number": 3,
                    "theme": "Grammar and Mechanics",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Complete an online quiz on subject-verb agreement", "duration_mins": 15},
                        {"day": "Tuesday", "task": "Proofread a short story for punctuation errors", "duration_mins": 20},
                        {"day": "Wednesday", "task": "Write 3 paragraphs focusing on varied sentence structures", "duration_mins": 25},
                        {"day": "Thursday", "task": "Read a complex article aloud focusing on pauses", "duration_mins": 15},
                        {"day": "Friday", "task": "Identify common grammatical pitfalls in your writing", "duration_mins": 20}
                    ]
                },
                {
                    "week_number": 4,
                    "theme": "Advanced Communication Skills",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Engage in active listening during a real conversation", "duration_mins": 30},
                        {"day": "Tuesday", "task": "Practice adjusting tone for different audiences (email vs. text)", "duration_mins": 20},
                        {"day": "Wednesday", "task": "Deliver an impromptu 2-minute speech on a random topic", "duration_mins": 15},
                        {"day": "Thursday", "task": "Summarize a technical concept for a layperson", "duration_mins": 25},
                        {"day": "Friday", "task": "Final assessment and reflection on the 4-week journey", "duration_mins": 30}
                    ]
                }
            ],
            "recommended_courses": [
                {"title": "Writing with Confidence", "platform": "Coursera", "url": "https://coursera.org"},
                {"title": "Effective Communication", "platform": "Udemy", "url": "https://udemy.com"},
                {"title": "Public Speaking Mastery", "platform": "YouTube", "url": "https://youtube.com"}
            ]
        }

    # Extract deductions
    deductions = assessment_data.get("assessment", {}).get("deductions", [])
    if hasattr(deductions, "model_dump"):
        deductions = [d.model_dump() for d in deductions]
    elif len(deductions) > 0 and hasattr(deductions[0], "dict"):
        deductions = [d.dict() for d in deductions]

    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an expert curriculum designer and communication coach.
    Based on the following assessment deductions, generate a personalized 4-week learning pathway.

    Deductions Data:
    {json.dumps(deductions, indent=2)}

    Your output MUST be valid JSON adhering exactly to this schema:
    {{
        "weak_areas": [
            {{"skill": "string (e.g. Subject-Verb Agreement)", "severity": "string (High/Medium/Low)"}}
        ],
        "weekly_plan": [
            {{
                "week_number": "integer (1-4)",
                "theme": "string (Focus of the week)",
                "daily_exercises": [
                    {{"day": "string (Monday, Tuesday, etc)", "task": "string (Specific practice prompt)", "duration_mins": "integer"}}
                ]
            }}
        ],
        "recommended_courses": [
            {{"title": "string", "platform": "string (Coursera/Udemy/YouTube)", "url": "string (Provide a real or highly likely generic search URL)"}}
        ]
    }}
    
    Make sure each of the 4 weeks has 5-7 days of exercises (15-30 mins each). Re-use themes if needed but keep exercises specific and actionable.
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            ),
            request_options={"timeout": 60}
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error generating learning pathway: {str(e)}")
        return {
            "weak_areas": [{"skill": "General Communication", "severity": "Medium"}],
            "weekly_plan": [
                {
                    "week_number": 1,
                    "theme": "Foundations of Clarity",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Write a 5-sentence summary of your day", "duration_mins": 15},
                        {"day": "Tuesday", "task": "Identify and rewrite passive sentences from a news article", "duration_mins": 20},
                        {"day": "Wednesday", "task": "Practice speaking clearly for 1 minute", "duration_mins": 15},
                        {"day": "Thursday", "task": "Eliminate filler words in a mock conversation", "duration_mins": 20},
                        {"day": "Friday", "task": "Review and summarize the week's learnings", "duration_mins": 30}
                    ]
                },
                {
                    "week_number": 2,
                    "theme": "Structuring Your Thoughts",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Draft a persuasive email using bullet points", "duration_mins": 20},
                        {"day": "Tuesday", "task": "Create an outline for a 5-minute presentation", "duration_mins": 30},
                        {"day": "Wednesday", "task": "Record yourself giving the presentation", "duration_mins": 20},
                        {"day": "Thursday", "task": "Analyze your recording for logical flow", "duration_mins": 20},
                        {"day": "Friday", "task": "Refine the presentation based on analysis", "duration_mins": 30}
                    ]
                },
                {
                    "week_number": 3,
                    "theme": "Grammar and Mechanics",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Complete an online quiz on subject-verb agreement", "duration_mins": 15},
                        {"day": "Tuesday", "task": "Proofread a short story for punctuation errors", "duration_mins": 20},
                        {"day": "Wednesday", "task": "Write 3 paragraphs focusing on varied sentence structures", "duration_mins": 25},
                        {"day": "Thursday", "task": "Read a complex article aloud focusing on pauses", "duration_mins": 15},
                        {"day": "Friday", "task": "Identify common grammatical pitfalls in your writing", "duration_mins": 20}
                    ]
                },
                {
                    "week_number": 4,
                    "theme": "Advanced Communication Skills",
                    "daily_exercises": [
                        {"day": "Monday", "task": "Engage in active listening during a real conversation", "duration_mins": 30},
                        {"day": "Tuesday", "task": "Practice adjusting tone for different audiences (email vs. text)", "duration_mins": 20},
                        {"day": "Wednesday", "task": "Deliver an impromptu 2-minute speech on a random topic", "duration_mins": 15},
                        {"day": "Thursday", "task": "Summarize a technical concept for a layperson", "duration_mins": 25},
                        {"day": "Friday", "task": "Final assessment and reflection on the 4-week journey", "duration_mins": 30}
                    ]
                }
            ],
            "recommended_courses": [
                {"title": "Writing with Confidence", "platform": "Coursera", "url": "https://coursera.org"},
                {"title": "Effective Communication", "platform": "Udemy", "url": "https://udemy.com"},
                {"title": "Public Speaking Mastery", "platform": "YouTube", "url": "https://youtube.com"}
            ]
        }
