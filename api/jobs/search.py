from __future__ import annotations

import asyncio
import html
import os
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="SLAM Live Job Discovery", version="4.2.0")

COUNTRY_CODES = {
    "india":"in","ind":"in","in":"in","united states":"us","usa":"us","us":"us",
    "united kingdom":"gb","uk":"gb","gb":"gb","canada":"ca","ca":"ca","australia":"au","au":"au",
    "germany":"de","de":"de","france":"fr","fr":"fr","netherlands":"nl","holland":"nl","nl":"nl",
    "ireland":"ie","ie":"ie","singapore":"sg","sg":"sg","new zealand":"nz","nz":"nz","spain":"es","es":"es","italy":"it","it":"it",
}
ALIASES = {
    "in":["india","indian","bengaluru","bangalore","mumbai","delhi","new delhi","hyderabad","pune","chennai","noida","gurgaon","gurugram","kolkata","ahmedabad","jaipur","kochi","lucknow"],
    "us":["united states","usa","u.s.","new york","california","texas","florida","washington","massachusetts","illinois","seattle","austin","boston","chicago","san francisco","los angeles"],
    "gb":["united kingdom","uk","u.k.","england","scotland","wales","london","manchester","birmingham","edinburgh","glasgow"],
    "ca":["canada","toronto","vancouver","montreal","calgary","ottawa","ontario","quebec"],
    "au":["australia","sydney","melbourne","brisbane","perth","adelaide"],
    "de":["germany","berlin","munich","frankfurt","hamburg","cologne","stuttgart"],
    "fr":["france","paris","lyon","marseille","toulouse"],
    "nl":["netherlands","holland","amsterdam","rotterdam","utrecht"],
    "ie":["ireland","dublin","cork","galway"],"sg":["singapore"],
    "nz":["new zealand","auckland","wellington","christchurch"],"es":["spain","madrid","barcelona","valencia"],"it":["italy","rome","milan","turin"],
}
CITY_COUNTRY={a:c for c,items in ALIASES.items() for a in items}
JOBICY_GEO={"in":"apac","us":"usa","gb":"uk","ca":"canada","au":"australia","de":"germany","fr":"france","nl":"netherlands","ie":"ireland","sg":"singapore","nz":"new-zealand","es":"spain","it":"italy"}
REMOTE_GLOBAL=["worldwide","world wide","global","anywhere","work from anywhere","all countries","international remote","open globally"]
REMOTE_REGION={"in":["apac","asia pacific","asia-pacific","south asia"],"us":["north america","americas"],"ca":["north america","americas"],"gb":["europe","emea"],"ie":["europe","emea"],"fr":["europe","emea"],"de":["europe","emea"],"nl":["europe","emea"],"es":["europe","emea"],"it":["europe","emea"],"au":["apac","asia pacific","oceania"],"nz":["apac","asia pacific","oceania"],"sg":["apac","asia pacific"]}
GERMAN_STRONG=re.compile(r"\b(kenntnisse|berufserfahrung|bewerbung|lebenslauf|anforderungen|stellenanzeige|arbeitszeit|anstellung|gehalt|deutschkenntnisse|unternehmen)\b",re.I)
GERMAN_MARKERS=re.compile(r"\b(und|der|die|das|den|dem|des|mit|für|von|auf|eine|einen|einem|einer|bei|als|werden|wird|sind|sein|deutsch|deutsche|kenntnisse|berufserfahrung|bewerbung|unternehmen|aufgaben|anforderungen|lebenslauf|gehalt|arbeitszeit|kunden|erfahrung|abteilung|gesucht|stellenanzeige|anstellung)\b",re.I)
SKILLS=["Python","JavaScript","TypeScript","React","Next.js","Node.js","FastAPI","Django","SQL","PostgreSQL","MongoDB","AWS","Docker","Kubernetes","Git","GraphQL","Java","C++","Go","Rust","Figma","Tailwind CSS","Vue","Angular","Flutter","Firebase","GCP","Azure","REST APIs","HTML","CSS","Redis","Linux","CI/CD","Microservices","System Design","TensorFlow","PyTorch","LLM","OpenAI","NLP","Machine Learning","Data Science","Power BI","Excel","SaaS"]

class JobSearchRequest(BaseModel):
    query:str=Field(default="",max_length=120); location:str=Field(default="",max_length=160); country:str=Field(default="",max_length=80); remote:bool=False; limit:int=Field(default=30,ge=1,le=50); profile:dict[str,Any]=Field(default_factory=dict)

def clean(v:str)->str:return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",html.unescape(v or ""))).strip()
def norm(v:str)->str:return re.sub(r"\s+"," ",(v or "").strip().lower())
def token(needle:str,text:str)->bool:return bool(needle and re.search(rf"(?<![a-z]){re.escape(norm(needle))}(?![a-z])",norm(text)))
def country_code(country:str,location:str)->str:
    v=norm(country)
    if v in COUNTRY_CODES:return COUNTRY_CODES[v]
    for k,c in COUNTRY_CODES.items():
        if token(k,v):return c
    for city,c in CITY_COUNTRY.items():
        if token(city,location):return c
    return ""
