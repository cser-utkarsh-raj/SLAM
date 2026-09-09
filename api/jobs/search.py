from __future__ import annotations

import asyncio
import html
import os
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="SLAM Live Job Discovery", version="5.0.0")

COUNTRY_CODES = {
    "india": "in", "ind": "in", "in": "in", "united states": "us", "usa": "us", "us": "us",
    "united kingdom": "gb", "uk": "gb", "gb": "gb", "canada": "ca", "ca": "ca",
    "australia": "au", "au": "au", "germany": "de", "de": "de", "france": "fr", "fr": "fr",
    "netherlands": "nl", "holland": "nl", "nl": "nl", "ireland": "ie", "ie": "ie",
    "singapore": "sg", "sg": "sg", "new zealand": "nz", "nz": "nz", "spain": "es", "es": "es",
    "italy": "it", "it": "it",
}
ALIASES = {
    "in": ["india", "indian", "bengaluru", "bangalore", "mumbai", "delhi", "new delhi", "hyderabad", "pune", "chennai", "noida", "gurgaon", "gurugram", "kolkata", "ahmedabad", "jaipur", "kochi", "lucknow"],
    "us": ["united states", "usa", "u.s.", "new york", "california", "texas", "florida", "washington", "massachusetts", "illinois", "seattle", "austin", "boston", "chicago", "san francisco", "los angeles"],
    "gb": ["united kingdom", "uk", "u.k.", "england", "scotland", "wales", "london", "manchester", "birmingham", "edinburgh", "glasgow"],
    "ca": ["canada", "toronto", "vancouver", "montreal", "calgary", "ottawa", "ontario", "quebec"],
    "au": ["australia", "sydney", "melbourne", "brisbane", "perth", "adelaide"],
    "de": ["germany", "berlin", "munich", "frankfurt", "hamburg", "cologne", "stuttgart"],
    "fr": ["france", "paris", "lyon", "marseille", "toulouse"],
    "nl": ["netherlands", "holland", "amsterdam", "rotterdam", "utrecht"],
    "ie": ["ireland", "dublin", "cork", "galway"], "sg": ["singapore"],
    "nz": ["new zealand", "auckland", "wellington", "christchurch"],
    "es": ["spain", "madrid", "barcelona", "valencia"], "it": ["italy", "rome", "milan", "turin"],
}
CITY_COUNTRY = {alias: code for code, aliases in ALIASES.items() for alias in aliases}
JOBICY_GEO = {"in": "apac", "us": "usa", "gb": "uk", "ca": "canada", "au": "australia", "de": "germany", "fr": "france", "nl": "netherlands", "ie": "ireland", "sg": "singapore", "nz": "new-zealand", "es": "spain", "it": "italy"}
REMOTE_GLOBAL = ["worldwide", "world wide", "global", "anywhere", "work from anywhere", "all countries", "international remote", "open globally"]
REMOTE_REGION = {
    "in": ["apac", "asia pacific", "asia-pacific", "south asia", "asia"], "us": ["north america", "americas"], "ca": ["north america", "americas"],
    "gb": ["europe", "emea"], "ie": ["europe", "emea"], "fr": ["europe", "emea"], "de": ["europe", "emea"], "nl": ["europe", "emea"], "es": ["europe", "emea"], "it": ["europe", "emea"],
    "au": ["apac", "asia pacific", "oceania"], "nz": ["apac", "asia pacific", "oceania"], "sg": ["apac", "asia pacific"],
}
# Conservative language filter: avoid rejecting English jobs because of common words such as "der" or "die".
GERMAN_STRONG = re.compile(r"\b(kenntnisse|berufserfahrung|bewerbung|lebenslauf|stellenanzeige|arbeitszeit|anstellung|gehalt|deutschkenntnisse|unternehmen|aufgaben|anforderungen|gesucht|deutsche|deutsch)\b", re.I)
GERMAN_WORDS = re.compile(r"\b(und|der|die|das|den|dem|des|mit|für|von|auf|eine|einen|einem|einer|bei|als|werden|wird|sind|sein|erfahrung|abteilung|kunden)\b", re.I)
SKILLS = ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI", "Django", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "GraphQL", "Java", "C++", "Go", "Rust", "Figma", "Tailwind CSS", "Vue", "Angular", "Flutter", "Firebase", "GCP", "Azure", "REST APIs", "HTML", "CSS", "Redis", "Linux", "CI/CD", "Microservices", "System Design", "TensorFlow", "PyTorch", "LLM", "OpenAI", "NLP", "Machine Learning", "Data Science", "Power BI", "Excel", "SaaS"]

