from __future__ import annotations

import asyncio, html, os, re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="SLAM Live Job Discovery", version="8.1.0")

COUNTRY_CODES={"india":"in","ind":"in","in":"in","south africa":"za","za":"za","united states":"us","usa":"us","us":"us","united kingdom":"gb","uk":"gb","gb":"gb","canada":"ca","ca":"ca","australia":"au","au":"au","germany":"de","de":"de","france":"fr","fr":"fr","netherlands":"nl","holland":"nl","nl":"nl","ireland":"ie","ie":"ie","singapore":"sg","sg":"sg","new zealand":"nz","nz":"nz","spain":"es","es":"es","italy":"it","it":"it","brazil":"br","br":"br","uae":"ae","united arab emirates":"ae","ae":"ae"}
ALIASES={"in":["india","indian","hyderabad","patna","jaipur","mumbai","delhi","new delhi","bengaluru","bangalore","pune","chennai","noida","gurgaon","gurugram","kolkata","ahmedabad","kochi","lucknow"],"za":["south africa","cape town","johannesburg","pretoria","durban","port elizabeth"],"us":["united states","usa","u.s.","new york","california","texas","florida","washington","massachusetts","illinois","seattle","austin","boston","chicago","san francisco","los angeles"],"gb":["united kingdom","uk","u.k.","england","scotland","wales","london","manchester","birmingham","edinburgh","glasgow"],"ca":["canada","toronto","vancouver","montreal","calgary","ottawa","ontario","quebec"],"au":["australia","sydney","melbourne","brisbane","perth","adelaide"],"de":["germany","berlin","munich","frankfurt","hamburg","cologne","stuttgart"],"fr":["france","paris","lyon","marseille","toulouse"],"nl":["netherlands","holland","amsterdam","rotterdam","utrecht"],"ie":["ireland","dublin","cork","galway"],"sg":["singapore"],"nz":["new zealand","auckland","wellington","christchurch"],"es":["spain","madrid","barcelona","valencia"],"it":["italy","rome","milan","turin"],"br":["brazil","sao paulo","rio de janeiro","brasilia"],"ae":["uae","united arab emirates","dubai","abu dhabi"]}
CITY_COUNTRY={x:c for c,xs in ALIASES.items() for x in xs}
JOBICY_GEO={"in":"apac","za":"africa","us":"usa","gb":"uk","ca":"canada","au":"australia","de":"germany","fr":"france","nl":"netherlands","ie":"ireland","sg":"singapore","nz":"new-zealand","es":"spain","it":"italy","br":"latam","ae":"emea"}
REMOTE_GLOBAL=["worldwide","world wide","global","anywhere","work from anywhere","all countries","international remote","open globally"]
REMOTE_REGION={"in":["apac","asia pacific","asia-pacific","south asia","asia"],"za":["africa","emea"],"us":["north america","americas"],"ca":["north america","americas"],"gb":["europe","emea"],"ie":["europe","emea"],"fr":["europe","emea"],"de":["europe","emea"],"nl":["europe","emea"],"es":["europe","emea"],"it":["europe","emea"],"au":["apac","asia pacific","oceania"],"nz":["apac","asia pacific","oceania"],"sg":["apac","asia pacific"],"br":["latam","latin america","americas"],"ae":["middle east","emea"]}
GERMAN_STRONG=re.compile(r"\b(kenntnisse|berufserfahrung|bewerbung|lebenslauf|stellenanzeige|arbeitszeit|anstellung|gehalt|deutschkenntnisse|unternehmen|aufgaben|anforderungen|gesucht|deutsche|deutsch)\b",re.I)
SKILLS=["Python","JavaScript","TypeScript","React","Next.js","Node.js","FastAPI","Django","SQL","PostgreSQL","MongoDB","AWS","Docker","Kubernetes","Git","GraphQL","Java","C++","Go","Rust","Figma","Tailwind CSS","Vue","Angular","Flutter","Firebase","GCP","Azure","REST APIs","HTML","CSS","Redis","Linux","CI/CD","Microservices","System Design","TensorFlow","PyTorch","LLM","OpenAI","NLP","Machine Learning","Data Science","Power BI","Excel","SaaS"]
STOP_WORDS={"developer","engineer","software","senior","junior","lead","the","and","or","with","for","of","in","on","remote"}

