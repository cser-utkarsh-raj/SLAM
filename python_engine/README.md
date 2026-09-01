# AutoJob Python Engine 🚀

Production-grade Python 3.11+ autonomous job application bot & copilot for LinkedIn and Indeed. Powered by **Playwright Async**, **Google Gemini 2.5/3.0 SDK**, and **Pydantic**.

## Quickstart Setup

1. **Install Python Dependencies:**
```bash
pip install -r requirements.txt
playwright install chromium
```

2. **Set your Google Gemini API Key:**
```bash
export GEMINI_API_KEY="your_gemini_api_key_here"
```

3. **Configure your Candidate Profile:**
Edit `config.py` with your verified skills, experience years, and salary expectations.

4. **Run the Bot in Copilot Mode (Recommended):**
```bash
python -m python_engine.main
```

## Architecture Modules

* `config.py` - Candidate profile schema & bot configuration guardrails.
* `stealth_browser.py` - Playwright persistent context, CDP webdriver patching, and natural typing simulator.
* `ai_tailor.py` - Structured Gemini LLM prompts for role-fit scoring, custom resume bullet points, cover letters, and recruiter question answering.
* `form_wizard.py` - Backtracking multi-page modal traverser for inputs, radio buttons, dropdowns, and file uploads.
* `main.py` - Rich CLI orchestrator with humanized cooldowns and circuit breakers.
