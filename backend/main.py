import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.config import config
from backend.routes import text_assessment, audio_assessment, history, gamification, learning, analytics, export, auth, practice
from backend.storage.db import init_db

app = FastAPI(
    title="AI Communication Intelligence Platform API",
    description="Backend service evaluating written and spoken communication.",
    version="1.0.0"
)

@app.on_event("startup")
def on_startup():
    init_db()


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For simplicity today; narrow down in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(practice.router)
app.include_router(text_assessment.router)
app.include_router(audio_assessment.router)
app.include_router(history.router)
app.include_router(gamification.router)
app.include_router(learning.router)
app.include_router(analytics.router)
app.include_router(export.router)

# Health Check Route
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_api_configured": bool(config.GEMINI_API_KEY)
    }

# Fallback to serve React frontend files if built
if os.path.exists(config.FRONTEND_DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(config.FRONTEND_DIST_DIR, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Allow API routes to 404 naturally if not found above
        if full_path.startswith("api/"):
            return {"error": "API route not found"}
            
        index_path = os.path.join(config.FRONTEND_DIST_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Frontend build not found."}
else:
    @app.get("/")
    async def index_fallback():
        return {
            "message": "AI Communication Intelligence Platform API is running. Build the frontend to see the UI here, or access /docs for API details."
        }
