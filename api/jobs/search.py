from __future__ import annotations

import asyncio
import html
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="SLAM Live Job Discovery", version="7.0.0")

COUNTRY_CODES = {
    "india": "in", "ind": "in", "in": "in", "south africa": "za", "za": "za",
    "united states": "us", "usa": "us", "us": "us", "united kingdom": "gb", "uk": "gb", "gb": "gb",
    "canada": "ca", "ca": "ca", "australia": "au", "au": "au", "germany": "de", "de": "de",
    "france": "fr", "fr": "fr", "netherlands": "nl", "holland": "nl", "nl": "nl",
    "ireland": "ie", "ie": "ie", "singapore": "sg", "sg": "sg", "new zealand": "nz", "nz": "nz",
    "spain": "es", "es": "es", "italy": "it", "it": "it", "brazil": "br", "br": "br",
    "uae": "ae", "united arab emirates": "ae", "ae": "ae",
}
ALIASES = {
    "in": ["india", "indian", "hyderabad", "patna", "jaipur", "mumbai", "delhi", "new delhi", "bengaluru", "bangalore", "pune", "chennai", "noida", "gurgaon", "gurugram", "kolkata", "ahmedabad", "kochi", "lucknow"],
    "za": ["south africa", "cape town", "johannesburg", "pretoria", "durban", "port elizabeth"],
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
    "br": ["brazil", "sao paulo", "rio de janeiro", "brasilia"],
    "ae": ["uae", "united arab emirates", "dubai", "abu dhabi"],
}
CITY_COUNTRY = {alias: code for code, aliases in ALIASES.items() for alias in aliases}
JOBICY_GEO = {"in": "apac", "za": "africa", "us": "usa", "gb": "uk", "ca": "canada", "au": "australia", "de": "germany", "fr": "france", "nl": "netherlands", "ie": "ireland", "sg": "singapore", "nz": "new-zealand", "es": "spain", "it": "italy"}
REMOTE_GLOBAL = ["worldwide", "world wide", "global", "anywhere", "work from anywhere", "all countries", "international remote", "open globally"]
REMOTE_REGION = {"in": ["apac", "asia pacific", "asia-pacific", "south asia", "asia"], "za": ["africa", "emea"], "us": ["north america", "americas"], "ca": ["north america", "americas"], "gb": ["europe", "emea"], "ie": ["europe", "emea"], "fr": ["europe", "emea"], "de": ["europe", "emea"], "nl": ["europe", "emea"], "es": ["europe", "emea"], "it": ["europe", "emea"], "au": ["apac", "asia pacific", "oceania"], "nz": ["apac", "asia pacific", "oceania"], "sg": ["apac", "asia pacific"], "br": ["latam", "latin america", "americas"], "ae": ["middle east", "emea"]}
GERMAN_STRONG = re.compile(r"\b(kenntnisse|berufserfahrung|bewerbung|lebenslauf|stellenanzeige|arbeitszeit|anstellung|gehalt|deutschkenntnisse|unternehmen|aufgaben|anforderungen|gesucht|deutsche|deutsch)\b", re.I)
SKILLS = ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI", "Django", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "GraphQL", "Java", "C++", "Go", "Rust", "Figma", "Tailwind CSS", "Vue", "Angular", "Flutter", "Firebase", "GCP", "Azure", "REST APIs", "HTML", "CSS", "Redis", "Linux", "CI/CD", "Microservices", "System Design", "TensorFlow", "PyTorch", "LLM", "OpenAI", "NLP", "Machine Learning", "Data Science", "Power BI", "Excel", "SaaS"]

class JobSearchRequest(BaseModel):
    query: str = Field(default="", max_length=120)
    location: str = Field(default="", max_length=160)
    country: str = Field(default="", max_length=80)
    remote: bool = False
    limit: int = Field(default=120, ge=1, le=200)
    profile: dict[str, Any] = Field(default_factory=dict)

def norm(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip().lower())

def clean(value: Any) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html.unescape(str(value or "")))).strip()

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

def requested_city(location: str) -> str:
    first = norm(location).split(",")[0].strip()
    return "" if first in COUNTRY_CODES else first

def explicit_country(code: str, text: str) -> bool:
    return any(token(alias, text) for alias in ALIASES.get(code, []))

def likely_german(text: str) -> bool:
    return bool(GERMAN_STRONG.search(clean(text)[:12000]))

