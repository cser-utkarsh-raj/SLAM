import re
from datetime import datetime, timezone
from html import unescape
import os

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field

COUNTRY_CODES = {
    "india": "in", "ind": "in", "in": "in",
    "united states": "us", "usa": "us", "us": "us", "u.s.": "us",
    "united kingdom": "gb", "uk": "gb", "gb": "gb",
    "canada": "ca", "ca": "ca",
    "australia": "au", "au": "au",
    "germany": "de", "de": "de",
    "france": "fr", "fr": "fr",
    "netherlands": "nl", "holland": "nl", "nl": "nl",
    "ireland": "ie", "ie": "ie",
    "singapore": "sg", "sg": "sg",
    "new zealand": "nz", "nz": "nz",
    "spain": "es", "es": "es",
    "italy": "it", "it": "it",
}

COUNTRY_ALIASES = {
    "in": ["india", "indian", "bengaluru", "bangalore", "mumbai", "delhi", "new delhi", "hyderabad", "pune", "chennai", "noida", "gurgaon", "gurugram", "kolkata", "ahmedabad", "jaipur", "kochi"],
    "us": ["united states", "usa", "u.s.", "new york", "california", "texas", "florida", "washington", "massachusetts", "illinois", "seattle", "austin", "boston", "chicago", "san francisco", "los angeles"],
    "gb": ["united kingdom", "uk", "u.k.", "england", "scotland", "wales", "london", "manchester", "birmingham", "edinburgh", "glasgow"],
    "ca": ["canada", "toronto", "vancouver", "montreal", "calgary", "ottawa", "ontario", "quebec"],
    "au": ["australia", "sydney", "melbourne", "brisbane", "perth", "adelaide"],
    "de": ["germany", "berlin", "munich", "frankfurt", "hamburg", "cologne", "stuttgart"],
    "fr": ["france", "paris", "lyon", "marseille", "toulouse"],
    "nl": ["netherlands", "holland", "amsterdam", "rotterdam", "utrecht"],
    "ie": ["ireland", "dublin", "cork", "galway"],
    "sg": ["singapore"],
    "nz": ["new zealand", "auckland", "wellington", "christchurch"],
    "es": ["spain", "madrid", "barcelona", "valencia"],
    "it": ["italy", "rome", "milan", "turin"],
}

GERMAN_MARKERS = re.compile(r"\b(und|der|die|das|mit|für|von|auf|eine|einen|bei|als|werden|wird|sind|deutsch|kenntnisse|berufserfahrung|bewerbung|unternehmen|aufgaben|anforderungen)\b", re.I)

class JobSearchRequest(BaseModel):
    query: str = Field(default="", max_length=120)
    location: str = ""
    country: str = ""
    remote: bool = False
    limit: int = Field(default=30, ge=1, le=50)
    profile: dict = Field(default_factory=dict)


