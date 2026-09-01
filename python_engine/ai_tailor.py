"""
AutoJob Python Engine - AI Resume, Cover Letter & Form Semantic Resolver
Powered by Google Gemini 2.5/3.0 SDK
"""
import os
import json
from typing import Dict, Any, Optional
from google import genai
from pydantic import BaseModel, Field
from .config import CandidateProfile, DEFAULT_CANDIDATE

class JobAnalysisResult(BaseModel):
    match_score: int = Field(description="Score from 0-100 indicating role fit")
    extracted_tech_stack: list[str] = Field(description="Key skills and frameworks in posting")
    key_responsibilities: list[str] = Field(description="Top 3 core functions of the role")
    tailored_summary: str = Field(description="Custom 3-sentence profile summary")
    tailored_cover_letter: str = Field(description="Custom 150-word cover letter")
    knockout_criteria_found: list[str] = Field(description="Visa, clearance, or mandatory degrees")

class FormAnswerResult(BaseModel):
    field_label: str
    inferred_value: str
    confidence: float
    is_knockout_risk: bool
    explanation: str

class GeminiTailorEngine:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        self.client = genai.Client(api_key=self.api_key)

    def analyze_and_tailor(self, job_title: str, job_description: str, candidate: CandidateProfile = DEFAULT_CANDIDATE) -> JobAnalysisResult:
        """Analyzes job description and generates custom resume bullet points and cover letter."""
        prompt = f"""
You are an expert ATS optimization engineer. Analyze this job description against the verified candidate profile.

JOB TITLE: {job_title}
JOB DESCRIPTION:
{job_description}

CANDIDATE VERIFIED PROFILE:
{candidate.model_dump_json(indent=2)}

TASK:
1. Calculate a strict match score (0-100).
2. Extract required technologies.
3. Write a tailored 3-sentence professional summary emphasizing matching skills.
4. Write a punchy 150-word cover letter highlighting 2 specific past achievements matching their requirements.
5. NEVER fabricate or hallucinate skills the candidate does not have in their verified profile.
"""
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": JobAnalysisResult,
            }
        )
        return JobAnalysisResult.model_validate_json(response.text)

    def resolve_form_question(self, question_text: str, input_type: str, candidate: CandidateProfile = DEFAULT_CANDIDATE) -> FormAnswerResult:
        """Resolves custom recruiter questions using deterministic rules + Gemini semantic fallback."""
        lower_q = question_text.lower()
        
        # 1. Deterministic Rule Overrides for Legal & Knockout Traps
        if "sponsorship" in lower_q or "visa" in lower_q:
            return FormAnswerResult(
                field_label=question_text,
                inferred_value="No" if not candidate.requires_sponsorship_now else "Yes",
                confidence=1.0,
                is_knockout_risk=True,
                explanation="Deterministic override: Verified US citizen profile."
            )
            
        if "authorized to work" in lower_q or "legally authorized" in lower_q:
            return FormAnswerResult(
                field_label=question_text,
                inferred_value="Yes" if candidate.authorized_in_us else "No",
                confidence=1.0,
                is_knockout_risk=True,
                explanation="Deterministic override: Authorized in US."
            )

        if "salary" in lower_q or "compensation" in lower_q or "pay" in lower_q:
            return FormAnswerResult(
                field_label=question_text,
                inferred_value=str(candidate.desired_salary_min),
                confidence=0.95,
                is_knockout_risk=False,
                explanation="Target base salary floor formatted as integer."
            )

        # 2. Semantic Gemini Inference for Narrative Questions
        prompt = f"""
Answer this recruiter application form question accurately based ONLY on the verified candidate facts.

QUESTION: "{question_text}"
HTML FIELD TYPE: "{input_type}"
CANDIDATE FACTS: {candidate.model_dump_json()}

RULES:
- If asked for years of experience with a skill, return ONLY the raw integer (e.g. '5', not '5 years').
- Keep narrative answers concise and professional.
- Do not mention AI or prompts.
"""
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": FormAnswerResult,
            }
        )
        return FormAnswerResult.model_validate_json(response.text)