def explicit_country(code:str,text:str)->bool:return any(token(a,text) for a in ALIASES.get(code,[]))
def likely_german(text:str)->bool:
    s=(text or "")[:12000]; strong=len(GERMAN_STRONG.findall(s)); markers=len(GERMAN_MARKERS.findall(s)); umlauts=len(re.findall(r"[äöüÄÖÜß]",s)); return strong>=1 or markers>=5 or (markers>=3 and umlauts>=1)
def requested_city(location:str)->str:
    first=norm(location).split(",")[0].strip(); return "" if first in COUNTRY_CODES else first

def location_fit(code:str,requested:str,job_location:str,description:str,remote:bool):
    loc=norm(job_location); desc=norm(description); combined=f"{loc} {desc}"
    if remote:
        if any(x in combined for x in REMOTE_GLOBAL):return True,"Remote listing explicitly allows global hiring",100
        if explicit_country(code,combined):return True,"Remote listing explicitly covers the candidate country",100
        if any(x in combined for x in REMOTE_REGION.get(code,[])):return True,"Remote listing explicitly covers the candidate region",90
        return False,"Remote listing does not state eligibility for the candidate country or region",0
    if not explicit_country(code,loc):return False,"On-site listing is outside the candidate country",0
    city=requested_city(requested)
    if city and token(city,loc):return True,"Job location matches the requested city",100
    if city and CITY_COUNTRY.get(city)==code:return False,"Job is in the right country but not the requested city",0
    return True,"Job is in the candidate country",70

