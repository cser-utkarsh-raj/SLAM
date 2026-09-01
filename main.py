import io
import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="SLAM API", version="1.0.0")

allowed_origins = [x.strip() for x in os.getenv("SLAM_ALLOWED_ORIGINS", "http://localhost:3000").split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


def ai_clients():
    clients = []
    if os.getenv("NVIDIA_API_KEY"):
        clients.append(("nvidia", OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=os.environ["NVIDIA_API_KEY"])))
    if os.getenv("OPENROUTER_API_KEY"):
        clients.append(("openrouter", OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.environ["OPENROUTER_API_KEY"])))
    return clients


AI_MODELS = {
    "nvidia": os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"),
    "openrouter": os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash"),
}


def ask_ai(instruction: str, payload: Any) -> tuple[Any | None, str | None]:
    prompt = instruction + "\n\nINPUT:\n" + json.dumps(payload, ensure_ascii=False, default=str)
    for provider, client in ai_clients():
        try:
            response = client.chat.completions.create(
                model=AI_MODELS[provider],
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            text = (response.choices[0].message.content or "").strip()
            match = re.search(r"\{.*\}", text, re.DOTALL)
            return json.loads(match.group(0) if match else text), f"{provider}:{AI_MODELS[provider]}"
        except Exception:
            continue
    return None, None


def extract_text_from_bytes(filename: str, data: bytes) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".txt":
        return data.decode("utf-8", errors="ignore")
    if ext == ".pdf":
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    if ext == ".docx":
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs).strip()
    raise HTTPException(415, "Supported resume formats: PDF, DOCX, TXT")


def empty_profile() -> dict[str, Any]:
    return {
        "name": "", "email": "", "phone": "", "location": "", "country": "",
        "timezone": "", "headline": "", "summary": "", "yearsOfExperience": 0,
        "currentRole": "", "targetRoles": [], "industries": [], "skills": [],
        "technologies": [], "certifications": [], "education": [], "workHistory": [],
        "languages": [], "workAuth": "Unknown", "sponsorshipRequired": False,
        "noticePeriod": "", "availability": "", "relocationPreference": "No",
        "salaryExpectation": "",
    }


def deterministic_profile(text: str) -> dict[str, Any]:
    profile = empty_profile()
    email = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text)
    phone = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", text)
    profile["email"] = email.group(0) if email else ""
    profile["phone"] = phone.group(0).strip() if phone else ""
    lines = [x.strip() for x in text.splitlines() if x.strip()]
    if lines and len(lines[0]) < 70 and "@" not in lines[0]:
        profile["name"] = lines[0]
    catalog = ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI", "Django", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "GraphQL", "Java", "C++", "Go", "Rust", "Figma", "Tailwind CSS"]
    profile["skills"] = [skill for skill in catalog if re.search(rf"\b{re.escape(skill)}\b", text, re.I)]
    return profile


@app.get("/api/health")
def health():
    return {"status": "ok", "aiProviders": [name for name, _ in ai_clients()]}


