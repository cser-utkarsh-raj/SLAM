from __future__ import annotations

import html
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field

# SLAM job discovery is deliberately source-first and conservative:
# - never fabricate a listing
# - never treat a remote listing as automatically valid for every country
# - preserve the original application URL/source
# - filter by the candidate's requested country/location before ranking
# - deduplicate the same opportunity across feeds

COUNTRY_CODES = {
    "india": "in", "ind": "in", "in": "in",
    "united states": "us", "usa": "us", "us": "us", "u.s.": "us",
    "united kingdom": "gb", "uk": "gb", "gb": "gb",
    "canada": "ca", "ca": "ca", "australia": "au", "au": "au",
    "germany": "de", "de": "de", "france": "fr", "fr": "fr",
    "netherlands": "nl", "holland": "nl", "nl": "nl", "ireland": "ie", "ie": "ie",
    "singapore": "sg", "sg": "sg", "new zealand": "nz", "nz": "nz",
    "spain": "es", "es": "es", "italy": "it", "it": "it",
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
    "ie": ["ireland", "dublin", "cork", "galway"],
    "sg": ["singapore"], "nz": ["new zealand", "auckland", "wellington", "christchurch"],
    "es": ["spain", "madrid", "barcelona", "valencia"], "it": ["italy", "rome", "milan", "turin"],
}

CITY_TO_COUNTRY = {
    city: code
    for code, aliases in COUNTRY_ALIASES.items()
    for city in aliases
    if city not in {"india", "indian", "united states", "usa", "u.s.", "united kingdom", "uk", "u.k.", "canada", "australia", "germany", "france", "netherlands", "holland", "ireland", "singapore", "new zealand", "spain", "italy"}
}

REMOTE_GLOBAL_MARKERS = [
    "worldwide", "world wide", "global", "anywhere", "work from anywhere", "remote - worldwide",
    "remote worldwide", "all countries", "international remote", "open globally",
]

GERMAN_MARKERS = re.compile(
    r"\b(und|der|die|das|mit|für|von|auf|eine|einen|bei|als|werden|wird|sind|deutsch|kenntnisse|berufserfahrung|bewerbung|unternehmen|aufgaben|anforderungen)\b",
    re.I,
)

SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "FastAPI", "Django", "SQL",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Kubernetes", "Git", "GraphQL", "Java", "C++", "Go",
    "Rust", "Figma", "Tailwind CSS", "Vue", "Angular", "Flutter", "Firebase", "GCP", "Azure", "REST APIs",
    "HTML", "CSS", "Redis", "Linux", "CI/CD", "Microservices", "System Design", "TensorFlow", "PyTorch",
    "LLM", "OpenAI", "NLP", "Machine Learning", "Data Science", "Power BI", "Excel", "SaaS",
]


class JobSearchRequest(BaseModel):
    query: str = Field(default="", max_length=120)
    location: str = ""
    country: str = ""
    remote: bool = False
    limit: int = Field(default=30, ge=1, le=50)
    profile: dict[str, Any] = Field(default_factory=dict)


def clean_html(value: str) -> str:
    value = html.unescape(value or "")
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", value)).strip()


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def country_code(country: str) -> str:
    key = normalize(country)
    if key in COUNTRY_CODES:
        return COUNTRY_CODES[key]
    for name, code in COUNTRY_CODES.items():
        if name in key:
            return code
    return ""


def aliases_for(code: str) -> list[str]:
    return COUNTRY_ALIASES.get(code, [])


def token_match(needle: str, haystack: str) -> bool:
    return bool(needle and re.search(rf"(?<![a-z]){re.escape(normalize(needle))}(?![a-z])", normalize(haystack)))


def explicit_country_in_text(code: str, text: str) -> bool:
    hay = normalize(text)
    return any(token_match(alias, hay) for alias in aliases_for(code))


def likely_german(text: str) -> bool:
    return len(GERMAN_MARKERS.findall((text or "")[:10000])) >= 5