def infer_skills(text:str)->list[str]:return [s for s in SKILLS if re.search(rf"(?<![\w+#]){re.escape(s)}(?![\w+#])",text or "",re.I)]
def infer_years(text:str)->int:
    out=0
    for p in [r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?",r"(\d+)\+?\s+years?\s+(?:of\s+)?experience"]:
        out=max([out]+[int(m.group(1)) for m in re.finditer(p,text or "",re.I)])
    return out
def roles(profile:dict)->list[str]:return [norm(x) for x in (profile.get("targetRoles") or ([profile.get("currentRole")] if profile.get("currentRole") else [])) if str(x).strip()]
def build_query(req:JobSearchRequest)->str:
    if req.query.strip():return req.query.strip()
    p=req.profile; rs=[str(x).strip() for x in p.get("targetRoles",[]) if str(x).strip()] or ([str(p["currentRole"]).strip()] if p.get("currentRole") else []); ss=[str(x).strip() for x in p.get("skills",[])+p.get("technologies",[]) if str(x).strip()]; return " ".join(rs[:2]+ss[:3])[:120] or "software engineer"

def score(profile:dict,job:dict,loc_score:int,reason:str)->dict:
    skills={norm(x) for x in profile.get("skills",[])+profile.get("technologies",[])}; required=job.get("requiredSkills",[]); matched=[x for x in required if norm(x) in skills]; missing=[x for x in required if norm(x) not in skills]; skill=round(100*len(matched)/len(required)) if required else 55; exp=float(profile.get("yearsOfExperience") or 0); minimum=float(job.get("minYearsExperience") or 0); exps=100 if minimum<=0 else max(0,min(100,round(100-max(0,minimum-exp)*25))); rs=roles(profile); title=norm(job.get("title","")); role=100 if rs and any(r in title or title in r for r in rs) else (65 if rs else 60); total=round(skill*.5+exps*.2+role*.2+loc_score*.1); return {"compatibilityScore":total,"opportunityScore":total,"matchedSkills":matched,"partialSkills":[],"missingSkills":missing,"strengths":[f"Matches {len(matched)} of {len(required)} detected required skills"] if required else [],"concerns":[f"Potential skill gap: {', '.join(missing[:5])}"]+([reason] if loc_score<100 else []),"isEligible":loc_score>=70,"eligibilityReason":reason,"breakdown":{"skillsScore":skill,"experienceScore":exps,"roleScore":role,"locationScore":loc_score,"qualificationScore":70},"confidence":"Estimated"}

def normalize_job(source:str,item:dict,profile:dict,code:str,requested:str)->dict|None:
    title=clean(item.get("title") or item.get("jobTitle") or ""); company=clean(item.get("company") or item.get("companyName") or item.get("company_name") or ""); location=clean(item.get("location") or item.get("jobGeo") or "Remote"); desc=clean(item.get("description") or item.get("jobDescription") or ""); url=str(item.get("redirect_url") or item.get("url") or "").strip(); remote=bool(item.get("remote")) or source=="Jobicy" or "remote" in norm(f"{title} {location}")
    if not title or not company or not url:return None
    ok,reason,loc_score=location_fit(code,requested,location,desc,remote)
    if not ok:return None
    required=infer_skills(desc); years=infer_years(desc)
    if source!="Germany" and code!="de" and likely_german(f"{title} {desc}"):return None
    if source=="Adzuna": date=str(item.get("created") or "")[:10]
    else: date=str(item.get("pubDate") or item.get("created_at") or "")[:10]
    job={"id":f"{source.lower()}:{item.get('id') or item.get('slug') or url}","title":title,"normalizedTitle":title,"roleFamily":"","company":company,"location":location,"remote":remote,"remoteType":"Remote" if remote else "On-site","employmentType":"Full-time","experienceLevel":str(item.get("jobLevel") or ""),"minYearsExperience":years,"description":desc[:6000],"responsibilities":[],"requirements":required,"requiredSkills":required,"preferredSkills":[],"postingDate":date,"freshnessLabel":f"Live {source} feed","lastSeenAt":datetime.now(timezone.utc).isoformat(),"applicationUrl":url,"primarySource":source,"sourcesList":[{"sourceName":source,"sourceUrl":url,"sourceType":"Live job feed","postedDate":date,"isOfficial":False}],"applicationMethod":"External Form","hardRequirements":[],"requiresWorkAuth":False,"salaryMin":item.get("salary_min") or item.get("salaryMin"),"salaryMax":item.get("salary_max") or item.get("salaryMax"),"salaryCurrency":item.get("salaryCurrency") or "","locationMatch":reason,"locationScore":loc_score}
    job["match"]=score(profile,job,loc_score,reason) if profile else None; return job

async def fetch_adzuna(client,req,code,query):
    if not (os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY")):return []
    p={"app_id":os.environ["ADZUNA_APP_ID"].strip(),"app_key":os.environ["ADZUNA_APP_KEY"].strip(),"results_per_page":min(max(req.limit*3,30),100),"what":query,"sort_by":"date"};
    if req.location.strip():p["where"]=req.location.strip()
    if req.remote:p["what_and"]="remote"
    r=await client.get(f"https://api.adzuna.com/v1/api/jobs/{code}/search/1",params=p);r.raise_for_status();return [j for x in r.json().get("results",[]) if (j:=normalize_job("Adzuna",x,req.profile,code,req.location))]

async def fetch_arbeitnow(client,req,code,query):
    r=await client.get("https://www.arbeitnow.com/api/job-board-api",params={"search":query},headers={"User-Agent":"SLAM/4.2"});r.raise_for_status();return [j for x in r.json().get("data",[]) if (j:=normalize_job("Arbeitnow",x,req.profile,code,req.location))]

async def fetch_jobicy(client,req,code,query):
    # Jobicy's current taxonomy has no India country slug; India is covered by APAC.
    geo=JOBICY_GEO.get(code); p={"count":min(max(req.limit*3,30),200)}
    if geo:p["geo"]=geo
    p["tag"]=query.split("+")[0].strip() if query else ""
    r=await client.get("https://jobicy.com/api/v2/remote-jobs",params={k:v for k,v in p.items() if v},headers={"User-Agent":"SLAM/4.2"});r.raise_for_status();return [j for x in r.json().get("jobs",[]) if (j:=normalize_job("Jobicy",x,req.profile,code,req.location))]

async def search_jobs(req:JobSearchRequest):
    requested=(req.location or req.profile.get("location","")).strip(); code=country_code(req.country or req.profile.get("country","") ,requested)
    if not code:raise HTTPException(400,"SLAM needs a valid country in the profile before searching.")
    query=build_query(req); errors={}
    async with httpx.AsyncClient(timeout=15,follow_redirects=True,headers={"User-Agent":"SLAM/4.2"}) as client:
        async def run(name,fn):
            try:return name,await fn(client,req,code,query)
            except Exception as exc:errors[name]=f"{type(exc).__name__}: source unavailable";return name,[]
        sources=await asyncio.gather(run("Adzuna",fetch_adzuna),run("Arbeitnow",fetch_arbeitnow),run("Jobicy",fetch_jobicy))
    combined={}; filtered=0
    for name,items in sources:
        for job in items:
            key=re.sub(r"[?#].*$","",norm(job.get("applicationUrl","")).rstrip("/")) or "|".join(norm(job.get(k,"")) for k in ("company","title","location"))
            if key not in combined:combined[key]=job
            else:combined[key]["sourcesList"]=combined[key].get("sourcesList",[])+job.get("sourcesList",[])
    jobs=[j for j in combined.values() if not req.remote or j.get("remote")]
    for j in jobs:j["match"]=score(req.profile,j,int(j.get("locationScore") or 0),str(j.get("locationMatch") or "Location verified")) if req.profile else None
    jobs.sort(key=lambda j:((j.get("match") or {}).get("compatibilityScore",0),j.get("postingDate",)),reverse=True)
    status={name:{"available":bool(items),"count":len(items),"configured":name!="Adzuna" or bool(os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY")),"error":errors.get(name,"")} for name,items in sources}
    return {"jobs":jobs[:req.limit],"count":min(len(jobs),req.limit),"query":query,"country":code,"location":requested,"sources":status,"sourceErrors":errors,"source":"Multi-source live job discovery","warning":"No verified live listings matched this profile, country and location. Try widening the role or location filters." if not jobs else ""}

@app.post("")
@app.post("/")
@app.post("/{path:path}")
async def handler(req:JobSearchRequest):return await search_jobs(req)
