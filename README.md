# ⚡ SLAM

### Sequential Labor Application & Matching

> **A job-discovery and application-preparation platform built around real data, explainable matching, and human-controlled applications.**

SLAM is designed to reduce the painful gap between **"find a job"** and **"prepare a good application"**. It ingests a candidate's profile/resume, discovers real public opportunities, explains compatibility, prepares factual application material, and keeps the resulting workflow organized.

SLAM is an independent product presented by **.dot**.

## 🔄 Product Flow

```text
Landing
  ↓
Account
  ↓
Resume / Profile Intake
  ↓
Profile Verification
  ↓
Country + Role Preferences
  ↓
Real Job Discovery
  ↓
Compatibility Analysis
  ↓
Application Preparation
  ↓
Application Tracker
```

## ✨ Current Capabilities

- 📄 **Resume ingestion** — PDF, DOCX, and TXT through FastAPI.
- 🧠 **AI profile extraction** — NVIDIA NIM with OpenRouter fallback.
- 🛡️ **Deterministic fallback** — profile parsing can degrade without fabricating data.
- 🌍 **Country-aware job discovery** — public listings through supported job feeds such as Arbeitnow.
- 🎯 **Explainable matching** — compatibility scores are based on candidate/job evidence rather than opaque claims.
- ✍️ **Factual cover letters** — generated from information actually available in the candidate profile and listing.
- 📋 **Application tracking** — keep discovered roles and preparation steps organized.
- 🔐 **Firebase authentication and persistence** — accounts, profiles, and application state are stored securely.
- 💳 **SLAM+ subscriptions** — Razorpay checkout and server-side verification endpoints.
- 🔌 **Platform connection states** — designed without asking users for third-party passwords.
- 🎨 **Focused onboarding** — the experience moves from candidate profile to actionable job opportunities.

## 🧭 Data-Integrity Contract

SLAM is deliberately **anti-fabrication**.

It must never:

- Invent candidate information or job listings.
- Invent salary, applicant counts, recruiter contacts, dates, requirements, or other listing facts.
- Create fake jobs when live discovery fails.
- Request or store LinkedIn, Indeed, Glassdoor, or other third-party passwords.
- Bypass CAPTCHA, 2FA, identity verification, or access controls.
- Automate around bot-detection systems.
- Claim a payment/subscription is active before server-side verification.
- Submit an application when a platform requires human authentication or intervention.

**When SLAM cannot reliably perform an action, it says so.**

## 🏗️ Architecture

```text
React + TypeScript + Vite
          │
          │ /api proxy
          ▼
Python / FastAPI
          │
    ┌─────┼──────────────────────────┐
    ▼     ▼          ▼        ▼      ▼
 Resume  AI       Jobs      Match  Payments
 Extract Profile  Discovery Engine  Verify
    │     │          │        │      │
    ▼     ▼          ▼        ▼      ▼
 pypdf  NVIDIA    Arbeitnow  Rules  Razorpay
 docx   OpenRouter / public feeds
                    │
                    ▼
               Firebase
```

There is intentionally **one backend source of truth**. The obsolete TypeScript Express backend has been removed.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Documents | pypdf, python-docx |
| AI | NVIDIA NIM + OpenRouter |
| Persistence | Firebase / Firestore REST |
| Jobs | Public feeds with source URLs preserved |
| Payments | Razorpay Subscriptions |
| Motion | Motion |
| Icons | Lucide React |

## 🚀 Run Locally

```bash
pip install -r requirements.txt
npm install
npm run dev
```

Development ports:

- Vite frontend: `3000`
- FastAPI backend: `8000`
- `/api/*` is proxied to FastAPI by Vite.

Production build:

```bash
npm run build
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

FastAPI serves the built `dist/` frontend when present.

## 🔐 Environment

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

Never commit live credentials or `.env` files.

## 📌 Status

SLAM is an **active MVP**. The priority is reliable real-world data flow before expanding source coverage or pushing deeper automation. Authentication-gated and unsupported actions remain human-controlled by design.

> **SLAM · Find better. Match smarter. Apply with confidence.**
>
> **Presented by .dot**