class JobSearchRequest(BaseModel):
    query:str=Field(default="",max_length=120); location:str=Field(default="",max_length=160); country:str=Field(default="",max_length=80); remote:bool=False; limit:int=Field(default=120,ge=1,le=200); profile:dict[str,Any]=Field(default_factory=dict)

def norm(v:Any)->str:return re.sub(r"\s+"," ",str(v or "").strip().lower())
def clean(v:Any)->str:return re.sub(r"\s+"," ",re.sub(r"<[^>]+>"," ",html.unescape(str(v or "")))).strip()
def token(n:str,t:str)->bool:return bool(n and re.search(rf"(?<![a-z]){re.escape(norm(n))}(?![a-z])",norm(t)))

def country_code(country:str,location:str)->str:
    v=norm(country)
    if v in COUNTRY_CODES:return COUNTRY_CODES[v]
    for a,c in COUNTRY_CODES.items():
        if token(a,v):return c
    for city,c in CITY_COUNTRY.items():
        if token(city,location):return c
    return ""

def requested_city(location:str)->str:
    first=norm(location).split(",")[0].strip();return "" if first in COUNTRY_CODES else first

def explicit_country(code:str,text:str)->bool:return any(token(a,text) for a in ALIASES.get(code,[]))
def likely_german(text:str)->bool:return bool(GERMAN_STRONG.search(clean(text)[:12000]))

def role_family(profile:dict[str,Any])->tuple[str,list[str]]:
    raw=" ".join(str(x) for x in (profile.get("targetRoles") or [])+([profile.get("currentRole")] if profile.get("currentRole") else [])).lower()
    groups=[(["data scientist","data science","machine learning","ml engineer","ai engineer","artificial intelligence"],"Data & AI",["data scientist","machine learning engineer","ai engineer","data analyst"]),(["devops","sre","site reliability","cloud engineer","platform engineer"],"Cloud & DevOps",["devops engineer","cloud engineer","site reliability engineer","platform engineer"]),(["frontend","front-end","react developer","ui developer"],"Frontend Engineering",["frontend developer","frontend engineer","react developer","web developer"]),(["backend","back-end","api developer"],"Backend Engineering",["backend developer","backend engineer","api developer","software engineer"]),(["full stack","full-stack"],"Full Stack Engineering",["full stack developer","full stack engineer","software engineer","web developer"]),(["mobile","android","ios","flutter"],"Mobile Engineering",["mobile developer","android developer","ios developer","flutter developer"]),(["security","cyber","infosec"],"Cybersecurity",["cybersecurity analyst","security engineer","information security"]),(["qa","quality assurance","test engineer","automation tester"],"Quality Engineering",["qa engineer","test engineer","automation engineer","software engineer"]),(["product manager","product owner"],"Product",["product manager","product owner","technical product manager"])]
    for needles,family,roles in groups:
        if any(x in raw for x in needles):return family,roles
    return "Software & Technology",["software engineer","software developer","backend developer","full stack developer","web developer"]

def build_queries(req:JobSearchRequest)->tuple[str,list[str],str,bool]:
    family,roles=role_family(req.profile);requested=req.query.strip();presets={"software engineering","backend","frontend","data & ai","cloud & devops","product","software & technology"}
    if requested and requested.lower() not in presets:return requested,[requested],family,True
    return roles[0],roles[:3],family,False

def query_terms(query:str)->list[str]:
    return list(dict.fromkeys(x for x in re.findall(r"[a-z0-9+#.]+",norm(query)) if x.strip(".") and x.strip(".") not in STOP_WORDS and len(x.strip("."))>1))

def title_matches_query(title:str,query:str)->bool:
    terms=query_terms(query)
    if not terms:return True
    t=norm(title).replace("typescript.js","typescript").replace("node.js","node js")
    aliases={"ts":"typescript","js":"javascript","nodejs":"node","reactjs":"react","golang":"go"};hits=0
    for term in terms:
        term=aliases.get(term,term)
        if token(term,t) or term.replace(" ","") in t.replace(" ",""):hits+=1
    return hits>=min(2,len(terms))

