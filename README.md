# SLAM

**Job discovery, compatibility intelligence, and application assistance.**

SLAM helps job seekers find relevant opportunities, understand how well they match, prepare tailored application materials, and track applications from one place.

> Built as a focused utility: discover better jobs, prepare better applications, and keep the human in control when a platform requires it.

## Core capabilities

- Resume/CV import and structured profile creation
- Job discovery across permitted public/approved sources
- Job normalization and duplicate detection
- Explainable compatibility scoring
- Opportunity comparison
- Tailored resume generation
- Cover-letter and application-answer assistance
- Reusable application answer library
- Application tracking
- Human-in-the-loop application assistance
- Controlled automation for explicitly supported application flows

## Architecture

```text
React + TypeScript frontend
          ↓
     Python / FastAPI
          ↓
 ┌────────┼──────────────┐
 ↓        ↓              ↓
Search   AI services   Firestore
          ↓
   Gemini / NVIDIA /
   optional providers
          ↓
  Background workers
          ↓
 Supported application flows
```

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| AI | Gemini API, NVIDIA NIM, optional OpenRouter |
| Database | Firebase / Firestore |
| Auth | Firebase Authentication |
| Browser automation | Playwright for supported flows only |
| Motion | Motion |
| Icons | Lucide React |
| Deployment target | Vercel + Google Cloud Run |

### Repository language breakdown

GitHub's language bar is generated automatically from the source files it detects. SLAM intentionally contains both TypeScript and Python; `.gitattributes` is included to make GitHub Linguist classify the frontend/backend cleanly and exclude non-source files from the breakdown.

The exact percentages are calculated by GitHub and may change as the codebase grows.

## Product principles

- **Quality over volume:** prioritize relevant opportunities instead of indiscriminate mass applications.
- **Explainable matching:** compatibility scores must have a visible reason behind them.
- **No fabrication:** SLAM must never invent experience, qualifications, employers, achievements, salary data, recruiter details, applicant counts, or posting dates.
- **Human control:** authentication challenges, CAPTCHA, 2FA, identity verification, unsupported forms, and restricted flows require the user to take over.
- **No credential harvesting:** SLAM does not store third-party job-platform passwords.
- **No security circumvention:** no CAPTCHA bypass, 2FA bypass, bot-detection evasion, rate-limit circumvention, or stealth automation.
- **Graceful degradation:** discovery and preparation remain useful even when automation is unavailable.

## Development status

SLAM is under active development. The current repository contains the application prototype and its Python backend foundation; production integrations and real-world job-source coverage are being added incrementally.

## Local development

### Frontend

```bash
npm install
npm run dev
```

### Python backend

Use Python 3.12+ and create a virtual environment, then install the backend dependencies before starting FastAPI.

Keep API keys and credentials in environment variables. Never commit `.env` files or live API keys.

## Security

See `SECURITY.md` and `AUTOMATION_POLICY.md` for security and automation constraints.

## License

License to be finalized before public production release.

---

**SLAM**  ·  Presented by **.dot**
