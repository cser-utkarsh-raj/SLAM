import io
import json
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()
app = FastAPI(title="SLAM API", version="1.0.0")
allowed_origins = [x.strip() for x in os.getenv("SLAM_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_credentials=True, allow_methods=["GET", "POST"], allow_headers=["*"])

AI_MODELS = {"nvidia": os.getenv("NVIDIA_MODEL", "meta/llama-3.1-70b-instruct"), "openrouter": os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")}

def ai_clients():
    clients = []
    if os.getenv("NVIDIA_API_KEY"):
        clients.append(("nvidia", OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=os.environ["NVIDIA_API_KEY"])))
    if os.getenv("OPENROUTER_API_KEY"):
        clients.append(("openrouter", OpenAI(base_url="https://openrouter.ai/api/v1", api_key=os.environ["OPENROUTER_API_KEY"])))
    return clients

def ask_ai(instruction: str, payload: Any):
    prompt = instruction + "\n\nINPUT:\n" + json.dumps(payload, ensure_ascii=False, default=str)
    for provider, client in ai_clients():
        try:
            r = client.chat.completions.create(model=AI_MODELS[provider], messages=[{"role": "user", "content": prompt}], temperature=0.1)
            text = (r.choices[0].message.content or "").strip()
            match = re.search(r"\{.*\}", text, re.DOTALL)
            return json.loads(match.group(0) if match else text), f"{provider}:{AI_MODELS[provider]}"
        except Exception:
            continue
    return None, None

def extract_document_text(filename: str, data: bytes) -> str:
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".txt":
        return data.decode("utf-8", errors="ignore")
    if ext == ".pdf":
        from pypdf import PdfReader
        return "\n".join(page.extract_text() or "" for page in PdfReader(io.BytesIO(data)).pages).strip()
    if ext == ".docx":
        from docx import Document
        return "\n".join(p.text for p in Document(io.BytesIO(data)).paragraphs).strip()
    raise HTTPException(415, "Supported resume formats: PDF, DOCX and TXT")

def empty_profile():
    return {"name":"","email":"","phone":"","location":"","country":"","timezone":"","headline":"","summary":"","yearsOfExperience":0,"currentRole":"","targetRoles":[],"industries":[],"skills":[],"technologies":[],"certifications":[],"education":[],"workHistory":[],"languages":[],"workAuth":"Unknown","sponsorshipRequired":False,"noticePeriod":"","availability":"","relocationPreference":"No","salaryExpectation":""}

def deterministic_profile(text: str):
    p = empty_profile()
    lines = [x.strip() for x in text.splitlines() if x.strip()]
    email = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", text)
    phone = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", text)
    p["name"] = lines[0] if lines and len(lines[0]) < 70 and "@" not in lines[0] else ""
    p["email"] = email.group(0) if email else ""
    p["phone"] = phone.group(0).strip() if phone else ""
    catalog = ["Python","JavaScript","TypeScript","React","Next.js","Node.js","FastAPI","Django","SQL","PostgreSQL","MongoDB","AWS","Docker","Kubernetes","Git","GraphQL","Java","C++","Go","Rust","Figma","Tailwind CSS"]
    p["skills"] = [s for s in catalog if re.search(rf"\b{re.escape(s)}\b", text, re.I)]
    return p

@app.get("/api/health")
def health():
    return {"status":"ok", "aiProviders":[x for x,_ in ai_clients()]}

@app.post("/api/ai/parse-resume")
async def parse_resume(request: Request):
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" in content_type:
        form = await request.form()
        upload = form.get("file")
        if upload is None or not hasattr(upload, "read"):
            raise HTTPException(400, "Attach the resume as field 'file'.")
        data = await upload.read()
        filename = getattr(upload, "filename", "resume.pdf") or "resume.pdf"
        if len(data) > 10 * 1024 * 1024:
            raise HTTPException(413, "Resume is larger than 10 MB")
        text = extract_document_text(filename, data)
    else:
        body = await request.json()
        text = str(body.get("textContent", ""))
    if not text.strip():
        raise HTTPException(422, "No readable resume text was found.")
    profile, engine = ask_ai("Extract only facts explicitly present in this resume. Return JSON with name,email,phone,location,country,timezone,headline,summary,yearsOfExperience,currentRole,targetRoles,industries,skills,technologies,certifications,education,workHistory,languages,workAuth,sponsorshipRequired,noticePeriod,availability,relocationPreference,salaryExpectation. Never invent employers, dates, metrics, qualifications, contact details or personal facts. Use empty values when absent.", {"resumeText": text[:30000]})
    if not profile:
        profile, engine = deterministic_profile(text), "deterministic-extraction"
    return {"profile":profile, "engine":engine, "sourceTextLength":len(text)}

class MatchRequest(BaseModel):
    profile: dict[str,Any]
    job: dict[str,Any]

@app.post("/api/ai/match-analysis")
def match_analysis(req: MatchRequest):
    result, engine = ask_ai("Evaluate candidate/job compatibility. Return JSON with compatibilityScore 0-100, opportunityScore, matchedSkills, partialSkills, missingSkills, strengths, concerns, isEligible, eligibilityReason and breakdown with skillsScore,experienceScore,roleScore,locationScore,qualificationScore. Use only supplied facts.", {"profile":req.profile,"job":req.job})
    if result: return {"result":result,"engine":engine}
    skills={str(x).lower() for x in req.profile.get("skills",[])+req.profile.get("technologies",[])}
    required=[str(x) for x in req.job.get("requiredSkills",[])]
    matched=[x for x in required if x.lower() in skills]; missing=[x for x in required if x.lower() not in skills]
    ss=round(100*len(matched)/max(1,len(required))); exp=float(req.profile.get("yearsOfExperience") or 0); minimum=float(req.job.get("minYearsExperience") or 0); es=100 if exp>=minimum else max(0,round(100-(minimum-exp)*20)); score=round(ss*.55+es*.25+70*.20)
    return {"result":{"compatibilityScore":score,"opportunityScore":score,"isEligible":score>=50,"eligibilityReason":"Based only on supplied profile and job data.","matchedSkills":matched,"partialSkills":[],"missingSkills":missing,"strengths":[f"Matches {len(matched)} listed required skills"],"concerns":[f"Missing: {', '.join(missing[:5])}"] if missing else [],"breakdown":{"skillsScore":ss,"experienceScore":es,"roleScore":70,"locationScore":70,"qualificationScore":70},"confidence":"Deterministic"},"engine":"deterministic-scoring"}

class JobSearchRequest(BaseModel):
    query:str=Field(default="software engineer",min_length=2,max_length=120)
    location:str=""
    remote:bool=False
    limit:int=Field(default=20,ge=1,le=50)

@app.post("/api/jobs/search")
async def search_jobs(req:JobSearchRequest):
    jobs=[]
    try:
        async with httpx.AsyncClient(timeout=12,follow_redirects=True) as client:
            r=await client.get("https://www.arbeitnow.com/api/job-board-api",params={"search":req.query}); r.raise_for_status()
            for item in r.json().get("data",[]):
                loc=str(item.get("location", "")); title=str(item.get("title", ""));
                if req.location and req.location.lower() not in loc.lower(): continue
                if req.remote and not item.get("remote"): continue
                jobs.append({"id":f"arbeitnow:{item.get('slug') or item.get('id')}","title":title,"normalizedTitle":title,"roleFamily":"","company":item.get("company_name", ""),"location":loc,"remote":bool(item.get("remote")),"remoteType":"Remote" if item.get("remote") else "On-site","employmentType":"Full-time","experienceLevel":"","minYearsExperience":0,"description":re.sub(r"<[^>]+>"," ",str(item.get("description", "")))[:6000],"responsibilities":[],"requirements":[],"requiredSkills":[],"preferredSkills":[],"postingDate":str(item.get("created_at", "")),"freshnessLabel":"Live listing","lastSeenAt":datetime.now(timezone.utc).isoformat(),"applicationUrl":item.get("url", ""),"primarySource":"Arbeitnow public feed","sourcesList":[],"applicationMethod":"External Form","hardRequirements":[],"requiresWorkAuth":False})
    except Exception as e:
        return {"jobs":[],"count":0,"source":"Arbeitnow","error":f"Job discovery unavailable: {type(e).__name__}"}
    return {"jobs":jobs[:req.limit],"count":min(len(jobs),req.limit),"source":"Arbeitnow public feed"}

@app.post("/api/ai/cover-letter")
def cover_letter(req:MatchRequest):
    result,engine=ask_ai("Write a concise factual cover letter using only the supplied candidate and job information. Never invent achievements. Return JSON {coverLetter:string}.",{"profile":req.profile,"job":req.job})
    if result:return {"coverLetter":result.get("coverLetter", ""),"engine":engine}
    return {"coverLetter":"","engine":"unavailable","error":"AI provider unavailable; no fabricated letter was generated."}