def adzuna_location(v:Any)->str:
    if not isinstance(v,dict):return clean(v)
    display=clean(v.get("display_name"));area=v.get("area")
    if display:return display
    if isinstance(area,list):return ", ".join(clean(x) for x in area if clean(x))
    return clean(area)

def parse_date(v:Any)->str:
    if v is None or v=="":return ""
    if isinstance(v,(int,float)):
        try:return datetime.fromtimestamp(v,tz=timezone.utc).date().isoformat()
        except (OverflowError,OSError,ValueError):return ""
    raw=str(v).strip()
    try:return datetime.fromisoformat(raw.replace("Z","+00:00")).date().isoformat()
    except ValueError:
        m=re.match(r"(\d{4}-\d{2}-\d{2})",raw);return m.group(1) if m else ""

def is_fresh(date_text:str,max_days:int=60)->bool:
    try:
        age=(datetime.now(timezone.utc).date()-datetime.strptime(date_text[:10],"%Y-%m-%d").date()).days;return 0<=age<=max_days
    except (ValueError,TypeError):return False

def infer_skills(text:str)->list[str]:return [s for s in SKILLS if re.search(rf"(?<![\w+#]){re.escape(s)}(?![\w+#])",text or "",re.I)]
def infer_years(text:str)->int:
    vals=[]
    for p in [r"(?:minimum|at least|over|more than)\s+(\d+)\+?\s+years?",r"(\d+)\+?\s+years?\s+(?:of\s+)?experience"]:vals += [int(m.group(1)) for m in re.finditer(p,text or "",re.I)]
    return max(vals,default=0)
def profile_roles(profile:dict[str,Any])->list[str]:
    vals=profile.get("targetRoles") or ([profile.get("currentRole")] if profile.get("currentRole") else []);return [norm(v) for v in vals if str(v).strip()]

def location_fit(code:str,requested:str,job_location:str,description:str,remote:bool)->tuple[bool,str,int]:
    loc=norm(job_location);combined=f"{loc} {norm(description)}"
    if remote:
        if any(x in combined for x in REMOTE_GLOBAL):return True,"Worldwide remote eligibility",100
        if explicit_country(code,combined):return True,"Remote eligibility includes candidate country",100
        if any(x in combined for x in REMOTE_REGION.get(code,[])):return True,"Remote eligibility includes candidate region",90
        return False,"Remote eligibility does not include candidate country or region",0
    if not explicit_country(code,loc):return False,"Listing is outside the candidate country",0
    city=requested_city(requested);return (True,"Preferred city match",100) if city and token(city,loc) else (True,"Candidate-country match",80)

def canonical_url(url:str)->str:
    try:
        p=urlsplit(url);return urlunsplit((p.scheme,p.netloc,p.path.rstrip("/"),"",""))
    except Exception:return url.split("?",1)[0].rstrip("/")

def match_score(profile:dict[str,Any],title:str,required:list[str],location_score:int,minimum_years:int)->dict[str,Any]:
    skills={norm(x) for x in (profile.get("skills",[])+profile.get("technologies",[]))};matched=[x for x in required if norm(x) in skills];missing=[x for x in required if norm(x) not in skills];exp=float(profile.get("yearsOfExperience") or 0);exp_score=100 if minimum_years<=0 else max(0,min(100,round(100-max(0,minimum_years-exp)*25)));targets=profile_roles(profile);role_score=100 if targets and any(r in norm(title) or norm(title) in r for r in targets) else 65;skill_score=round(100*len(matched)/len(required)) if required else 55;total=round(skill_score*.5+exp_score*.2+role_score*.2+location_score*.1)
    return {"compatibilityScore":total,"opportunityScore":total,"matchedSkills":matched,"partialSkills":[],"missingSkills":missing,"strengths":[f"Matches {len(matched)} of {len(required)} detected skills"] if required else [],"concerns":[f"Potential skill gap: {', '.join(missing[:5])}"] if missing else [],"isEligible":location_score>=70,"eligibilityReason":"Country/location eligible","confidence":"Estimated","breakdown":{"skillsScore":skill_score,"experienceScore":exp_score,"roleScore":role_score,"locationScore":location_score,"qualificationScore":70}}