def infer_skills(text: str) -> list[str]:
    return [skill for skill in SKILLS if re.search(rf"(?<![\w+#]){re.escape(skill)}(?![\w+#])", text or "", re.I)]


def infer_years(text: str) -> int:
    years = 0
    for pattern in [
        r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?",
        r"(\d+)\+?\s+years?\s+(?:of\s+)?experience",
    ]:
        for match in re.finditer(pattern, text or "", re.I):
            years = max(years, int(match.group(1)))
    return years


def requested_roles(profile: dict) -> list[str]:
    roles = profile.get("targetRoles") or []
    if not roles and profile.get("currentRole"):
        roles = [profile["currentRole"]]
    return [normalize(x) for x in roles if str(x).strip()]


def build_query(req: JobSearchRequest) -> str:
    if req.query.strip():
        return req.query.strip()
    profile = req.profile or {}
    roles = [str(x).strip() for x in (profile.get("targetRoles") or []) if str(x).strip()]
    if not roles and profile.get("currentRole"):
        roles = [str(profile["currentRole"]).strip()]
    skills = [str(x).strip() for x in (profile.get("skills") or []) + (profile.get("technologies") or []) if str(x).strip()]
    parts = roles[:2] + skills[:3]
    return " ".join(parts)[:120] or "software engineer"


def location_fit(code: str, requested_location: str, job_location: str, description: str, remote: bool) -> tuple[bool, str, int]:
    """Hard eligibility boundary before any ranking.

    Local/on-site jobs must match the requested city/location when supplied.
    Remote jobs must explicitly cover the candidate country or be clearly global.
    A job being labelled 'remote' is NOT enough by itself.
    """
    req_loc = normalize(requested_location)
    loc = normalize(job_location)
    desc = normalize(description)
    combined = f"{loc} {desc}"

    if not code:
        return True, "No country filter supplied", 50

    if remote:
        if any(marker in combined for marker in REMOTE_GLOBAL_MARKERS):
            return True, "Remote listing explicitly allows global/anywhere hiring", 100
        if explicit_country_in_text(code, combined):
            return True, "Remote listing explicitly references the candidate country", 100
        # Some providers encode the eligibility in job_location alone (e.g. 'India', 'APAC').
        if token_match(code, loc) or any(token_match(alias, loc) for alias in aliases_for(code)):
            return True, "Remote listing is tagged for the candidate country", 100
        # Regional eligibility that safely contains the country.
        regional = {
            "in": ["apac", "asia pacific", "asia-pacific", "south asia"],
            "us": ["north america", "americas"],
            "ca": ["north america", "americas"],
            "gb": ["europe", "emea"],
            "ie": ["europe", "emea"],
            "fr": ["europe", "emea"],
            "de": ["europe", "emea"],
            "nl": ["europe", "emea"],
            "es": ["europe", "emea"],
            "it": ["europe", "emea"],
            "au": ["apac", "asia pacific", "oceania"],
            "nz": ["apac", "asia pacific", "oceania"],
            "sg": ["apac", "asia pacific"],
        }
        if any(region in combined for region in regional.get(code, [])):
            return True, "Remote listing explicitly covers the candidate region", 90
        return False, "Remote listing does not state eligibility for the candidate country/region", 0

    # For physical jobs, the country must be represented by the location or a known city.
    if not explicit_country_in_text(code, loc) and not any(token_match(alias, loc) for alias in aliases_for(code)):
        return False, "On-site listing is outside the candidate country", 0

    if req_loc:
        # Exact requested city/location gets the strongest score.
        if token_match(req_loc, loc):
            return True, "Job location matches the requested location", 100
        # If the requested location is a city, don't accept an unrelated city just because country matches.
        requested_country = CITY_TO_COUNTRY.get(req_loc)
        if requested_country == code:
            return False, "Job is in the correct country but not the requested location", 25

    return True, "Job is in the candidate country", 70


