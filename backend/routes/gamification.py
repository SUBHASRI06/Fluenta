from fastapi import APIRouter, HTTPException
from backend.storage.db import get_db_connection
from backend.services.gamification_service import BADGE_DEFINITIONS, update_streak, check_and_award_badges

router = APIRouter(prefix="/api/gamification", tags=["Gamification"])

@router.get("/status/{session_email}")
async def get_status(session_email: str):
    """
    Returns user's streak and earned badges.
    """
    update_streak(session_email) # passive streak check/update
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM streaks WHERE session_email = ?", (session_email,))
    streak_row = cursor.fetchone()
    
    cursor.execute("SELECT badge_key, earned_at FROM achievements WHERE session_email = ?", (session_email,))
    earned_rows = cursor.fetchall()
    
    conn.close()
    
    earned_badges = [dict(r) for r in earned_rows]
    earned_keys = {b["badge_key"] for b in earned_badges}
    
    all_badges = []
    for key, info in BADGE_DEFINITIONS.items():
        all_badges.append({
            "key": key,
            "name": info["name"],
            "description": info["description"],
            "earned": key in earned_keys
        })
        
    return {
        "streak": dict(streak_row) if streak_row else {"current_streak": 0, "longest_streak": 0},
        "badges": all_badges
    }