class JobSearchRequest(BaseModel):
    query: str = Field(default="", max_length=120)
    location: str = Field(default="", max_length=160)
    country: str = Field(default="", max_length=80)
    remote: bool = False
    limit: int = Field(default=120, ge=1, le=200)
    profile: dict[str, Any] = Field(default_factory=dict)

def clean(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(value or ""))).strip()

def norm(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())

def token(needle: str, text: str) -> bool:
    return bool(needle and re.search(rf"(?<![a-z]){re.escape(norm(needle))}(?![a-z])", norm(text)))

def country_code(country: str, location: str) -> str:
    value = norm(country)
    if value in COUNTRY_CODES:
        return COUNTRY_CODES[value]
    for alias, code in COUNTRY_CODES.items():
        if token(alias, value):
            return code
    for city, code in CITY_COUNTRY.items():
        if token(city, location):
            return code
    return ""

def explicit_country(code: str, text: str) -> bool:
    return any(token(alias, text) for alias in ALIASES.get(code, []))

def likely_german(text: str) -> bool:
    sample = (text or "")[:12000]
    strong = len(GERMAN_STRONG.findall(sample))
    words = len(GERMAN_WORDS.findall(sample))
    umlauts = len(re.findall(r"[äöüÄÖÜß]", sample))
    return strong >= 1 or (words >= 7 and umlauts >= 1)

def requested_city(location: str) -> str:
    first = norm(location).split(",")[0].strip()
    return "" if first in COUNTRY_CODES else first

def location_fit(code: str, requested: str, job_location: str, description: str, remote: bool) -> tuple[bool, str, int]:
    loc, desc = norm(job_location), norm(description)
    combined = f"{loc} {desc}"
    if remote:
        if any(marker in combined for marker in REMOTE_GLOBAL):
            return True, "Remote listing allows worldwide hiring", 100
        if explicit_country(code, combined):
            return True, "Remote listing covers the candidate country", 100
        if any(marker in combined for marker in REMOTE_REGION.get(code, [])):
            return True, "Remote listing covers the candidate region", 90
        return False, "Remote listing does not state eligibility for the candidate country", 0
    if not explicit_country(code, loc):
        return False, "On-site listing is outside the candidate country", 0
    city = requested_city(requested)
    if city and token(city, loc):
        return True, "Job location matches the preferred city", 100
    # Country is a hard requirement; city is a ranking preference so the feed remains useful for relocation.
    return True, "Job is in the candidate country", 75

def infer_skills(text: str) -> list[str]:
    return [skill for skill in SKILLS if re.search(rf"(?<![\w+#]){re.escape(skill)}(?![\w+#])", text or "", re.I)]