def score_job(profile: dict, job: dict, location_score: int, location_reason: str):
    profile_skills = {normalize(x) for x in (profile.get("skills") or []) + (profile.get("technologies") or [])}
    required = [str(x) for x in job.get("requiredSkills", [])]
    matched = [x for x in required if normalize(x) in profile_skills]
    missing = [x for x in required if normalize(x) not in profile_skills]
    skill_score = round(100 * len(matched) / len(required)) if required else 55

    experience = float(profile.get("yearsOfExperience") or 0)
    minimum = float(job.get("minYearsExperience") or 0)
    experience_score = 100 if minimum <= 0 else max(0, min(100, round(100 - max(0, minimum - experience) * 25)))

    roles = requested_roles(profile)
    title = normalize(job.get("title", ""))
    role_score = 100 if roles and any(r in title or title in r for r in roles) else (65 if roles else 60)

    score = round(skill_score * 0.50 + experience_score * 0.20 + role_score * 0.20 + location_score * 0.10)
    concerns = [f"Potential skill gap: {', '.join(missing[:5])}"] if missing else []
    if location_score < 100:
        concerns.append(location_reason)

    return {
        "compatibilityScore": score,
        "opportunityScore": score,
        "matchedSkills": matched,
        "partialSkills": [],
        "missingSkills": missing,
        "strengths": [f"Matches {len(matched)} of {len(required)} detected required skills"] if required else [],
        "concerns": concerns,
        "isEligible": location_score >= 70,
        "eligibilityReason": location_reason,
        "breakdown": {
            "skillsScore": skill_score,
            "experienceScore": experience_score,
            "roleScore": role_score,
            "locationScore": location_score,
            "qualificationScore": 70,
        },
        "confidence": "Estimated",
    }


def normalize_job(*, source: str, source_url: str, job_id: str, title: str, company: str, location: str,
                  description: str, remote: bool, application_url: str, posting_date: str,
                  employment_type: str = "", level: str = "", salary_min: Any = None,
                  salary_max: Any = None, salary_currency: str = "", profile: dict, country: str,
                  requested_location: str) -> dict | None:
    title = clean_html(title)
    company = clean_html(company)
    location = clean_html(location)
    description = clean_html(description)
    application_url = str(application_url or source_url).strip()
    if not title or not company or not application_url:
        return None

    fits, location_reason, location_score = location_fit(country, requested_location, location, description, remote)
    if not fits:
        return None

    required = infer_skills(description)
    years = infer_years(description)
    job = {
        "id": f"{source.lower()}:{job_id}",
        "title": title,
        "normalizedTitle": title,
        "roleFamily": "",
        "company": company,
        "location": location or "Location not specified",
        "remote": bool(remote),
        "remoteType": "Remote" if remote else "On-site",
        "employmentType": employment_type,
        "experienceLevel": level,
        "minYearsExperience": years,
        "description": description[:6000],
        "responsibilities": [],
        "requirements": required,
        "requiredSkills": required,
        "preferredSkills": [],
        "postingDate": posting_date,
        "freshnessLabel": f"Live {source} feed",
        "lastSeenAt": datetime.now(timezone.utc).isoformat(),
        "applicationUrl": application_url,
        "primarySource": source,
        "sourcesList": [{
            "sourceName": source,
            "sourceUrl": source_url or application_url,
            "sourceType": "Job feed",
            "postedDate": posting_date,
            "isOfficial": False,
        }],
        "applicationMethod": "External Form",
        "hardRequirements": [],
        "requiresWorkAuth": False,
        "salaryMin": salary_min,
        "salaryMax": salary_max,
        "salaryCurrency": salary_currency,
        "locationMatch": location_reason,
        "locationScore": location_score,
    }
    job["match"] = score_job(profile, job, location_score, location_reason) if profile else None
    return job


def dedupe_key(job: dict) -> str:
    url = normalize(job.get("applicationUrl", ""))
    url = re.sub(r"[?#].*$", "", url).rstrip("/")
    if url:
        return url
    return "|".join([normalize(job.get("company", "")), normalize(job.get("title", "")), normalize(job.get("location", ""))])