def role_family(profile: dict[str, Any]) -> tuple[str, list[str]]:
    raw = " ".join(str(x) for x in (profile.get("targetRoles") or []) + ([profile.get("currentRole")] if profile.get("currentRole") else [])).lower()
    if any(x in raw for x in ["data scientist", "data science", "machine learning", "ml engineer", "ai engineer", "artificial intelligence"]):
        return "Data & AI", ["data scientist", "machine learning engineer", "ai engineer", "data analyst"]
    if any(x in raw for x in ["devops", "sre", "site reliability", "cloud engineer", "platform engineer"]):
        return "Cloud & DevOps", ["devops engineer", "cloud engineer", "site reliability engineer", "platform engineer"]
    if any(x in raw for x in ["frontend", "front-end", "react developer", "ui developer"]):
        return "Frontend Engineering", ["frontend developer", "frontend engineer", "react developer", "web developer"]
    if any(x in raw for x in ["backend", "back-end", "api developer"]):
        return "Backend Engineering", ["backend developer", "backend engineer", "api developer", "software engineer"]
    if any(x in raw for x in ["full stack", "full-stack"]):
        return "Full Stack Engineering", ["full stack developer", "full stack engineer", "software engineer", "web developer"]
    if any(x in raw for x in ["mobile", "android", "ios", "flutter"]):
        return "Mobile Engineering", ["mobile developer", "android developer", "ios developer", "flutter developer"]
    if any(x in raw for x in ["security", "cyber", "infosec"]):
        return "Cybersecurity", ["cybersecurity analyst", "security engineer", "information security"]
    if any(x in raw for x in ["qa", "quality assurance", "test engineer", "automation tester"]):
        return "Quality Engineering", ["qa engineer", "test engineer", "automation engineer", "software engineer"]
    if any(x in raw for x in ["product manager", "product owner"]):
        return "Product", ["product manager", "product owner", "technical product manager"]
    return "Software & Technology", ["software engineer", "software developer", "backend developer", "full stack developer", "web developer"]

def build_queries(req: JobSearchRequest) -> tuple[str, list[str], str]:
    family, roles = role_family(req.profile)
    requested = req.query.strip()
    presets = {"software engineering", "backend", "frontend", "data & ai", "cloud & devops", "product"}
    if requested and requested.lower() not in presets:
        return requested, list(dict.fromkeys([requested] + roles[:2])), family
    return family, roles[:3], family

def adzuna_location(value: Any) -> str:
    if not isinstance(value, dict):
        return clean(value)
    area = value.get("area")
    display = clean(value.get("display_name"))
    if isinstance(area, list) and area:
        parts = [clean(x) for x in area if clean(x)]
        if display and all(norm(x) not in norm(display) for x in parts):
            parts = [*reversed(parts)]
            return ", ".join(parts)
        return ", ".join(parts)
    return display

def parse_date(value: Any) -> str:
    return str(value or "")[:10]

def is_fresh(date_text: str, max_days: int = 60) -> bool:
    if not date_text:
        return False
    try:
        parsed = datetime.strptime(date_text[:10], "%Y-%m-%d").date()
        return datetime.now(timezone.utc).date() - parsed <= timedelta(days=max_days)
    except ValueError:
        return False

def infer_skills(text: str) -> list[str]:
    return [skill for skill in SKILLS if re.search(rf"(?<![\w+#]){re.escape(skill)}(?![\w+#])", text or "", re.I)]

def infer_years(text: str) -> int:
    values = []
    for pattern in [r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?", r"(\d+)\+?\s+years?\s+(?:of\s+)?experience"]:
        values.extend(int(match.group(1)) for match in re.finditer(pattern, text or "", re.I))
    return max(values, default=0)

def profile_roles(profile: dict[str, Any]) -> list[str]:
    values = profile.get("targetRoles") or ([profile.get("currentRole")] if profile.get("currentRole") else [])
    return [norm(value) for value in values if str(value).strip()]

def location_fit(code: str, requested: str, job_location: str, description: str, remote: bool, feed_country: str = "") -> tuple[bool, str, int]:
    loc = norm(job_location)
    combined = f"{loc} {norm(description)}"
    if remote:
        if feed_country == code:
            return True, "Remote feed is scoped to the candidate region", 95
        if any(x in combined for x in REMOTE_GLOBAL):
            return True, "Worldwide remote eligibility", 100
        if explicit_country(code, combined):
            return True, "Remote eligibility includes candidate country", 100
        if any(x in combined for x in REMOTE_REGION.get(code, [])):
            return True, "Remote eligibility includes candidate region", 90
        return False, "Remote eligibility does not include candidate country or region", 0
    if not explicit_country(code, loc):
        return False, "Listing is outside the candidate country", 0
    city = requested_city(requested)
    return (True, "Preferred city match", 100) if city and token(city, loc) else (True, "Candidate-country match", 80)

def canonical_url(url: str) -> str:
    try:
        parsed = urlsplit(url)
        return urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip("/"), "", ""))
    except Exception:
        return url.split("?", 1)[0].rstrip("/")