def infer_years(text: str) -> int:
    result = 0
    for pattern in [r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?", r"(\d+)\+?\s+years?\s+(?:of\s+)?experience"]:
        result = max([result] + [int(match.group(1)) for match in re.finditer(pattern, text or "", re.I)])
    return result

def roles(profile: dict[str, Any]) -> list[str]:
    values = profile.get("targetRoles") or ([profile.get("currentRole")] if profile.get("currentRole") else [])
    return [norm(value) for value in values if str(value).strip()]

def build_query(req: JobSearchRequest) -> str:
    if req.query.strip():
        return req.query.strip()
    profile = req.profile
    role_values = [str(value).strip() for value in profile.get("targetRoles", []) if str(value).strip()]
    if not role_values and profile.get("currentRole"):
        role_values = [str(profile["currentRole"]).strip()]
    skills = [str(value).strip() for value in profile.get("skills", []) + profile.get("technologies", []) if str(value).strip()]
    return " ".join(role_values[:2] + skills[:3])[:120] or "software engineer"

def query_variants(req: JobSearchRequest, query: str) -> list[str]:
    variants = [query]
    profile = req.profile
    role_values = [str(value).strip() for value in profile.get("targetRoles", []) if str(value).strip()]
    if not role_values and profile.get("currentRole"):
        role_values = [str(profile["currentRole"]).strip()]
    skills = [str(value).strip() for value in profile.get("skills", []) + profile.get("technologies", []) if str(value).strip()]
    if role_values:
        variants.append(role_values[0])
    if role_values and skills:
        variants.append(f"{role_values[0]} {skills[0]}")
    return list(dict.fromkeys(value[:120] for value in variants))[:3]

def score(profile: dict[str, Any], job: dict[str, Any], location_score: int, reason: str) -> dict[str, Any]:
    skills = {norm(value) for value in profile.get("skills", []) + profile.get("technologies", [])}
    required = job.get("requiredSkills", [])
    matched = [skill for skill in required if norm(skill) in skills]
    missing = [skill for skill in required if norm(skill) not in skills]
    skill_score = round(100 * len(matched) / len(required)) if required else 55
    experience = float(profile.get("yearsOfExperience") or 0)
    minimum = float(job.get("minYearsExperience") or 0)
    experience_score = 100 if minimum <= 0 else max(0, min(100, round(100 - max(0, minimum - experience) * 25)))
    role_values = roles(profile)
    title = norm(job.get("title", ""))
    role_score = 100 if role_values and any(role in title or title in role for role in role_values) else (65 if role_values else 60)
    total = round(skill_score * 0.5 + experience_score * 0.2 + role_score * 0.2 + location_score * 0.1)
    return {"compatibilityScore": total, "opportunityScore": total, "matchedSkills": matched, "partialSkills": [], "missingSkills": missing, "strengths": [f"Matches {len(matched)} of {len(required)} detected required skills"] if required else [], "concerns": ([f"Potential skill gap: {', '.join(missing[:5])}"] if missing else []) + ([reason] if location_score < 100 else []), "isEligible": location_score >= 70, "eligibilityReason": reason, "breakdown": {"skillsScore": skill_score, "experienceScore": experience_score, "roleScore": role_score, "locationScore": location_score, "qualificationScore": 70}, "confidence": "Estimated"}

def canonical_url(url: str) -> str:
    try:
        parsed = urlsplit(url)
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/"), "", ""))
    except Exception:
        return url.split("?", 1)[0].rstrip("/")

def normalize_job(source: str, item: dict[str, Any], profile: dict[str, Any], code: str, requested: str) -> dict[str, Any] | None:
    title = clean(str(item.get("title") or item.get("jobTitle") or item.get("position") or ""))
    company_value = item.get("company") or item.get("companyName") or item.get("company_name") or ""
    company = clean(company_value.get("display_name", "") if isinstance(company_value, dict) else str(company_value))
    location = clean(str(item.get("location") or item.get("jobGeo") or item.get("locationName") or "Remote"))
    description = clean(str(item.get("description") or item.get("jobDescription") or item.get("descriptionText") or item.get("jobExcerpt") or ""))
    url = str(item.get("redirect_url") or item.get("apply_url") or item.get("url") or "").strip()
    remote = bool(item.get("remote")) or source in {"Jobicy", "Remote OK"} or "remote" in norm(f"{title} {location}")
    if not title or not company or not url:
        return None
    if source != "Germany" and code != "de" and likely_german(f"{title} {description}"):
        return None
    allowed, reason, location_score = location_fit(code, requested, location, description, remote)
    if not allowed:
        return None
    required = infer_skills(description)
    years = infer_years(description)
    date = str(item.get("created") or item.get("pubDate") or item.get("date") or item.get("created_at") or "")[:10]
    application_method = "Assisted Flow" if ("/apply" in url.lower() or "greenhouse.io" in url.lower() or "jobs.lever.co" in url.lower() or "workable.com" in url.lower()) else "External Form"
    job = {
        "id": f"{source.lower().replace(' ', '-') }:{item.get('id') or item.get('slug') or canonical_url(url)}",
        "title": title, "normalizedTitle": title, "roleFamily": "", "company": company, "companyDomain": "",
        "location": location, "remote": remote, "remoteType": "Remote" if remote else "On-site", "employmentType": "Full-time",
        "experienceLevel": str(item.get("jobLevel") or ""), "minYearsExperience": years, "description": description[:6000],
        "responsibilities": [], "requirements": required, "requiredSkills": required, "preferredSkills": [], "postingDate": date,
        "freshnessLabel": f"Live {source} feed", "lastSeenAt": datetime.now(timezone.utc).isoformat(), "applicationUrl": url,
        "primarySource": source, "sourcesList": [{"sourceName": source, "sourceUrl": url, "sourceType": "Aggregator", "postedDate": date, "isOfficial": False}],
        "applicationMethod": application_method, "hardRequirements": [], "requiresWorkAuth": False,
        "salaryMin": item.get("salary_min") or item.get("salaryMin"), "salaryMax": item.get("salary_max") or item.get("salaryMax"),
        "salaryCurrency": item.get("salaryCurrency") or "", "locationMatch": reason, "locationScore": location_score,
    }
    job["match"] = score(profile, job, location_score, reason) if profile else None
    return job

async def fetch_adzuna_page(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str, page: int) -> list[dict[str, Any]]:
    app_id, app_key = os.getenv("ADZUNA_APP_ID"), os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:
        return []
    params = {"app_id": app_id.strip(), "app_key": app_key.strip(), "results_per_page": 50, "what": query, "sort_by": "date", "content-type": "application/json"}
    if req.location.strip() and not req.remote:
        city = requested_city(req.location)
        if city:
            params["where"] = code if norm(req.location) in COUNTRY_CODES else req.location.strip()
    if req.remote:
        params["what_and"] = "remote"
    response = await client.get(f"https://api.adzuna.com/v1/api/jobs/{code}/search/{page}", params=params)
    response.raise_for_status()
    return [job for item in response.json().get("results", []) if (job := normalize_job("Adzuna", item, req.profile, code, req.location))]

async def fetch_adzuna(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict[str, Any]]:
    calls = [fetch_adzuna_page(client, req, code, variant, page) for variant in query_variants(req, query) for page in (1, 2)]
    results = await asyncio.gather(*calls, return_exceptions=True)
    return [job for result in results if isinstance(result, list) for job in result]

async def fetch_jobicy(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict[str, Any]]:
    params: dict[str, Any] = {"count": 200}
    geo = JOBICY_GEO.get(code)
    if geo:
        params["geo"] = geo
    role = roles(req.profile)[0] if roles(req.profile) else query.split(" ")[0]
    if role:
        params["tag"] = role[:60]
    response = await client.get("https://jobicy.com/api/v2/remote-jobs", params=params)
    response.raise_for_status()
    return [job for item in response.json().get("jobs", []) if (job := normalize_job("Jobicy", item, req.profile, code, req.location))]

async def fetch_remoteok(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict[str, Any]]:
    params: dict[str, Any] = {}
    skills = [norm(value) for value in req.profile.get("skills", []) + req.profile.get("technologies", []) if value]
    if skills:
        params["tags"] = ",".join(skills[:2])
    response = await client.get("https://remoteok.com/api", params=params)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, list):
        return []
    return [job for item in data if isinstance(item, dict) and (job := normalize_job("Remote OK", item, req.profile, code, req.location))]

