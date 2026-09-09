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

app = FastAPI(title="SLAM Live Job Discovery", version="6.0.0")
COUNTRY_CODES={"india":"in","ind":"in","in":"in","south africa":"za","za":"za","united states":"us","usa":"us","us":"us","united kingdom":"gb","uk":"gb","gb":"gb","canada":"ca","ca":"ca","australia":"au","au":"au","germany":"de","de":"de","france":"fr","fr":"fr","netherlands":"nl","holland":"nl","nl":"nl","ireland":"ie","ie":"ie","singapore":"sg","sg":"sg","new zealand":"nz","nz":"nz","spain":"es","es":"es","italy":"it","it":"it","brazil":"br","br":"br","uae":"ae","united arab emirates":"ae","ae":"ae"}
ALIASES={"in":["india","indian","hyderabad","patna","jaipur","mumbai","delhi","new delhi","bengaluru","bangalore","pune","chennai","noida","gurgaon","gurugram","kolkata","ahmedabad","kochi","lucknow"],"za":["south africa","cape town","johannesburg","pretoria","durban","port elizabeth"],"us":["united states","usa","u.s.","new york","california","texas","florida","washington","massachusetts","illinois","seattle","austin","boston","chicago","san francisco","los angeles"],"gb":["united kingdom","uk","u.k.","england","scotland","wales","london","manchester","birmingham","edinburgh","glasgow"],"ca":["canada","toronto","vancouver","montreal","calgary","ottawa","ontario","quebec"],"au":["australia","sydney","melbourne","brisbane","perth","adelaide"],"de":["germany","berlin","munich","frankfurt","hamburg","cologne","stuttgart"],"fr":["france","paris","lyon","marseille","toulouse"],"nl":["netherlands","holland","amsterdam","rotterdam","utrecht"],"ie":["ireland","dublin","cork","galway"],"sg":["singapore"],"nz":["new zealand","auckland","wellington","christchurch"],"es":["spain","madrid","barcelona","valencia"],"it":["italy","rome","milan","turin"],"br":["brazil","sao paulo","rio de janeiro","brasilia"],"ae":["uae","united arab emirates","dubai","abu dhabi"]}
CITY_COUNTRY={a:c for c,items in ALIASES.items() for a in items}
JOBICY_GEO={"us":"usa","gb":"uk","ca":"canada","au":"australia","de":"germany","fr":"france","nl":"netherlands","ie":"ireland","sg":"singapore","nz":"new-zealand","es":"spain","it":"italy","in":"apac","za":"africa"}
REMOTE_GLOBAL=["worldwide","world wide","global","anywhere","work from anywhere","all countries","international remote","open globally"]
REMOTE_REGION={"in":["apac","asia pacific","asia-pacific","south asia","asia"],"za":["africa","emea"],"us":["north america","americas"],"ca":["north america","americas"],"gb":["europe","emea"],"ie":["europe","emea"],"fr":["europe","emea"],"de":["europe","emea"],"nl":["europe","emea"],"es":["europe","emea"],"it":["europe","emea"],"au":["apac","asia pacific","oceania"],"nz":["apac","asia pacific","oceania"],"sg":["apac","asia pacific"],"br":["latam","latin america","americas"],"ae":["middle east","emea"]}
GERMAN_STRONG=re.compile(r"\b(kenntnisse|berufserfahrung|bewerbung|lebenslauf|stellenanzeige|arbeitszeit|anstellung|gehalt|deutschkenntnisse|unternehmen|aufgaben|anforderungen|gesucht|deutsche|deutsch)\b",re.I)
SKILLS=["Python","JavaScript","TypeScript","React","Next.js","Node.js","FastAPI","Django","SQL","PostgreSQL","MongoDB","AWS","Docker","Kubernetes","Git","GraphQL","Java","C++","Go","Rust","Figma","Tailwind CSS","Vue","Angular","Flutter","Firebase","GCP","Azure","REST APIs","HTML","CSS","Redis","Linux","CI/CD","Microservices","System Design","TensorFlow","PyTorch","LLM","OpenAI","NLP","Machine Learning","Data Science","Power BI","Excel","SaaS"]

class JobSearchRequest(BaseModel):
    query:str=Field(default="",max_length=120); location:str=Field(default="",max_length=160); country:str=Field(default="",max_length=80); remote:bool=False; limit:int=Field(default=120,ge=1,le=200); profile:dict[str,Any]=Field(default_factory=dict)

