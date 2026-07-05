from pydantic import BaseModel, Field
from typing import List, Optional

class CriterionScores(BaseModel):
    clarity_conciseness: float = Field(..., description="Score out of 25 for Clarity & Conciseness")
    grammar_mechanics: float = Field(..., description="Score out of 25 for Grammar & Mechanics")
    tone_professionalism: float = Field(..., description="Score out of 25 for Tone & Professionalism")
    organization_structure: float = Field(..., description="Score out of 25 for Organization & Structure")

class Deduction(BaseModel):
    criterion: str = Field(..., description="The rubric criterion this deduction belongs to: 'Clarity & Conciseness', 'Grammar & Mechanics', 'Tone & Professionalism', or 'Organization & Structure'")
    evidence: str = Field(..., description="Exact quote from the evaluated text or transcript where the issue occurs")
    issue: str = Field(..., description="Explanation of why this is an issue and how it violates the rubric")
    correction: str = Field(..., description="Suggested improvement or corrected text")
    points_lost: float = Field(..., description="Number of points deducted for this specific issue (typically between 0.5 and 5.0)")

class AssessmentResultSchema(BaseModel):
    overall_score: float = Field(..., description="Total overall score out of 100 (sum of the four criteria scores)")
    criteria: CriterionScores = Field(..., description="Breakdown of scores per criterion")
    deductions: List[Deduction] = Field(..., description="Evidence-linked deductions citing exact text spans")
    coaching_tips: List[str] = Field(..., description="Immediate, actionable coaching tips or observations")

class TextAssessmentRequest(BaseModel):
    text: str = Field(..., description="The text to analyze")
    framework: Optional[str] = Field("general", description="The evaluation framework, e.g., 'email', 'essay', 'pitch', 'proposal'")
    session_name: Optional[str] = Field(None, description="User's session name")
    session_email: Optional[str] = Field(None, description="User's session email")

class CoachingPlanSchema(BaseModel):
    weak_areas: List[str] = Field(..., description="2-3 weak areas identified from history")
    recommendations: List[str] = Field(..., description="3-5 specific practice recommendations")
    weekly_goal: str = Field(..., description="One weekly target goal")

class AssessmentResponse(BaseModel):
    id: Optional[str] = Field(None, description="Database assessment ID")
    session_name: Optional[str] = None
    session_email: Optional[str] = None
    timestamp: Optional[str] = None
    word_count: int
    sentence_count: int
    avg_words_per_sentence: float
    flesh_reading_ease: float
    transcript: Optional[str] = Field(None, description="Verbatim transcript of spoken audio, if applicable")
    wpm: Optional[int] = Field(None, description="Words per minute, if applicable")
    filler_word_count: Optional[int] = Field(None, description="Number of filler words detected, if applicable")
    assessment: AssessmentResultSchema
    coaching_plan: Optional[CoachingPlanSchema] = None