async def search_jobs(req: JobSearchRequest) -> dict[str, Any]:
    requested = (req.location or req.profile.get("location", "")).strip()
    code = country_code(req.country or req.profile.get("country", ""), requested)
    if not code:
        raise HTTPException(400, "SLAM needs a valid country in the profile before searching.")
    query = build_query(req)
    errors: dict[str, str] = {}
    async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers={"User-Agent": "SLAM/5.0"}) as client:
        async def run(name: str, fn: Any):
            try:
                return name, await fn(client, req, code, query)
            except Exception as exc:
                errors[name] = f"{type(exc).__name__}: source unavailable"
                return name, []
        sources = await asyncio.gather(run("Adzuna", fetch_adzuna), run("Jobicy", fetch_jobicy), run("Remote OK", fetch_remoteok))

    combined: dict[str, dict[str, Any]] = {}
    for source, items in sources:
        for job in items:
            key = canonical_url(str(job.get("applicationUrl", ""))).lower() or "|".join(norm(job.get(field, "")) for field in ("company", "title", "location"))
            if key not in combined:
                combined[key] = job
            else:
                combined[key]["sourcesList"] = combined[key].get("sourcesList", []) + job.get("sourcesList", [])
    jobs = list(combined.values())
    if req.remote:
        jobs = [job for job in jobs if job.get("remote")]
    for job in jobs:
        job["match"] = score(req.profile, job, int(job.get("locationScore") or 0), str(job.get("locationMatch") or "Location verified")) if req.profile else None
        job["isEasyApply"] = job.get("applicationMethod") in {"Assisted Flow", "Supported Automation"}
    jobs.sort(key=lambda job: ((job.get("match") or {}).get("compatibilityScore", 0), job.get("postingDate", "")), reverse=True)
    status = {source: {"available": bool(items), "count": len(items), "configured": source != "Adzuna" or bool(os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY")), "error": errors.get(source, "")} for source, items in sources}
    return {
        "jobs": jobs[:req.limit], "count": len(jobs), "loadedCount": min(len(jobs), req.limit), "query": query, "country": code, "location": requested,
        "sources": status, "sourceErrors": errors, "source": "Live multi-source job discovery (Arbeitnow disabled)",
        "warning": "No verified live listings matched these filters. Try a broader role or enable remote jobs." if not jobs else "",
    }

@app.post("")
@app.post("/")
@app.post("/{path:path}")
async def handler(req: JobSearchRequest):
    return await search_jobs(req)