def normalize_job(source:str,item:dict[str,Any],profile:dict[str,Any],code:str,requested:str,explicit_query:str="")->dict[str,Any]|None:
    title=clean(item.get("title") or item.get("jobTitle") or item.get("position"));cv=item.get("company") or item.get("companyName") or item.get("company_name");company=clean(cv.get("display_name") if isinstance(cv,dict) else cv);location=adzuna_location(item.get("location")) if source=="Adzuna" else clean(item.get("jobGeo") or item.get("jobLocation") or item.get("location") or item.get("locationName") or item.get("geo") or "Remote");description=clean(item.get("jobDescription") or item.get("description") or item.get("descriptionText") or item.get("jobExcerpt"));url=str(item.get("redirect_url") or item.get("apply_url") or item.get("url") or "").strip();date=parse_date(item.get("created") or item.get("pubDate") or item.get("date") or item.get("published") or item.get("created_at"));remote=bool(item.get("remote")) or source in {"Jobicy","Remote OK"} or "remote" in norm(f"{title} {location}")
    if not title or not company or not url or not is_fresh(date):return None
    if explicit_query and not title_matches_query(title,explicit_query):return None
    if code!="de" and likely_german(f"{title} {description}"):return None
    allowed,reason,location_score=location_fit(code,requested,location,description,remote)
    if not allowed:return None
    required=infer_skills(description);years=infer_years(description);salary_min=item.get("salary_min") or item.get("salaryMin");salary_max=item.get("salary_max") or item.get("salaryMax");currency=item.get("salaryCurrency") or item.get("salary_currency") or "";logo=str(item.get("companyLogo") or item.get("company_logo") or "").strip();domain=clean(item.get("companyDomain") or item.get("company_domain") or "")
    job={"id":f"{source.lower().replace(' ','-')}:{item.get('id') or item.get('slug') or canonical_url(url)}","title":title,"normalizedTitle":title,"roleFamily":"","company":company,"companyDomain":domain,"companyLogo":logo,"location":location,"remote":remote,"remoteType":"Remote" if remote else "On-site","employmentType":clean(item.get("contract_time") or item.get("jobType") or "Full-time"),"experienceLevel":clean(item.get("jobLevel") or ""),"minYearsExperience":years,"minSalary":salary_min,"maxSalary":salary_max,"salaryMin":salary_min,"salaryMax":salary_max,"salaryCurrency":currency,"currency":currency,"salaryText":clean(f"{salary_min} - {salary_max}" if salary_min and salary_max else ""),"description":description[:8000],"responsibilities":[],"requirements":required,"requiredSkills":required,"preferredSkills":[],"postingDate":date,"freshnessLabel":"Verified recent source listing","lastSeenAt":datetime.now(timezone.utc).isoformat(),"applicationUrl":url,"primarySource":source,"sourceLabel":"Jobs by Adzuna" if source=="Adzuna" else source,"sourcesList":[{"sourceName":source,"sourceUrl":url,"sourceType":"Live feed","postedDate":date,"isOfficial":False}],"applicationMethod":"External Form","hardRequirements":[],"requiresWorkAuth":False,"locationMatch":reason,"locationScore":location_score}
    job["match"]=match_score(profile,title,required,location_score,years);return job

async def get_json(client:httpx.AsyncClient,url:str,params:dict[str,Any]|None=None)->Any:
    try:
        r=await client.get(url,params=params);return r.json() if r.status_code==200 else None
    except Exception:return None

