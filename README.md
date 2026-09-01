# SLAM

**Sequential Labor Application & Matching**

SLAM is a job-discovery and application-preparation tool focused on **real candidate data, real public job listings, explainable matching, and human-controlled application flows**.

## What works now

- PDF, DOCX and TXT resume ingestion through the Python backend
- AI-assisted structured profile extraction using configured NVIDIA/OpenRouter providers
- Deterministic, non-fabricating fallback extraction when AI is unavailable
- Public job discovery through the Arbeitnow feed
- Candidate/job compatibility analysis with an explainable fallback scorer
- AI-assisted factual cover letters
- Application preparation and tracking in the frontend
- Firebase persistence foundation for verified profile data
- `.dot` branding and SLAM SVG favicon

## Non-negotiable rules

SLAM must never:

- fabricate candidate information or job information
- invent salary, applicant counts, recruiter contacts, dates or requirements
- collect or store LinkedIn/Indeed/Glassdoor passwords
- bypass CAPTCHA, 2FA, identity verification or access controls
- disguise automation to evade bot detection
- submit an application when a platform requires human authentication or intervention

When a flow needs human action, SLAM stops and hands control back to the user.

## Architecture

```text
React + Vite
    │
    ├── real profile state
    ├── discovery UI
    └── application tracker
          │
          ▼
     Python / FastAPI
          │
    ┌─────┼──────────────┐
    ▼     ▼              ▼
 Resume  Matching       Jobs
 parser  engine         discovery
    │     │              │
    └─────┼──────────────┘
          ▼
    AI provider cascade
    NVIDIA → OpenRouter
          │
          ▼
       Firebase
  profile persistence
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Documents | pypdf, python-docx |
| AI | NVIDIA NIM + OpenRouter |
| Persistence | Firebase / Firestore REST |
| Job discovery | Public job feeds; source URLs preserved |
| Motion | Motion |
| Icons | Lucide React |

## Important implementation detail

The UI is TypeScript because the browser frontend is React. The **business logic, document extraction, AI orchestration, job discovery and matching backend are Python**. There is no longer a second `python_engine` or stealth-browser implementation competing with the main backend.

The repository intentionally does not ship fabricated demo candidates. A fresh installation starts with an empty profile and obtains candidate data from the user's resume or manual input.

## Environment

```env
NVIDIA_API_KEY=...
OPENROUTER_API_KEY=...
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
OPENROUTER_MODEL=google/gemini-2.5-flash
SLAM_ALLOWED_ORIGINS=http://localhost:3000
VITE_API_URL=
```

Never commit live API keys or `.env` files.

## Run locally

```bash
npm install
npm run dev
```

The Vite frontend runs on port 3000 and FastAPI runs on port 3001 in the development script.

## Status

SLAM is an active MVP. The current priority is reliable real-world data flow before expanding source coverage or application automation. Unsupported or authentication-gated application flows remain human-controlled.

---

**SLAM** · Presented by **.dot**