def norm(v:Any)->str:return re.sub(r"\s+"," ",str(v or "").strip().lower())
def clean(v:Any)->str:return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",html.unescape(str(v or "")))).strip()
def token(needle:str,text:str)->bool:return bool(needle and re.search(rf"(?<![a-z]){re.escape(norm(needle))}(?![a-z])",norm(text)))
def country_code(country:str,location:str)->str:
    value=norm(country)
    if value in COUNTRY_CODES:return COUNTRY_CODES[value]
    for alias,code in COUNTRY_CODES.items():
        if token(alias,value):return code
    for city,code in CITY_COUNTRY.items():
        if token(city,location):return code
    return ""
def requested_city(location:str)->str:
    first=norm(location).split(",")[0].strip();return "" if first in COUNTRY_CODES else first
def explicit_country(code:str,text:str)->bool:return any(token(a,text) for a in ALIASES.get(code,[]))
def likely_german(text:str)->bool:return bool(GERMAN_STRONG.search(clean(text)[:12000]))

def role_family(profile:dict[str,Any])->tuple[str,list[str]]:
    raw=" ".join(str(x) for x in (profile.get("targetRoles") or [])+([profile.get("currentRole")] if profile.get("currentRole") else [])).lower()
    if any(x in raw for x in ["data scientist","data science","machine learning","ml engineer","ai engineer","artificial intelligence"]):return "Data & AI",["data scientist","machine learning engineer","ai engineer","data analyst"]
    if any(x in raw for x in ["devops","sre","site reliability","cloud engineer","platform engineer"]):return "Cloud & DevOps",["devops engineer","cloud engineer","site reliability engineer","platform engineer"]
    if any(x in raw for x in ["frontend","front-end","react developer","ui developer"]):return "Frontend Engineering",["frontend developer","frontend engineer","react developer","web developer"]
    if any(x in raw for x in ["backend","back-end","api developer"]):return "Backend Engineering",["backend developer","backend engineer","api developer","software engineer"]
    if any(x in raw for x in ["full stack","full-stack"]):return "Full Stack Engineering",["full stack developer","full stack engineer","software engineer","web developer"]
    if any(x in raw for x in ["mobile","android","ios","flutter"]):return "Mobile Engineering",["mobile developer","android developer","ios developer","flutter developer"]
    if any(x in raw for x in ["security","cyber","infosec"]):return "Cybersecurity",["cybersecurity analyst","security engineer","information security"]
    if any(x in raw for x in ["qa","quality assurance","test engineer","automation tester"]):return "Quality Engineering",["qa engineer","test engineer","automation engineer","software engineer"]
    if any(x in raw for x in ["product manager","product owner"]):return "Product",["product manager","product owner","technical product manager"]
    return "Software & Technology",["software engineer","software developer","backend developer","full stack developer","web developer"]

def build_queries(req:JobSearchRequest)->tuple[str,list[str],str]:
    family,roles=role_family(req.profile);requested=req.query.strip();presets={"python","backend","django","remote india","data science","ai/ml","full stack"}
    if requested and requested.lower() not in presets:visible=requested;variants=[requested]+roles[:2]
    else:visible=family;variants=roles[:3]
    return visible,list(dict.fromkeys(v[:80] for v in variants)),family

def location_fit(code:str,requested:str,job_location:str,description:str,remote:bool)->tuple[bool,str,int]:
    loc,desc=norm(job_location),norm(description);combined=f"{loc} {desc}"
    if remote:
        if any(x in combined for x in REMOTE_GLOBAL):return True,"Worldwide remote eligibility",100
        if explicit_country(code,combined):return True,"Remote eligibility includes candidate country",100
        if any(x in combined for x in REMOTE_REGION.get(code,[])):return True,"Remote eligibility includes candidate region",90
        return False,"Remote eligibility does not include candidate country or region",0
    if not explicit_country(code,loc):return False,"Listing is outside the candidate country",0
    city=requested_city(requested);return (True,"Preferred city match",100) if city and token(city,loc) else (True,"Candidate-country match",80)

def extract_adzuna_location(value:Any)->str:
    if isinstance(value,dict):
        if value.get("display_name"):return clean(value["display_name"])
        if isinstance(value.get("area"),list):return ", ".join(clean(x) for x in value["area"] if clean(x))
    if isinstance(value,list):return ", ".join(clean(x) for x in value if clean(x))
    return clean(value)
def extract_date(item:dict[str,Any])->str:return str(item.get("created") or item.get("pubDate") or item.get("date") or item.get("created_at") or "")[:10]
def is_fresh(date_text:str,max_days:int=60)->bool:
    if not date_text:return False
    try:return datetime.now(timezone.utc)-datetime.fromisoformat(date_text.replace("Z","+00:00"))<=timedelta(days=max_days)
    except ValueError:
        try:return datetime.now(timezone.utc).date()-datetime.strptime(date_text[:10],"%Y-%m-%d").date()<=timedelta(days=max_days)
        except ValueError:return False