async def fetch_adzuna(client:httpx.AsyncClient,code:str,queries:list[str])->list[dict[str,Any]]:
    app_id=os.getenv("ADZUNA_APP_ID") or os.getenv("ADZUNA_APPID") or os.getenv("ADZUNA_ID");app_key=os.getenv("ADZUNA_APP_KEY") or os.getenv("ADZUNA_APPKEY") or os.getenv("ADZUNA_KEY")
    if not app_id or not app_key:return []
    out=[]
    for q in queries[:3]:
        data=await get_json(client,f"https://api.adzuna.com/v1/api/jobs/{code}/search/1",{"app_id":app_id,"app_key":app_key,"results_per_page":50,"what":q,"sort_by":"date"})
        if isinstance(data,dict):out+=data.get("results") or []
        if len(out)>=100:break
    return out

async def fetch_jobicy(client:httpx.AsyncClient,code:str,query:str)->list[dict[str,Any]]:
    geo=JOBICY_GEO.get(code)
    if not geo:return []
    params={"count":200,"geo":geo,"industry":"engineering"}
    if query and query.lower() not in {"software & technology","software engineering"}:params["tag"]=query[:60]
    data=await get_json(client,"https://jobicy.com/api/v2/remote-jobs",params);return data.get("jobs",[]) if isinstance(data,dict) else []

async def fetch_remoteok(client:httpx.AsyncClient,profile:dict[str,Any],query:str)->list[dict[str,Any]]:
    role=norm(query).replace(" ","-") if query else "software-engineer";skills=[norm(x).replace(" ","-") for x in (profile.get("skills",[])+profile.get("technologies",[])) if str(x).strip()];tags=list(dict.fromkeys([role]+skills[:1]));data=await get_json(client,"https://remoteok.com/api",{"tags":",".join(tags)});return [x for x in data if isinstance(x,dict) and x.get("position")] if isinstance(data,list) else []

def diversify(jobs:list[dict[str,Any]],limit:int)->list[dict[str,Any]]:
    buckets:dict[str,list[dict[str,Any]]]={}
    for job in jobs:buckets.setdefault(job.get("primarySource","Unknown"),[]).append(job)
    for b in buckets.values():b.sort(key=lambda j:(j.get("match",{}).get("compatibilityScore",0),j.get("postingDate","")),reverse=True)
    sources=sorted(buckets,key=lambda s:buckets[s][0].get("match",{}).get("compatibilityScore",0),reverse=True);out=[]
    while len(out)<limit and sources:
        active=[]
        for s in sources:
            if buckets[s]:out.append(buckets[s].pop(0))
            if buckets[s]:active.append(s)
            if len(out)>=limit:break
        sources=active
    return out

@app.post("/api/jobs/search")
async def search_jobs(req:JobSearchRequest):
    code=country_code(req.country or req.location,req.location)
    if not code:raise HTTPException(status_code=400,detail="Please provide a supported country in your profile.")
    visible,queries,_,explicit=build_queries(req);requested=req.location or req.country;explicit_query=req.query.strip() if explicit else "";timeout=httpx.Timeout(14.0,connect=5.0)
    async with httpx.AsyncClient(timeout=timeout,follow_redirects=True,headers={"User-Agent":"SLAM/1.0 live-job-discovery"}) as client:
        adzuna_items,jobicy_items,remoteok_items=await asyncio.gather(fetch_adzuna(client,code,queries),fetch_jobicy(client,code,visible),fetch_remoteok(client,req.profile,visible))
    all_jobs=[]
    for source,items in [("Adzuna",adzuna_items),("Jobicy",jobicy_items),("Remote OK",remoteok_items)]:
        for item in items:
            job=normalize_job(source,item,req.profile,code,requested,explicit_query)
            if job:all_jobs.append(job)
    unique={}
    for job in all_jobs:
        key=canonical_url(job["applicationUrl"])
        if key and key not in unique:unique[key]=job
    jobs=diversify(list(unique.values()),req.limit);returned={}
    for job in jobs:returned[job["primarySource"]]=returned.get(job["primarySource"],0)+1
    return {"jobs":jobs,"query":visible,"country":code,"source":"Live job feeds","warning":"No recent verified live listings matched this country and role. Try a broader role or enable remote jobs." if not jobs else "","counts":{"returned":len(jobs),"returnedBySource":returned,"fetched":{"adzuna":len(adzuna_items),"jobicy":len(jobicy_items),"remote_ok":len(remoteok_items)}}}
