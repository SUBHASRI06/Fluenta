from backend.storage.db import get_db_connection
import datetime

BADGE_DEFINITIONS = {
    "first_steps": {"name": "First Steps", "description": "Completed your first assessment."},
    "consistency_master": {"name": "Consistency Master", "description": "Completed 5 assessments."},
    "grammar_guru": {"name": "Grammar Guru", "description": "Scored 90%+ in Grammar & Mechanics."},
    "eloquent_speaker": {"name": "Eloquent Speaker", "description": "Scored 90%+ in Clarity & Conciseness."},
    "perfect_score": {"name": "Perfect Score", "description": "Scored 100% on any assessment."},
    "week_streak": {"name": "Week Streak", "description": "7 consecutive days of practice."}
}

def check_and_award_badges(session_email: str):
    """
    Evaluates user history and awards missing badges.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get existing badges
    cursor.execute("SELECT badge_key FROM achievements WHERE session_email = ?", (session_email,))
    earned = {row["badge_key"] for row in cursor.fetchall()}
    
    # Get user stats
    cursor.execute("SELECT * FROM assessments WHERE session_email = ?", (session_email,))
    assessments = cursor.fetchall()
    
    cursor.execute("SELECT * FROM streaks WHERE session_email = ?", (session_email,))
    streak_row = cursor.fetchone()
    
    new_badges = []
    
    if len(assessments) >= 1 and "first_steps" not in earned:
        new_badges.append("first_steps")
    
    if len(assessments) >= 5 and "consistency_master" not in earned:
        new_badges.append("consistency_master")
        
    for assmt in assessments:
        import json
        if assmt["assessment_json"]:
            data = json.loads(assmt["assessment_json"])
            overall = float(data.get("overall_score", 0))
            crit = data.get("criteria", {})
            grammar = float(crit.get("grammar_mechanics", 0))
            clarity = float(crit.get("clarity_conciseness", 0))
            
            if grammar >= 22.5 and "grammar_guru" not in earned:  # 22.5/25 = 90%
                new_badges.append("grammar_guru")
            if clarity >= 22.5 and "eloquent_speaker" not in earned:
                new_badges.append("eloquent_speaker")
            if overall >= 100.0 and "perfect_score" not in earned:
                new_badges.append("perfect_score")
                
    if streak_row and streak_row["longest_streak"] >= 7 and "week_streak" not in earned:
        new_badges.append("week_streak")
        
    # Award new badges
    for badge in set(new_badges):
        try:
            cursor.execute("INSERT INTO achievements (session_email, badge_key) VALUES (?, ?)", (session_email, badge))
        except:
            pass # ignore duplicates
            
    conn.commit()
    conn.close()
    
    return new_badges

def update_streak(session_email: str):
    """
    Called when a user practices. Increments streak.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    today = datetime.date.today().isoformat()
    yesterday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
    
    cursor.execute("SELECT * FROM streaks WHERE session_email = ?", (session_email,))
    row = cursor.fetchone()
    
    if not row:
        cursor.execute("""
            INSERT INTO streaks (session_email, current_streak, longest_streak, last_practice_date)
            VALUES (?, 1, 1, ?)
        """, (session_email, today))
    else:
        last_date = row["last_practice_date"]
        current = row["current_streak"]
        longest = row["longest_streak"]
        
        if last_date == today:
            pass # already practiced today
        elif last_date == yesterday:
            current += 1
            longest = max(current, longest)
            cursor.execute("UPDATE streaks SET current_streak = ?, longest_streak = ?, last_practice_date = ? WHERE session_email = ?",
                           (current, longest, today, session_email))
        else:
            # streak broken
            cursor.execute("UPDATE streaks SET current_streak = 1, last_practice_date = ? WHERE session_email = ?",
                           (today, session_email))
                           
    conn.commit()
    conn.close()
    
    check_and_award_badges(session_email)
