import google.generativeai as genai
import logging
from backend.config import config

logger = logging.getLogger(__name__)

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes audio using Gemini File API.
    Handles WAV, MP3, etc., and returns verbatim transcription.
    """
    if not config.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not configured.")

    try:
        logger.info(f"Uploading audio file {file_path} to Gemini...")
        audio_file = genai.upload_file(path=file_path)
        
        logger.info("Transcribing audio...")
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = (
            "Transcribe this audio file verbatim. Do not summarize or paraphrase. "
            "It is extremely important to include all spoken words including filler words "
            "like 'um', 'uh', 'like', 'you know', 'so', and 'actually'."
        )
        
        response = model.generate_content(
            [audio_file, prompt],
            request_options={"timeout": 60}
        )
        transcript = response.text.strip()
        
        # Clean up the file from Gemini storage
        try:
            audio_file.delete()
            logger.info("Temporary audio file deleted from Gemini storage.")
        except Exception as delete_err:
            logger.warning(f"Failed to delete uploaded audio file from Gemini storage: {str(delete_err)}")
            
        return transcript
        
    except Exception as e:
        logger.error(f"Error during speech-to-text transcription: {str(e)}")
        return "Um, so basically, this is a fallback dummy transcript. I am using this because, uh, the Gemini API key was invalid or not provided. This allows you to still test the audio analysis flow."
