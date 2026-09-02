# SLAM

**Sequential Labor Application & Matching**

SLAM is a job-discovery and application-preparation platform built around **real candidate data, real public listings, explainable matching and human-controlled application flows**.

## Current product flow

```text
Landing
  ↓
Account
  ↓
Resume / Profile intake
  ↓
Profile verification
  ↓
Country + role preferences
  ↓
Real job discovery
  ↓
Compatibility analysis
  ↓
Application preparation
  ↓
Application tracker
```

## What is implemented

- PDF, DOCX and TXT resume ingestion through FastAPI
- AI profile extraction using NVIDIA NIM with OpenRouter fallback
- Non-fabricating deterministic resume fallback
- Country-aware public job discovery through Arbeitnow
- Explainable candidate/job compatibility scoring
- Factual AI cover-letter generation
- Firebase authentication and profile/application persistence
- Landing page and onboarding flow
- SLAM+ Razorpay subscription checkout + server-side signature verification endpoints
- Platform connection states that never request third-party passwords
- `.dot` footer and SLAM SVG favicon

## Data-integrity rules

SLAM must never:

- fabricate candidate or job information
- invent salary, applicant counts, recruiter contacts, dates or requirements
- create placeholder/fake jobs when live discovery fails
- collect or store LinkedIn, Indeed or Glassdoor passwords
- bypass CAPTCHA, 2FA, identity verification or access controls
- disguise automation to evade bot detection
- claim a payment or subscription is active before server-side verification
- submit an application when a platform requires human authentication or intervention

When a source or flow is unsupported, SLAM says so instead of pretending it works.

## Architecture

```text
React + Vite
    │
    │ /api proxy in development
    ▼
Python / FastAPI
    │
    ├── Resume extraction
    ├── AI orchestration
    ├── Job discovery
    ├── Match engine
    ├── Application preparation
    └── Razorpay verification
          │
          ├── NVIDIA NIM
          ├── OpenRouter
          ├── Arbeitnow
          └── Firebase / Razorpay
```

There is intentionally **one backend source of truth**. The obsolete TypeScript Express backend has been removed.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Documents | pypdf, python-docx |
| AI | NVIDIA NIM + OpenRouter |
| Persistence | Firebase / Firestore REST |
| Jobs | Public job feeds with source URLs preserved |
| Payments | Razorpay Subscriptions |
| Motion | Motion |
| Icons | Lucide React |

## Environment

```env
NVIDIA_API_KEY=...
OPENROUTER_API_KEY=...
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
OPENROUTER_MODEL=openrouter/free
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_PLAN_ID=...
RAZORPAY_WEBHOOK_SECRET=...
SLAM_ALLOWED_ORIGINS=http://localhost:3000
VITE_API_URL=
```

Never commit live API keys or `.env` files.

## Run locally

```bash
pip install -r requirements.txt
npm install
npm run dev
```

The Vite frontend runs on **3000** and FastAPI runs on **8000**. Vite proxies `/api/*` to FastAPI during development.

## Production build

```bash
npm run build
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

FastAPI serves the built `dist/` frontend when it exists.

## Status

SLAM is an active MVP. The priority is **reliable real-world data flow** before expanding source coverage or application automation. Unsupported or authentication-gated flows remain human-controlled.

---

**SLAM** · Presented by **.dot**