def clean_html(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", unescape(value or ""))).strip()


def country_code(country: str) -> str:
    key = re.sub(r"\s+", " ", (country or "").strip().lower())
    if key in COUNTRY_CODES:
        return COUNTRY_CODES[key]
    for name, code in COUNTRY_CODES.items():
        if name in key:
            return code
    return ""


def country_text_matches(code: str, location: str, description: str) -> bool:
    hay = f"{location} {description}".lower()
    aliases = COUNTRY_ALIASES.get(code, [])
    return any(re.search(rf"(?<![a-z]){re.escape(alias)}(?![a-z])", hay) for alias in aliases)


def likely_german(text: str) -> bool:
    matches = len(GERMAN_MARKERS.findall(text[:8000]))
    return matches >= 5


def infer_skills(text: str):
    skills = [
        "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI", "Django", "SQL",
        "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "GraphQL", "Java", "C++", "Go",
        "Rust", "Figma", "Tailwind CSS", "Vue", "Angular", "Flutter", "Firebase", "GCP", "Azure", "REST APIs",
        "HTML", "CSS", "Redis", "Linux", "CI/CD", "Microservices", "System Design"
    ]
    return [skill for skill in skills if re.search(rf"\b{re.escape(skill)}\b", text, re.I)]


def score_job(profile: dict, job: dict):
    skills = {str(x).lower() for x in profile.get("skills", []) + profile.get("technologies", [])}
    required = job.get("requiredSkills", [])
    matched = [x for x in required if str(x).lower() in skills]
    missing = [x for x in required if str(x).lower() not in skills]
    skill_score = round(100 * len(matched) / len(required)) if required else 55
    roles = [str(x).lower() for x in profile.get("targetRoles", [])]
    title = str(job.get("title", "")).lower()
    role_score = 100 if roles and any(r in title or title in r for r in roles) else (65 if roles else 60)
    return {
        "compatibilityScore": round(skill_score * .55 + role_score * .35 + 100 * .10),
        "opportunityScore": round(skill_score * .55 + role_score * .35 + 10),
        "matchedSkills": matched,
        "partialSkills": [],
        "missingSkills": missing,
        "strengths": [f"Matches {len(matched)} of {len(required)} detected skills"] if required else [],
        "concerns": [f"Potential gap: {', '.join(missing[:5])}"] if missing else [],
        "isEligible": True,
        "eligibilityReason": "Country and source filters matched; verify employer-specific work authorization.",
        "breakdown": {"skillsScore": skill_score, "experienceScore": 100, "roleScore": role_score, "locationScore": 100, "qualificationScore": 70},
        "confidence": "Estimated",
    }


def normalize_item(item: dict, code: str, profile: dict):
    location_obj = item.get("location") or {}
    location = str(location_obj.get("display_name") or "").strip()
    description = clean_html(str(item.get("description") or ""))
    title = clean_html(str(item.get("title") or ""))
    company = str((item.get("company") or {}).get("display_name") or "").strip()
    remote = "remote" in f"{title} {location} {description}".lower()
    required = infer_skills(description)
    created = str(item.get("created") or "")
    try:
        posting_date = datetime.fromisoformat(created.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        posting_date = ""
    redirect = str(item.get("redirect_url") or "").strip()
    job = {
        "id": f"adzuna:{code}:{item.get('id')}",
        "title": title,
        "normalizedTitle": title,
        "roleFamily": "",
        "company": company,
        "location": location or "Location not specified",
        "remote": remote,
        "remoteType": "Remote" if remote else "On-site",
        "employmentType": "Full-time" if item.get("contract_time") == "full_time" else "",
        "experienceLevel": "",
        "minYearsExperience": 0,
        "description": description[:6000],
        "responsibilities": [],
        "requirements": required,
        "requiredSkills": required,
        "preferredSkills": [],
        "postingDate": posting_date,
        "freshnessLabel": "Live Adzuna feed",
        "lastSeenAt": datetime.now(timezone.utc).isoformat(),
        "applicationUrl": redirect,
        "primarySource": "Adzuna",
        "sourcesList": [{"sourceName": "Adzuna", "sourceUrl": redirect, "sourceType": "Job aggregator", "postedDate": posting_date, "isOfficial": False}],
        "applicationMethod": "External Form",
        "hardRequirements": [],
        "requiresWorkAuth": False,
    }
    job["match"] = score_job(profile, job) if profile else None
    return job


async def search_jobs(req: JobSearchRequest):
    app_id = os.getenv("ADZUNA_APP_ID", "").strip()
    app_key = os.getenv("ADZUNA_APP_KEY", "").strip()
    if not app_id or not app_key:
        raise HTTPException(503, "Live job search is not configured yet. Add ADZUNA_APP_ID and ADZUNA_APP_KEY in Vercel.")

    code = country_code(req.country)
    if not code:
        raise HTTPException(400, "Enter a supported country (for example India or United States) so SLAM can search the correct national job market.")

    params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": min(max(req.limit * 2, 20), 50),
        "what": req.query.strip() or "software engineer",
        "content-type": "application/json",
        "sort_by": "date",
    }
    if req.location.strip():
        params["where"] = req.location.strip()

    url = f"https://api.adzuna.com/v1/api/jobs/{code}/search/1"
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            response = await client.get(url, params=params, headers={"User-Agent": "SLAM/3.0"})
            response.raise_for_status()
            payload = response.json()
    except httpx.HTTPStatusError as exc:
        raise HTTPException(503, f"Adzuna job search failed ({exc.response.status_code}).") from exc
    except Exception as exc:
        raise HTTPException(503, f"Live job discovery unavailable: {type(exc).__name__}") from exc

    jobs = []
    for item in payload.get("results", []):
        job = normalize_item(item, code, req.profile)
        combined = f"{job['title']} {job['location']} {job['description']}"
        # The country-specific Adzuna endpoint is the primary boundary. These checks stop
        # generic/global remote listings and obvious language-market leakage as a second boundary.
        if req.country and not country_text_matches(code, job["location"], job["description"]):
            if not job["remote"]:
                continue
            continue
        if likely_german(combined) and code != "de":
            continue
        if req.remote and not job["remote"]:
            continue
        jobs.append(job)

    if req.profile:
        jobs.sort(key=lambda x: (x.get("match") or {}).get("compatibilityScore", 0), reverse=True)

    return {
        "jobs": jobs[:req.limit],
        "count": min(len(jobs), req.limit),
        "source": "Adzuna country-specific live feed",
        "country": code,
        "warning": "No verified listings matched this country, location and language filter." if not jobs else "",
    }