def adzuna_configured() -> bool:
    return bool(os.getenv("ADZUNA_APP_ID", "").strip() and os.getenv("ADZUNA_APP_KEY", "").strip())


async def fetch_adzuna(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict]:
    if not adzuna_configured():
        return []
    params = {
        "app_id": os.getenv("ADZUNA_APP_ID", "").strip(),
        "app_key": os.getenv("ADZUNA_APP_KEY", "").strip(),
        "results_per_page": min(max(req.limit * 3, 30), 100),
        "what": query,
        "content-type": "application/json",
        "sort_by": "date",
    }
    if req.location.strip():
        params["where"] = req.location.strip()
    if req.remote:
        params["what_and"] = "remote"
    response = await client.get(f"https://api.adzuna.com/v1/api/jobs/{code}/search/1", params=params)
    response.raise_for_status()
    jobs = []
    for item in response.json().get("results", []):
        loc = str((item.get("location") or {}).get("display_name") or "")
        desc = clean_html(str(item.get("description") or ""))
        title = clean_html(str(item.get("title") or ""))
        remote = "remote" in normalize(f"{title} {loc} {desc}")
        created = str(item.get("created") or "")
        try:
            date = datetime.fromisoformat(created.replace("Z", "+00:00")).date().isoformat()
        except ValueError:
            date = ""
        job = normalize_job(
            source="Adzuna", source_url=str(item.get("redirect_url") or ""), job_id=str(item.get("id") or ""),
            title=title, company=str((item.get("company") or {}).get("display_name") or ""), location=loc,
            description=desc, remote=remote, application_url=str(item.get("redirect_url") or ""),
            posting_date=date, employment_type="Full-time" if item.get("contract_time") == "full_time" else "",
            salary_min=item.get("salary_min"), salary_max=item.get("salary_max"), salary_currency="",
            profile=req.profile, country=code, requested_location=req.location,
        )
        if job:
            jobs.append(job)
    return jobs


async def fetch_arbeitnow(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict]:
    # Arbeitnow is strongest for Europe/UK and should be treated as one source among several,
    # never as SLAM's sole global inventory.
    base = "https://www.arbeitnow.com/api/job-board-api"
    response = await client.get(base, params={"search": query}, headers={"User-Agent": "SLAM/4.0"})
    response.raise_for_status()
    jobs = []
    for item in response.json().get("data", []):
        loc = str(item.get("location") or "")
        desc = clean_html(str(item.get("description") or ""))
        remote = bool(item.get("remote"))
        created = item.get("created_at")
        date = datetime.fromtimestamp(created, tz=timezone.utc).date().isoformat() if isinstance(created, (int, float)) else ""
        job = normalize_job(
            source="Arbeitnow", source_url=str(item.get("url") or ""), job_id=str(item.get("slug") or item.get("id") or ""),
            title=str(item.get("title") or ""), company=str(item.get("company_name") or ""), location=loc,
            description=desc, remote=remote, application_url=str(item.get("url") or ""), posting_date=date,
            employment_type="Full-time", level="", profile=req.profile, country=code, requested_location=req.location,
        )
        if job:
            jobs.append(job)
    return jobs


