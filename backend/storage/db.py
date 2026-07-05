import sqlite3
import os
import json
import logging
from backend.config import config

logger = logging.getLogger(__name__)

# Parse database path from config URL (e.g., sqlite:///backend/storage/app.db)
db_url = config.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    # Ensure it's absolute if relative to project root
    if not os.path.isabs(db_path):
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(project_root, db_path)
else:
    # Fallback default
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")

def get_db_connection():
    # Ensure directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    logger.info(f"Initializing SQLite database at {db_path}...")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_name TEXT,
            session_email TEXT,
            timestamp TEXT,
            word_count INTEGER,
            sentence_count INTEGER,
            avg_words_per_sentence REAL,
            flesh_reading_ease REAL,
            transcript TEXT,
            wpm INTEGER,
            filler_word_count INTEGER,
            framework TEXT,
            assessment_json TEXT
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learning_pathways (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_email TEXT NOT NULL,
            assessment_id INTEGER NOT NULL,
            pathway_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT 1
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS practice_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_email TEXT NOT NULL,
            exercise_type TEXT NOT NULL,
            focus_area TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL,
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_email TEXT NOT NULL,
            badge_key TEXT NOT NULL,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(session_email, badge_key)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS streaks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_email TEXT NOT NULL UNIQUE,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_practice_date DATE
        )
    """)
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully.")

def save_assessment(assessment_data: dict) -> int:
    """Saves assessment record to SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Extract sub-fields
    assessment_dict = assessment_data.get("assessment")
    if hasattr(assessment_dict, "model_dump"):
        assessment_dict = assessment_dict.model_dump()
    elif hasattr(assessment_dict, "dict"):
        assessment_dict = assessment_dict.dict()
        
    coaching_dict = assessment_data.get("coaching_plan")
    if coaching_dict:
        if hasattr(coaching_dict, "model_dump"):
            coaching_dict = coaching_dict.model_dump()
        elif hasattr(coaching_dict, "dict"):
            coaching_dict = coaching_dict.dict()
        assessment_dict["coaching_plan"] = coaching_dict
        
    assessment_json = json.dumps(assessment_dict)
    
    cursor.execute("""
        INSERT INTO assessments (
            session_name, session_email, timestamp, word_count, sentence_count,
            avg_words_per_sentence, flesh_reading_ease, transcript, wpm,
            filler_word_count, framework, assessment_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        assessment_data.get("session_name"),
        assessment_data.get("session_email"),
        assessment_data.get("timestamp"),
        assessment_data.get("word_count"),
        assessment_data.get("sentence_count"),
        assessment_data.get("avg_words_per_sentence"),
        assessment_data.get("flesh_reading_ease"),
        assessment_data.get("transcript"),
        assessment_data.get("wpm"),
        assessment_data.get("filler_word_count"),
        assessment_data.get("framework", "general"),
        assessment_json
    ))
    
    conn.commit()
    inserted_id = cursor.lastrowid
    conn.close()
    return inserted_id

def get_assessment_history() -> list:
    """Retrieves all assessments from the database sorted by timestamp descending."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM assessments ORDER BY timestamp DESC")
        rows = cursor.fetchall()
        
        history = []
        for row in rows:
            record = dict(row)
            # Parse json back into dict
            if record.get("assessment_json"):
                parsed = json.loads(record["assessment_json"])
                coaching = parsed.pop("coaching_plan", None)
                record["assessment"] = parsed
                record["coaching_plan"] = coaching
                del record["assessment_json"]
            history.append(record)
            
        return history
    except Exception as e:
        logger.error(f"Error fetching history: {str(e)}")
        return []
    finally:
        conn.close()