@app.post("/api/ai/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > 10 * 1024 * 1024:
        raise HTTPException(413, "Resume is larger than 10 MB")
    text = extract_text_from_bytes(file.filename or "resume.pdf", data)
    if not text:
        raise HTTPException(422, "No readable text was found in this resume. Try a text-based PDF or DOCX.")
    profile, engine = ask_ai(
        "Extract only facts explicitly present in this resume. Return JSON matching a professional profile: name, email, phone, location, country, timezone, headline, summary, yearsOfExperience, currentRole, targetRoles, industries, skills, technologies, certifications, education, workHistory, languages, workAuth, sponsorshipRequired, noticePeriod, availability, relocationPreference, salaryExpectation. Never invent, infer personal facts, employers, dates, metrics, qualifications, or contact details. Use empty values when absent.",
        {"resumeText": text[:30000]},
    )
    if not profile:
        profile = deterministic_profile(text)
        engine = "deterministic-extraction"
    return {"profile": profile, "engine": engine, "sourceTextLength": len(text)}


class MatchRequest(BaseModel):
    profile: dict[str, Any]
    job: dict[str, Any]


@app.post("/api/ai/match-analysis")
def match_analysis(req: MatchRequest):
    ai_result, engine = ask_ai(
        "Evaluate candidate/job compatibility. Return JSON with compatibilityScore 0-100, matchedSkills, partialSkills, missingSkills, strengths, concerns, isEligible, eligibilityReason, and breakdown containing skillsScore, experienceScore, roleScore, locationScore, qualificationScore. Never fabricate requirements or candidate facts. Scores must be explainable from the supplied inputs.",
        {"profile": req.profile, "job": req.job},
    )
    if ai_result:
        return {"result": ai_result, "engine": engine, "confidence": "AI-assisted"}

    profile_skills = {str(x).lower() for x in req.profile.get("skills", []) + req.profile.get("technologies", [])}
    required = [str(x) for x in req.job.get("requiredSkills", [])]
    matched = [x for x in required if x.lower() in profile_skills]
    missing = [x for x in required if x.lower() not in profile_skills]
    skill_score = round(100 * len(matched) / max(1, len(required)))
    exp = float(req.profile.get("yearsOfExperience") or 0)
    minimum = float(req.job.get("minYearsExperience") or 0)
    exp_score = 100 if exp >= minimum else max(0, round(100 - (minimum - exp) * 20))
    score = round(skill_score * 0.55 + exp_score * 0.25 + 70 * 0.20)
    return {"result": {"compatibilityScore": score, "opportunityScore": score, "isEligible": not (missing and score < 50), "eligibilityReason": "Based on supplied requirements and profile." if score >= 50 else "Several supplied requirements are not met.", "matchedSkills": matched, "partialSkills": [], "missingSkills": missing, "strengths": [f"Matches {len(matched)} listed required skills"], "concerns": [f"Missing: {', '.join(missing[:5])}"] if missing else [], "breakdown": {"skillsScore": skill_score, "experienceScore": exp_score, "roleScore": 70, "locationScore": 70, "qualificationScore": 70}, "confidence": "Deterministic"}, "engine": "deterministic-scoring"}


class JobSearchRequest(BaseModel):
    query: str = Field(default="software engineer", min_length=2, max_length=120)
    location: str = ""
    remote: bool = False
    limit: int = Field(default=20, ge=1, le=50)


@app.post("/api/jobs/search")
async def search_jobs(req: JobSearchRequest):
    jobs: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
        # Public job feed. This is discovery only; applications always link to the source.
        try:
            response = await client.get("https://www.arbeitnow.com/api/job-board-api", params={"search": req.query})
            response.raise_for_status()
            for item in response.json().get("data", []):
                text = f"{item.get('title','')} {item.get('description','')}".lower()
                if req.location and req.location.lower() not in text and req.location.lower() not in str(item.get("location", "")).lower():
                    continue
                jobs.append({
                    "id": f"arbeitnow:{item.get('slug') or item.get('id')}",
                    "title": item.get("title", ""), "normalizedTitle": item.get("title", ""),
                    "roleFamily": "", "company": item.get("company_name", ""),
                    "location": item.get("location", ""), "remote": bool(item.get("remote")),
                    "remoteType": "Remote" if item.get("remote") else "On-site", "employmentType": "Full-time",
                    "experienceLevel": "", "minYearsExperience": 0, "salaryText": "",
                    "description": re.sub(r"<[^>]+>", " ", item.get("description", ""))[:6000],
                    "responsibilities": [], "requirements": [], "requiredSkills": [], "preferredSkills": [],
                    "postingDate": item.get("created_at", ""), "freshnessLabel": "Live listing",
                    "lastSeenAt": datetime.now(timezone.utc).isoformat(), "applicationUrl": item.get("url", ""),
                    "primarySource": "Arbeitnow public job feed", "sourcesList": [{"sourceName": "Arbeitnow", "sourceUrl": item.get("url", ""), "sourceType": "Aggregator", "postedDate": item.get("created_at", ""), "isOfficial": False}],
                    "applicationMethod": "External Form", "hardRequirements": [], "requiresWorkAuth": False,
                })
        except Exception:
            pass
    return {"jobs": jobs[: req.limit], "count": min(len(jobs), req.limit), "source": "public job feed", "partial": not bool(jobs)}


@app.post("/api/ai/cover-letter")
def cover_letter(req: MatchRequest):
    result, engine = ask_ai("Write a concise factual cover letter using only the supplied candidate and job information. Never invent achievements. Return JSON {coverLetter: string}.", {"profile": req.profile, "job": req.job})
    if result:
        return {"coverLetter": result.get("coverLetter", ""), "engine": engine}
    return {"coverLetter": "", "engine": "unavailable", "error": "AI provider unavailable; no fabricated letter was generated."}