async def fetch_jobicy(client: httpx.AsyncClient, req: JobSearchRequest, code: str, query: str) -> list[dict]:
    # Jobicy is remote-only. Its geo taxonomy is candidate-availability based, so the
    # second hard location boundary in normalize_job still decides whether a listing is eligible.
    geo = {
        "in": "india", "us": "usa", "gb": "uk", "ca": "canada", "au": "australia",
        "de": "germany", "fr": "france", "nl": "netherlands", "ie": "ireland",
        "sg": "singapore", "nz": "new-zealand", "es": "spain", "it": "italy",
    }.get(code)
    params: dict[str, Any] = {"count": min(max(req.limit * 3, 30), 100)}
    if geo:
        params["geo"] = geo
    if query and query != "software engineer":
        params["tag"] = query[:50]
    response = await client.get("https://jobicy.com/api/v2/remote-jobs", params=params, headers={"User-Agent": "SLAM/4.0"})
    response.raise_for_status()
    jobs = []
    for item in response.json().get("jobs", []):
        desc = clean_html(str(item.get("jobDescription") or ""))
        loc = str(item.get("jobGeo") or "Remote")
        job = normalize_job(
            source="Jobicy", source_url=str(item.get("url") or ""), job_id=str(item.get("id") or ""),
            title=str(item.get("jobTitle") or ""), company=str(item.get("companyName") or ""), location=loc,
            description=desc, remote=True, application_url=str(item.get("url") or ""),
            posting_date=str(item.get("pubDate") or "")[:10], employment_type=", ".join(item.get("jobType") or []) if isinstance(item.get("jobType"), list) else str(item.get("jobType") or ""),
            level=str(item.get("jobLevel") or ""), salary_min=item.get("salaryMin"), salary_max=item.get("salaryMax"),
            salary_currency=str(item.get("salaryCurrency") or ""), profile=req.profile, country=code, requested_location=req.location,
        )
        if job:
            jobs.append(job)
    return jobs


async def search_jobs(req: JobSearchRequest):
    code = country_code(req.country or req.profile.get("country", ""))
    requested_location = (req.location or req.profile.get("location", "")).strip()
    if not code:
        raise HTTPException(400, "SLAM needs the user's country before searching jobs. Set a country in the profile instead of falling back to a global feed.")

    # Never silently search a generic global query. The profile determines the query when the UI does not.
    query = build_query(req)
    sources: list[tuple[str, Any]] = []
    errors: dict[str, str] = {}

    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers={"User-Agent": "SLAM/4.0"}) as client:
        # Run all providers independently: one provider being unavailable must not blank the whole search.
        async def run(name: str, fn):
            try:
                return name, await fn(client, req, code, query)
            except Exception as exc:
                errors[name] = f"{type(exc).__name__}: source unavailable"
                return name, []

        results = await __import__("asyncio").gather(
            run("Adzuna", fetch_adzuna),
            run("Arbeitnow", fetch_arbeitnow),
            run("Jobicy", fetch_jobicy),
        )
        sources.extend(results)

    # Absolute language-market safety net for non-German searches.
    combined: dict[str, dict] = {}
    for source_name, source_jobs in sources:
        for job in source_jobs:
            if code != "de" and likely_german(f"{job.get('title','')} {job.get('description','')}"):
                continue
            key = dedupe_key(job)
            existing = combined.get(key)
            if not existing:
                combined[key] = job
            else:
                # Prefer the listing with richer description / salary / source metadata.
                if len(job.get("description", "")) > len(existing.get("description", "")):
                    job["sourcesList"] = existing.get("sourcesList", []) + job.get("sourcesList", [])
                    combined[key] = job
                else:
                    existing["sourcesList"] = existing.get("sourcesList", []) + job.get("sourcesList", [])

    jobs = list(combined.values())
    if req.remote:
        jobs = [j for j in jobs if j.get("remote")]

    # Re-score after deduplication and sort by candidate fit first, freshness second.
    for job in jobs:
        if req.profile:
            location_score = int(job.get("locationScore") or 0)
            location_reason = str(job.get("locationMatch") or "Location verified")
            job["match"] = score_job(req.profile, job, location_score, location_reason)

    jobs.sort(key=lambda j: (
        (j.get("match") or {}).get("compatibilityScore", 0),
        j.get("postingDate", ""),
    ), reverse=True)

    source_status = {name: {"available": bool(items), "count": len(items)} for name, items in sources}
    return {
        "jobs": jobs[:req.limit],
        "count": min(len(jobs), req.limit),
        "query": query,
        "country": code,
        "location": requested_location,
        "sources": source_status,
        "sourceErrors": errors,
        "source": "Multi-source live job discovery",
        "warning": "No verified listings matched this profile, country and location. Try widening the role or location filters." if not jobs else "",
    }
