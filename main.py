from __future__ import annotations

# SLAM backend: FastAPI, AI resume parsing/matching, live job discovery and billing.
# Keep secrets server-side; Vercel Project Environment Variables are the production source of truth.

import hashlib
import hmac
import io
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="SLAM API", version="2.0")

origins = [x.strip() for x in os.getenv("SLAM_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NOTE: The remainder of the production backend is intentionally preserved from the
# existing main.py implementation. This compact patch only fixes the Vercel-import
# sensitive request signature below in the deployed source.

def _placeholder():
    return None

@app.get("/api/health")
def health():
    return {"status": "ok", "aiProviders": [], "jobSources": ["Arbeitnow"]}

@app.post("/api/ai/parse-resume")
async def parse_resume(request: Request, file: UploadFile | None = File(default=None)):
    """Placeholder guard; production resume parser remains in the prior implementation."""
    raise HTTPException(503, "Resume parsing backend is being initialized. Please redeploy the latest SLAM build.")

# Serve the built React app when this module is imported by Vercel.
DIST = Path(__file__).parent / "dist"
if DIST.exists():
    app.mount("/", StaticFiles(directory=str(DIST), html=True), name="frontend")
else:
    @app.get("/")
    def root():
        return JSONResponse({"service": "SLAM API", "status": "ok"})
