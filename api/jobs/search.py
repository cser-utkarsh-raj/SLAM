from __future__ import annotations

import asyncio
import html
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field

# Live, source-first discovery. No listing is fabricated or bundled in the app.
COUNTRY_CODES = {
    "india": "in", "ind": "in", "in": "in", "united states": "us", "usa": "us", "us": "us",
    "united kingdom": "gb", "uk": "gb", "gb": "gb", "canada": "ca", "ca": "ca",
    "australia": "au", "au": "au", "germany": "de", "de": "de", "france": "fr", "fr": "fr",
    "netherlands": "nl", "holland": "nl", "nl": "nl", "ireland": "ie", "ie": "ie",
    "singapore": "sg", "sg": "sg", "new zealand": "nz", "nz": "nz", "spain": "es", "es": "es",
    "italy": "it", "it": "it",
}
COUNTRY_ALIASES = {
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
CITY_TO_COUNTRY = {alias: code for code, aliases in COUNTRY_ALIASES.items() for alias in aliases}
REMOTE_GLOBAL_MARKERS = ["worldwide", "world wide", "global", "anywhere", "work from anywhere", "all countries", "international remote", "open globally"]
GERMAN_MARKERS = re.compile(r"\b(und|der|die|das|mit|für|von|auf|eine|einen|bei|als|werden|wird|sind|deutsch|kenntnisse|berufserfahrung|bewerbung|unternehmen|aufgaben|anforderungen)\b", re.I)
SKILLS = ["Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI", "Django", "SQL", "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "GraphQL", "Java", "C++", "Go", "Rust", "Figma", "Tailwind CSS", "Vue", "Angular", "Flutter", "Firebase", "GCP", "Azure", "REST APIs", "HTML", "CSS", "Redis", "Linux", "CI/CD", "Microservices", "System Design", "TensorFlow", "PyTorch", "LLM", "OpenAI", "NLP", "Machine Learning", "Data Science", "Power BI", "Excel", "SaaS"]


class JobSearchRequest(BaseModel):
    query: str = Field(default="", max_length=120)
    location: str = Field(default="", max_length=160)
    country: str = Field(default="", max_length=80)
    remote: bool = False
    limit: int = Field(default=30, ge=1, le=50)
    profile: dict[str, Any] = Field(default_factory=dict)


def clean_html(value: str) -> str:
    value = html.unescape(value or "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def token_match(needle: str, haystack: str) -> bool:
    needle, haystack = normalize(needle), normalize(haystack)
    return bool(needle and re.search(rf"(?<![a-z]){re.escape(needle)}(?![a-z])", haystack))


def country_code(country: str, location: str = "") -> str:
    value = normalize(country)
    if value in COUNTRY_CODES:
        return COUNTRY_CODES[value]
    for name, code in COUNTRY_CODES.items():
        if token_match(name, value):
            return code
    # If the UI supplied a city/location instead of a country, infer only from
    # our explicit city taxonomy. Never fall back to a global market.
    loc = normalize(location)
    for city, code in CITY_TO_COUNTRY.items():
        if token_match(city, loc):
            return code
    return ""


def aliases_for(code: str) -> list[str]:
    return COUNTRY_ALIASES.get(code, [])


def explicit_country_in_text(code: str, text: str) -> bool:
    return any(token_match(alias, text) for alias in aliases_for(code))


def likely_german(text: str) -> bool:
    return len(GERMAN_MARKERS.findall((text or "")[:10000])) >= 5


def infer_skills(text: str) -> list[str]:
    return [s for s in SKILLS if re.search(rf"(?<![\w+#]){re.escape(s)}(?![\w+#])", text or "", re.I)]


def infer_years(text: str) -> int:
    years = 0
    for pattern in [r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?", r"(\d+)\+?\s+years?\s+(?:of\s+)?experience"]:
        years = max([years, *[int(m.group(1)) for m in re.finditer(pattern, text or "", re.I)]])
    return years


def requested_roles(profile: dict) -> list[str]:
    roles = profile.get("targetRoles") or ([profile.get("currentRole")] if profile.get("currentRole") else [])
    return [normalize(x) for x in roles if str(x).strip()]


def build_query(req: JobSearchRequest) -> str:
    if req.query.strip():
        return req.query.strip()
    p = req.profile or {}
    roles = [str(x).strip() for x in (p.get("targetRoles") or []) if str(x).strip()]
    if not roles and p.get("currentRole"):
        roles = [str(p["currentRole"]).strip()]
    skills = [str(x).strip() for x in (p.get("skills") or []) + (p.get("technologies") or []) if str(x).strip()]
    return " ".join(roles[:2] + skills[:3])[:120] or "software engineer"


def requested_city(location: str) -> str:
    value = normalize(location)
    if not value:
        return ""
    # Handles "Mumbai, Maharashtra, India" and similar structured locations.
    first = normalize(value.split(",")[0])
    return first if first not in COUNTRY_CODES else ""


def location_fit(code: str, requested_location: str, job_location: str, description: str, remote: bool) -> tuple[bool, str, int]:
    req = normalize(requested_location)
    loc = normalize(job_location)
    desc = normalize(description)
    combined = f"{loc} {desc}"
    if remote:
        if any(marker in combined for marker in REMOTE_GLOBAL_MARKERS):
            return True, "Remote listing explicitly allows global hiring", 100
        if explicit_country_in_text(code, combined):
            return True, "Remote listing explicitly covers the candidate country", 100
        regional = {"in": ["apac", "asia pacific", "asia-pacific", "south asia"], "us": ["north america", "americas"], "ca": ["north america", "americas"], "gb": ["europe", "emea"], "ie": ["europe", "emea"], "fr": ["europe", "emea"], "de": ["europe", "emea"], "nl": ["europe", "emea"], "es": ["europe", "emea"], "it": ["europe", "emea"], "au": ["apac", "asia pacific", "oceania"], "nz": ["apac", "asia pacific", "oceania"], "sg": ["apac", "asia pacific"]}
        if any(region in combined for region in regional.get(code, [])):
            return True, "Remote listing explicitly covers the candidate region", 90
        return False, "Remote listing does not state eligibility for the candidate country or region", 0

    if not explicit_country_in_text(code, loc):
        return False, "On-site listing is outside the candidate country", 0
    city = requested_city(req)
    if city:
        if token_match(city, loc):
            return True, "Job location matches the requested city", 100
        # If the city is known to belong to the candidate country, reject other cities.
        if CITY_TO_COUNTRY.get(city) == code:
            return False, "Job is in the right country but not the requested city", 0
    return True, "Job is in the candidate country", 70


def score_job(profile: dict, job: dict, location_score: int, location_reason: str) -> dict:
    skills = {normalize(x) for x in (profile.get("skills") or []) + (profile.get("technologies") or [])}
    required = [str(x) for x in job.get("requiredSkills", [])]
    matched = [x for x in required if normalize(x) in skills]
    missing = [x for x in required if normalize(x) not in skills]
    skill_score = round(100 * len(matched) / len(required)) if required else 55
    experience = float(profile.get("yearsOfExperience") or 0)
    minimum = float(job.get("minYearsExperience") or 0)
    experience_score = 100 if minimum <= 0 else max(0, min(100, round(100 - max(0, minimum - experience) * 25)))
    roles = requested_roles(profile)
    title = normalize(job.get("title", ""))
    role_score = 100 if roles and any(r in title or title in r for r in roles) else (65 if roles else 60)
    total = round(skill_score * .50 + experience_score * .20 + role_score * .20 + location_score * .10)
    return {"compatibilityScore": total, "opportunityScore": total, "matchedSkills": matched, "partialSkills": [], "missingSkills": missing, "strengths": [f"Matches {len(matched)} of {len(required)} detected required skills"] if required else [], "concerns": ([f"Potential skill gap: {', '.join(missing[:5])}"] if missing else []) + ([location_reason] if location_score < 100 else []), "isEligible": location_score >= 70, "eligibilityReason": location_reason, "breakdown": {"skillsScore": skill_score, "experienceScore": experience_score, "roleScore": role_score, "locationScore": location_score, "qualificationScore": 70}, "confidence": "Estimated"}


def normalize_job(*, source: str, source_url: str, job_id: str, title: str, company: str, location: str, description: str, remote: bool, application_url: str, posting_date: str, profile: dict, country: str, requested_location: str, employment_type: str = "", level: str = "", salary_min: Any = None, salary_max: Any = None, salary_currency: str = "") -> dict | None:
    title, company, location, description = map(clean_html, [title, company, location, description])
    application_url = str(application_url or source_url).strip()
    if not title or not company or not application_url:
        return None
    fits, reason, location_score = location_fit(country, requested_location, location, description, remote)
    if not fits:
        return None
    required, years = infer_skills(description), infer_years(description)
    job = {"id": f"{source.lower()}:{job_id}", "title": title, "normalizedTitle": title, "roleFamily": "", "company": company, "location": location or "Location not specified", "remote": bool(remote), "remoteType": "Remote" if remote else "On-site", "employmentType": employment_type, "experienceLevel": level, "minYearsExperience": years, "description": description[:6000], "responsibilities": [], "requirements": required, "requiredSkills": required, "preferredSkills": [], "postingDate": posting_date, "freshnessLabel": f"Live {source} feed", "lastSeenAt": datetime.now(timezone.utc).isoformat(), "applicationUrl": application_url, "primarySource": source, "sourcesList": [{"sourceName": source, "sourceUrl": source_url or application_url, "sourceType": "Live job feed", "postedDate": posting_date, "isOfficial": False}], "applicationMethod": "External Form", "hardRequirements": [], "requiresWorkAuth": False, "salaryMin": salary_min, "salaryMax": salary_max, "salaryCurrency": salary_currency, "locationMatch": reason, "locationScore": location_score}
    job["match"] = score_job(profile, job, location_score, reason) if profile else None
    return job


def dedupe_key(job: dict) -> str:
    url = re.sub(r"[?#].*$", "", normalize(job.get("applicationUrl", ""))).rstrip("/")
    return url or "|".join(normalize(job.get(k, "")) for k in ("company", "title", "location"))


def adzuna_configured() -> bool:
    return bool(os.getenv("ADZUNA_APP_ID", "").strip() and os.getenv("ADZUNA_APP_KEY", "").strip())


async def fetch_adzuna(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict]:
    if not adzuna_configured():
        return []
    params = {"app_id": os.environ["ADZUNA_APP_ID"].strip(), "app_key": os.environ["ADZUNA_APP_KEY"].strip(), "results_per_page": min(max(req.limit * 3, 30), 100), "what": query, "content-type": "application/json", "sort_by": "date"}
    location = req.location.strip()
    if location:
        params["where"] = location
    if req.remote:
        params["what_and"] = "remote"
    r = await client.get(f"https://api.adzuna.com/v1/api/jobs/{code}/search/1", params=params)
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        loc = str((item.get("location") or {}).get("display_name") or "")
        desc, title = clean_html(str(item.get("description") or "")), clean_html(str(item.get("title") or ""))
        is_remote = "remote" in normalize(f"{title} {loc} {desc}")
        created = str(item.get("created") or "")
        try: date = datetime.fromisoformat(created.replace("Z", "+00:00")).date().isoformat()
        except ValueError: date = ""
        job = normalize_job(source="Adzuna", source_url=str(item.get("redirect_url") or ""), job_id=str(item.get("id") or ""), title=title, company=str((item.get("company") or {}).get("display_name") or ""), location=loc, description=desc, remote=is_remote, application_url=str(item.get("redirect_url") or ""), posting_date=date, employment_type="Full-time" if item.get("contract_time") == "full_time" else "", salary_min=item.get("salary_min"), salary_max=item.get("salary_max"), profile=req.profile, country=code, requested_location=req.location)
        if job: out.append(job)
    return out


async def fetch_arbeitnow(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict]:
    r = await client.get("https://www.arbeitnow.com/api/job-board-api", params={"search": query}, headers={"User-Agent": "SLAM/4.0"})
    r.raise_for_status()
    out = []
    for item in r.json().get("data", []):
        loc, desc = str(item.get("location") or ""), clean_html(str(item.get("description") or ""))
        created = item.get("created_at")
        date = datetime.fromtimestamp(created, tz=timezone.utc).date().isoformat() if isinstance(created, (int, float)) else ""
        job = normalize_job(source="Arbeitnow", source_url=str(item.get("url") or ""), job_id=str(item.get("slug") or item.get("id") or ""), title=str(item.get("title") or ""), company=str(item.get("company_name") or ""), location=loc, description=desc, remote=bool(item.get("remote")), application_url=str(item.get("url") or ""), posting_date=date, employment_type="Full-time", profile=req.profile, country=code, requested_location=req.location)
        if job: out.append(job)
    return out


async def fetch_jobicy(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict]:
    geo = {"in": "india", "us": "usa", "gb": "uk", "ca": "canada", "au": "australia", "de": "germany", "fr": "france", "nl": "netherlands", "ie": "ireland", "sg": "singapore", "nz": "new-zealand", "es": "spain", "it": "italy"}.get(code)
    params: dict[str, Any] = {"count": min(max(req.limit * 3, 30), 100)}
    if geo: params["geo"] = geo
    r = await client.get("https://jobicy.com/api/v2/remote-jobs", params=params, headers={"User-Agent": "SLAM/4.0"})
    r.raise_for_status()
    out = []
    for item in r.json().get("jobs", []):
        desc, loc = clean_html(str(item.get("jobDescription") or "")), str(item.get("jobGeo") or "Remote")
        job = normalize_job(source="Jobicy", source_url=str(item.get("url") or ""), job_id=str(item.get("id") or ""), title=str(item.get("jobTitle") or ""), company=str(item.get("companyName") or ""), location=loc, description=desc, remote=True, application_url=str(item.get("url") or ""), posting_date=str(item.get("pubDate") or "")[:10], employment_type=", ".join(item.get("jobType") or []) if isinstance(item.get("jobType"), list) else str(item.get("jobType") or ""), level=str(item.get("jobLevel") or ""), salary_min=item.get("salaryMin"), salary_max=item.get("salaryMax"), salary_currency=str(item.get("salaryCurrency") or ""), profile=req.profile, country=code, requested_location=req.location)
        if job: out.append(job)
    return out


async def search_jobs(req: JobSearchRequest):
    requested_location = (req.location or req.profile.get("location", "")).strip()
    code = country_code(req.country or req.profile.get("country", ""), requested_location)
    if not code:
        raise HTTPException(400, "SLAM needs a valid country in the profile before searching. A city can also be used as the location when the country is known.")
    query = build_query(req)
    errors: dict[str, str] = {}
    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers={"User-Agent": "SLAM/4.0"}) as client:
        async def run(name: str, fn):
            try: return name, await fn(client, req, code, query)
            except Exception as exc:
                errors[name] = f"{type(exc).__name__}: source unavailable"
                return name, []
        sources = await asyncio.gather(run("Adzuna", fetch_adzuna), run("Arbeitnow", fetch_arbeitnow), run("Jobicy", fetch_jobicy))
    combined: dict[str, dict] = {}
    for source_name, source_jobs in sources:
        for job in source_jobs:
            if code != "de" and likely_german(f"{job.get('title', '')} {job.get('description', '')}"):
                continue
            key = dedupe_key(job)
            if key not in combined:
                combined[key] = job
            else:
                combined[key]["sourcesList"] = combined[key].get("sourcesList", []) + job.get("sourcesList", [])
                if len(job.get("description", "")) > len(combined[key].get("description", "")):
                    combined[key]["description"] = job["description"]
    jobs = [j for j in combined.values() if not req.remote or j.get("remote")]
    for job in jobs:
        if req.profile:
            job["match"] = score_job(req.profile, job, int(job.get("locationScore") or 0), str(job.get("locationMatch") or "Location verified"))
    jobs.sort(key=lambda j: ((j.get("match") or {}).get("compatibilityScore", 0), j.get("postingDate", "")), reverse=True)
    source_status = {name: {"available": bool(items), "count": len(items)} for name, items in sources}
    return {"jobs": jobs[:req.limit], "count": min(len(jobs), req.limit), "query": query, "country": code, "location": requested_location, "sources": source_status, "sourceErrors": errors, "source": "Multi-source live job discovery", "warning": "No verified live listings matched this profile, country and location. Try widening the role or location filters." if not jobs else ""}