def infer_skills(text:str)->list[str]:return [s for s in SKILLS if re.search(rf"(?<![\w+#]){re.escape(s)}(?![\w+#])",text or "",re.I)]
def infer_years(text:str)->int:
    found=[int(m.group(1)) for p in [r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?",r"(\d+)\+?\s+years?\s+(?:of\s+)?experience"] for m in re.finditer(p,text or "",re.I)];return max(found,default=0)
def profile_roles(profile:dict[str,Any])->list[str]:return [norm(x) for x in (profile.get("targetRoles") or ([profile.get("currentRole")] if profile.get("currentRole") else [])) if str(x).strip()]
def score(profile:dict[str,Any],job:dict[str,Any],location_score:int,reason:str)->dict[str,Any]:
    skills={norm(x) for x in profile.get("skills",[])+profile.get("technologies",[])};required=job.get("requiredSkills",[]);matched=[x for x in required if norm(x) in skills];missing=[x for x in required if norm(x) not in skills];skill_score=round(100*len(matched)/len(required)) if required else 55;experience=float(profile.get("yearsOfExperience") or 0);minimum=float(job.get("minYearsExperience") or 0);experience_score=100 if minimum<=0 else max(0,min(100,round(100-max(0,minimum-experience)*25)));target=profile_roles(profile);title=norm(job.get("title"));role_score=100 if target and any(r in title or title in r for r in target) else 65;total=round(skill_score*.5+experience_score*.2+role_score*.2+location_score*.1)
    return {"compatibilityScore":total,"opportunityScore":total,"matchedSkills":matched,"partialSkills":[],"missingSkills":missing,"strengths":[f"Matches {len(matched)} of {len(required)} detected skills"] if required else [],"concerns":[f"Potential skill gap: {', '.join(missing[:5])}"] if missing else [],"isEligible":location_score>=70,"eligibilityReason":reason,"breakdown":{"skillsScore":skill_score,"experienceScore":experience_score,"roleScore":role_score,"locationScore":location_score,"qualificationScore":70},"confidence":"Estimated"}
def canonical_url(url:str)->str:
    try:p=urlsplit(url);return urlunsplit((p.scheme,p.netloc,p.path.rstrip("/"),"",""))
    except Exception:return url.split("?",1)[0].rstrip("/")

def normalize_job(source:str,item:dict[str,Any],profile:dict[str,Any],code:str,requested:str)->dict[str,Any]|None:
    title=clean(item.get("title") or item.get("jobTitle") or item.get("position"));company_value=item.get("company") or item.get("companyName") or item.get("company_name");company=clean(company_value.get("display_name") if isinstance(company_value,dict) else company_value)
    location=extract_adzuna_location(item.get("location")) if source=="Adzuna" else clean(item.get("jobGeo") or item.get("jobLocation") or item.get("location") or item.get("locationName") or item.get("geo") or "Remote")
    description=clean(item.get("description") or item.get("jobDescription") or item.get("descriptionText") or item.get("jobExcerpt"));url=str(item.get("redirect_url") or item.get("apply_url") or item.get("url") or "").strip();date=extract_date(item);remote=bool(item.get("remote")) or source in {"Jobicy","Remote OK"} or "remote" in norm(f"{title} {location}")
    if not title or not company or not url or not date or not is_fresh(date):return None
    if code!="de" and likely_german(f"{title} {description}"):return None
    allowed,reason,location_score=location_fit(code,requested,location,description,remote)
    if not allowed:return None
    required=infer_skills(description);years=infer_years(description)
    job={"id":f"{source.lower().replace(' ','-')}:{item.get('id') or item.get('slug') or canonical_url(url)}","title":title,"normalizedTitle":title,"roleFamily":"","company":company,"companyDomain":"","location":location,"remote":remote,"remoteType":"Remote" if remote else "On-site","employmentType":clean(item.get("contract_time") or item.get("jobType") or "Full-time"),"experienceLevel":clean(item.get("jobLevel") or ""),"minYearsExperience":years,"description":description[:6000],"responsibilities":[],"requirements":required,"requiredSkills":required,"preferredSkills":[],"postingDate":date,"freshnessLabel":"Verified recent source listing","lastSeenAt":datetime.now(timezone.utc).isoformat(),"applicationUrl":url,"primarySource":source,"sourcesList":[{"sourceName":source,"sourceUrl":url,"sourceType":"Live feed","postedDate":date,"isOfficial":False}],"applicationMethod":"External Form","hardRequirements":[],"requiresWorkAuth":False,"salaryMin":item.get("salary_min") or item.get("salaryMin"),"salaryMax":item.get("salary_max") or item.get("salaryMax"),"salaryCurrency":item.get("salaryCurrency") or "","locationMatch":reason,"locationScore":location_score};job["match"]=score(profile,job,location_score,reason) if profile else None;return job

async def fetch_adzuna_page(client:httpx.AsyncClient,req:JobSearchRequest,code:str,query:str,page:int)->list[dict[str,Any]]:
    app_id,app_key=os.getenv("ADZUNA_APP_ID"),os.getenv("ADZUNA_APP_KEY")
    if not app_id or not app_key:return []
    params={"app_id":app_id.strip(),"app_key":app_key.strip(),"results_per_page":50,"what":query,"sort_by":"date","content-type":"application/json"}
    if req.remote:params["what_and"]="remote"
    response=await client.get(f"https://api.adzuna.com/v1/api/jobs/{code}/search/{page}",params=params);response.raise_for_status();return [job for item in response.json().get("results",[]) if (job:=normalize_job("Adzuna",item,req.profile,code,req.location))]
async def fetch_adzuna(client:httpx.AsyncClient,req:JobSearchRequest,code:str,queries:list[str])->list[dict[str,Any]]:
    results=await asyncio.gather(*[fetch_adzuna_page(client,req,code,q,p) for q in queries for p in (1,2)],return_exceptions=True);return [job for result in results if isinstance(result,list) for job in result]
async def fetch_jobicy(client:httpx.AsyncClient,req:JobSearchRequest,code:str,queries:list[str])->list[dict[str,Any]]:
    params={"count":200};geo=JOBICY_GEO.get(code)
    if geo:params["geo"]=geo
    params["tag"]=(queries[0] if queries else "software engineer")[:60];response=await client.get("https://jobicy.com/api/v2/remote-jobs",params=params);response.raise_for_status();return [job for item in response.json().get("jobs",[]) if (job:=normalize_job("Jobicy",item,req.profile,code,req.location))]
async def fetch_remoteok(client:httpx.AsyncClient,req:JobSearchRequest,code:str,queries:list[str])->list[dict[str,Any]]:
    skills=[norm(x) for x in (req.profile.get("skills",[])+req.profile.get("technologies",[])) if x];params={"tags":",".join(skills[:2])} if skills else {};response=await client.get("https://remoteok.com/api",params=params);response.raise_for_status();data=response.json();return [job for item in data if isinstance(item,dict) and (job:=normalize_job("Remote OK",item,req.profile,code,req.location))] if isinstance(data,list) else []

async def search_jobs(req:JobSearchRequest)->dict[str,Any]:
    requested=(req.location or req.profile.get("location","")).strip();code=country_code(req.country or req.profile.get("country",""),requested)
    if not code:raise HTTPException(400,"SLAM needs a valid country in the profile before searching.")
    visible_query,queries,family=build_queries(req);errors={}
    async with httpx.AsyncClient(timeout=20,follow_redirects=True,headers={"User-Agent":"SLAM/6.0"}) as client:
        async def run(name,fn):
            try:return name,await fn(client,req,code,queries)
            except Exception as exc:errors[name]=f"{type(exc).__name__}: source unavailable";return name,[]
        sources=await asyncio.gather(run("Adzuna",fetch_adzuna),run("Jobicy",fetch_jobicy),run("Remote OK",fetch_remoteok))
    combined={}
    for source,items in sources:
        for job in items:
            key=canonical_url(job.get("applicationUrl","")).lower()
            if key not in combined:combined[key]=job
            else:combined[key]["sourcesList"]+=job.get("sourcesList",[])
    jobs=list(combined.values())
    if req.remote:jobs=[j for j in jobs if j.get("remote")]
    for job in jobs:job["match"]=score(req.profile,job,int(job.get("locationScore") or 0),str(job.get("locationMatch") or "Verified country match")) if req.profile else None
    jobs.sort(key=lambda j:((j.get("match") or {}).get("compatibilityScore",0),j.get("postingDate","")),reverse=True)
    status={source:{"available":bool(items),"count":len(items),"configured":source!="Adzuna" or bool(os.getenv("ADZUNA_APP_ID") and os.getenv("ADZUNA_APP_KEY")),"error":errors.get(source,"")} for source,items in sources}
    return {"jobs":jobs[:req.limit],"count":len(jobs),"loadedCount":min(len(jobs),req.limit),"query":visible_query,"queryVariants":queries,"roleFamily":family,"country":code,"location":requested,"sources":status,"sourceErrors":errors,"source":"Live multi-source feeds — no hardcoded listings","warning":"No recent verified live listings matched these filters. Try another role or enable remote jobs." if not jobs else ""}

@app.post("")
@app.post("/")
@app.post("/{path:path}")
async def handler(req:JobSearchRequest):return await search_jobs(req)