def match_score(profile: dict[str, Any], title: str, required: list[str], location_score: int, minimum_years: int) -> dict[str, Any]:
    skills = {norm(x) for x in (profile.get("skills", []) + profile.get("technologies", []))}
    matched = [x for x in required if norm(x) in skills]
    missing = [x for x in required if norm(x) not in skills]
    experience = float(profile.get("yearsOfExperience") or 0)
    exp_score = 100 if minimum_years <= 0 else max(0, min(100, round(100 - max(0, minimum_years - experience) * 25)))
    targets = profile_roles(profile)
    role_score = 100 if targets and any(r in norm(title) or norm(title) in r for r in targets) else 65
    skill_score = round(100 * len(matched) / len(required)) if required else 55
    total = round(skill_score * 0.5 + exp_score * 0.2 + role_score * 0.2 + location_score * 0.1)
    return {
        "compatibilityScore": total, "opportunityScore": total, "matchedSkills": matched, "partialSkills": [], "missingSkills": missing,
        "strengths": [f"Matches {len(matched)} of {len(required)} detected skills"] if required else [],
        "concerns": [f"Potential skill gap: {', '.join(missing[:5])}"] if missing else [],
        "isEligible": location_score >= 70, "eligibilityReason": "Country/location eligible", "confidence": "Estimated",
        "breakdown": {"skillsScore": skill_score, "experienceScore": exp_score, "roleScore": role_score, "locationScore": location_score, "qualificationScore": 70},
    }

def normalize_job(source: str, item: dict[str, Any], profile: dict[str, Any], code: str, requested: str, feed_country: str = "") -> dict[str, Any] | None:
    title = clean(item.get("title") or item.get("jobTitle") or item.get("position"))
    company_value = item.get("company") or item.get("companyName") or item.get("company_name")
    company = clean(company_value.get("display_name") if isinstance(company_value, dict) else company_value)
    if source == "Adzuna":
        location = adzuna_location(item.get("location"))
    else:
        location = clean(item.get("jobGeo") or item.get("jobLocation") or item.get("location") or item.get("locationName") or item.get("geo") or "Remote")
    description = clean(item.get("description") or item.get("jobDescription") or item.get("descriptionText") or item.get("jobExcerpt"))
    url = str(item.get("redirect_url") or item.get("apply_url") or item.get("url") or "").strip()
    date = parse_date(item.get("created") or item.get("pubDate") or item.get("date") or item.get("published") or item.get("created_at"))
    remote = bool(item.get("remote")) or source in {"Jobicy", "Remote OK"} or "remote" in norm(f"{title} {location}")
    if not title or not company or not url or not date or not is_fresh(date):
        return None
    if code != "de" and likely_german(f"{title} {description}"):
        return None
    allowed, reason, location_score = location_fit(code, requested, location, description, remote, feed_country)
    if not allowed:
        return None
    required = infer_skills(description)
    years = infer_years(description)
    salary_min = item.get("salary_min") or item.get("salaryMin")
    salary_max = item.get("salary_max") or item.get("salaryMax")
    currency = item.get("salaryCurrency") or item.get("salary_currency") or ""
    job = {
        "id": f"{source.lower().replace(' ', '-')}:{item.get('id') or item.get('slug') or canonical_url(url)}",
        "title": title, "normalizedTitle": title, "roleFamily": "", "company": company, "companyDomain": "", "location": location,
        "remote": remote, "remoteType": "Remote" if remote else "On-site", "employmentType": clean(item.get("contract_time") or item.get("jobType") or "Full-time"),
        "experienceLevel": clean(item.get("jobLevel") or ""), "minYearsExperience": years, "minSalary": salary_min, "maxSalary": salary_max,
        "currency": currency, "salaryText": clean(item.get("salary_min") and item.get("salary_max") and f"{item.get('salary_min')} - {item.get('salary_max')}" or ""),
        "description": description[:6000], "responsibilities": [], "requirements": required, "requiredSkills": required, "preferredSkills": [],
        "postingDate": date, "freshnessLabel": "Verified recent source listing", "lastSeenAt": datetime.now(timezone.utc).isoformat(),
        "applicationUrl": url, "primarySource": source, "sourcesList": [{"sourceName": source, "sourceUrl": url, "sourceType": "Live feed", "postedDate": date, "isOfficial": False}],
        "applicationMethod": "External Form", "hardRequirements": [], "requiresWorkAuth": False, "locationMatch": reason, "locationScore": location_score,
    }
    job["match"] = match_score(profile, title, required, location_score, years)
    return job

