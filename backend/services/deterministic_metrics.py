import re

def count_syllables_in_word(word: str) -> int:
    """
    Estimate the number of syllables in a word using basic heuristics.
    """
    word = word.lower().strip()
    # Remove punctuation
    word = re.sub(r'[^\w\s]', '', word)
    if not word:
        return 0
        
    vowels = "aeiouy"
    count = 0
    
    # Check if first character is a vowel
    if word[0] in vowels:
        count += 1
        
    # Check for vowel-consonant transitions
    for index in range(1, len(word)):
        if word[index] in vowels and word[index - 1] not in vowels:
            count += 1
            
    # Adjust for silent 'e' at the end of word
    if word.endswith("e"):
        count -= 1
        
    # Adjust for common prefixes/suffixes or ensure we have at least 1 syllable
    if word.endswith("le") and len(word) > 2 and word[-3] not in vowels:
        count += 1
        
    if count == 0:
        count = 1
        
    return count

def compute_text_metrics(text: str) -> dict:
    """
    Computes deterministic readability and structural metrics for text.
    Returns:
        - word_count
        - sentence_count
        - avg_words_per_sentence
        - flesh_reading_ease
    """
    if not text or not text.strip():
        return {
            "word_count": 0,
            "sentence_count": 0,
            "avg_words_per_sentence": 0.0,
            "flesh_reading_ease": 0.0
        }

    # Clean text for word splitting
    words = re.findall(r"\b\w+\b", text)
    word_count = len(words)
    
    # Split sentences by simple punctuation marks followed by space or end of string
    sentences = re.split(r"[.!?]+(?:\s+|$)", text.strip())
    # Filter empty items in case of trailing punctuation
    sentences = [s for s in sentences if s.strip()]
    sentence_count = len(sentences)
    
    if sentence_count == 0:
        sentence_count = 1

    avg_words_per_sentence = word_count / sentence_count
    
    # Syllables calculation
    total_syllables = sum(count_syllables_in_word(w) for w in words)
    
    # Flesch Reading Ease Formula
    # 206.835 - 1.015 * (total_words / total_sentences) - 84.6 * (total_syllables / total_words)
    if word_count > 0:
        flesh_reading_ease = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (total_syllables / word_count)
        # Bound it between 0 and 100 for display safety, although formulas can exceed
        flesh_reading_ease = max(0.0, min(100.0, round(flesh_reading_ease, 2)))
    else:
        flesh_reading_ease = 0.0

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_words_per_sentence": round(avg_words_per_sentence, 2),
        "flesh_reading_ease": flesh_reading_ease
    }

def compute_audio_metrics(text: str, duration_seconds: float) -> dict:
    """
    Computes speech-specific metrics: WPM and filler word count.
    """
    if not text or not text.strip():
        return {
            "wpm": 0,
            "filler_word_count": 0
        }
    
    # 1. Word count
    words = re.findall(r"\b\w+\b", text.lower())
    word_count = len(words)
    
    # 2. Words Per Minute (WPM)
    # Average WPM = (Word Count / Duration in Seconds) * 60
    if duration_seconds > 0:
        wpm = round((word_count / duration_seconds) * 60)
    else:
        # Default WPM estimate if duration not supplied (average conversational WPM is 135)
        wpm = 135
        
    # 3. Filler word count
    # Look for common fillers
    filler_patterns = [
        r"\bum\b", r"\buh\b", r"\blike\b", r"\byou\s+know\b", 
        r"\bsort\s+of\b", r"\bkind\s+of\b", r"\bbasically\b"
    ]
    
    filler_word_count = 0
    for pattern in filler_patterns:
        matches = re.findall(pattern, text.lower())
        filler_word_count += len(matches)
        
    return {
        "wpm": wpm,
        "filler_word_count": filler_word_count
    }
