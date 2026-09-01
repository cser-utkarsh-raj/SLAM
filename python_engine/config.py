"""
AutoJob Python Engine - Configuration & Candidate Profile Store
"""
import os
from typing import Dict, Any, List
from pydantic import BaseModel, Field

class CandidateProfile(BaseModel):
    full_name: str = "Alex Mercer"
    email: str = "alex.mercer.dev@gmail.com"
    phone: str = "+1 (415) 555-0199"
    location: str = "San Francisco, CA"
    linkedin_url: str = "https://linkedin.com/in/alex-mercer-dev"
    github_url: str = "https://github.com/alexmercer"
    website_url: str = "https://alexmercer.io"
    
    # Legal & Visa Declarations (Deterministic Guardrails)
    us_citizen: bool = True
    authorized_in_us: bool = True
    requires_sponsorship_now: bool = False
    requires_sponsorship_future: bool = False
    is_bound_by_non_compete: bool = False
    security_clearance: str = "None"
    
    # Professional Metrics
    years_experience_by_skill: Dict[str, int] = {
        "python": 5,
        "fastapi": 4,
        "playwright": 3,
        "typescript": 4,
        "react": 4,
        "docker": 4,
        "kubernetes": 3,
        "aws": 3,
        "postgresql": 5,
        "machine_learning": 2
    }
    
    desired_salary_min: int = 145000
    desired_salary_max: int = 175000
    desired_salary_currency: str = "USD"
    notice_period_weeks: int = 2
    willing_to_relocate: bool = False
    remote_only: bool = True

class BotConfig(BaseModel):
    daily_application_cap: int = 20
    min_match_score: int = 70
    copilot_mode: bool = True # Pause before final submit for 1-click human verification
    headless: bool = False # Always run False to evade Arkose Labs / Kasada bot filters
    typing_delay_min_ms: int = 35
    typing_delay_max_ms: int = 115
    user_data_dir: str = "./vault/chrome_user_profile"
    log_db_path: str = "./vault/autojob_crm.db"

DEFAULT_CANDIDATE = CandidateProfile()
DEFAULT_CONFIG = BotConfig()