async def get_json(client: httpx.AsyncClient, url: str, params: dict[str, Any] | None = None) -> Any:
    try:
        response = await client.get(url, params=params)
        if response.status_code == 200:
            return response.json()
    except Exception:
        return None
    return None

async def fetch_adzuna(client: httpx.AsyncClient, code: str, queries: list[str]) -> list[dict[str, Any]]:
    app_id = os.getenv("ADZUNA_APP_ID") or os.getenv("ADZUNA_APPID") or os.getenv("ADZUNA_ID")
    app_key = os.getenv("ADZUNA_APP_KEY") or os.getenv("ADZUNA_APPKEY") or os.getenv("ADZUNA_KEY")
    if not app_id or not app_key:
        return []
    results: list[dict[str, Any]] = []
    for query in queries[:2]:
        data = await get_json(client, f"https://api.adzuna.com/v1/api/jobs/{code}/search/1", {"app_id": app_id, "app_key": app_key, "results_per_page": 50, "what": query, "sort_by": "date", "content-type": "application/json"})
        if isinstance(data, dict):
            results.extend(data.get("results") or [])
        if len(results) >= 80:
            break
    return results

async def fetch_jobicy(client: httpx.AsyncClient, code: str, query: str) -> list[dict[str, Any]]:
    geo = JOBICY_GEO.get(code)
    if not geo:
        return []
    data = await get_json(client, "https://jobicy.com/api/v2/remote-jobs", {"count": 200, "geo": geo, "tag": query[:60]})
    return data.get("jobs", []) if isinstance(data, dict) else []

async def fetch_remoteok(client: httpx.AsyncClient, profile: dict[str, Any]) -> list[dict[str, Any]]:
    tags = [norm(x).replace(" ", "-") for x in (profile.get("skills", []) + profile.get("technologies", [])) if str(x).strip()][:2]
    params = {"tags": ",".join(tags)} if tags else None
    data = await get_json(client, "https://remoteok.com/api", params)
    return [item for item in data if isinstance(item, dict) and item.get("position")] if isinstance(data, list) else []

@app.post("/api/jobs/search")
async def search_jobs(req: JobSearchRequest):
    code = country_code(req.country or req.location, req.location)
    if not code:
        raise HTTPException(status_code=400, detail="Please provide a supported country in your profile.")
    visible, queries, _ = build_queries(req)
    requested = req.location or req.country
    timeout = httpx.Timeout(14.0, connect=5.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, headers={"User-Agent": "SLAM/1.0 live-job-discovery"}) as client:
        adzuna_items, jobicy_items, remoteok_items = await asyncio.gather(fetch_adzuna(client, code, queries), fetch_jobicy(client, code, visible), fetch_remoteok(client, req.profile))
    jobs: list[dict[str, Any]] = []
    for item in adzuna_items:
        normalized = normalize_job("Adzuna", item, req.profile, code, requested)
        if normalized:
            jobs.append(normalized)
    for item in jobicy_items:
        normalized = normalize_job("Jobicy", item, req.profile, code, requested, code)
        if normalized:
            jobs.append(normalized)
    for item in remoteok_items:
        normalized = normalize_job("Remote OK", item, req.profile, code, requested)
        if normalized:
            jobs.append(normalized)
    unique: dict[str, dict[str, Any]] = {}
    for job in jobs:
        key = canonical_url(job["applicationUrl"])
        if key and key not in unique:
            unique[key] = job
    jobs = list(unique.values())
    jobs.sort(key=lambda job: (job.get("match", {}).get("compatibilityScore", 0), job.get("postingDate", "")), reverse=True)
    jobs = jobs[: req.limit]
    return {
        "jobs": jobs,
        "query": visible,
        "country": code,
        "source": "Live multi-source feeds — no hardcoded listings",
        "warning": "No recent verified live listings matched this country and role. Try another role or enable remote jobs." if not jobs else "",
        "counts": {"returned": len(jobs), "adzuna": len(adzuna_items), "jobicy": len(jobicy_items), "remote_ok": len(remoteok_items)},
    }
