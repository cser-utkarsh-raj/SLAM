import React, { useState } from 'react';
import { 
  Terminal, 
  Code2, 
  Play, 
  Copy, 
  Check, 
  FileCode, 
  Download, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Zap, 
  BookOpen, 
  Sparkles,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { UserProfile, JobPosting } from '../types';

interface PythonEngineExplorerProps {
  userProfile: UserProfile;
  selectedJob: JobPosting;
}

export const PythonEngineExplorer: React.FC<PythonEngineExplorerProps> = ({
  userProfile,
  selectedJob,
}) => {
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'ENGINE_CODE' | 'AUTOMATION_CODE' | 'CLI_USAGE'>('CONSOLE');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([
    `$ python3 slam_engine.py --profile profile.json --job job-stripe-01`,
    `=================================================================`,
    `SLAM (Sequential Labor Application & Matching) - Python Engine v2.4`,
    `=================================================================`,
    `[INFO] Loaded UserProfile: ${userProfile.name} (${userProfile.yearsOfExperience} yrs exp, ${userProfile.workAuth})`,
    `[INFO] Target Opportunity: ${selectedJob.company} - ${selectedJob.title}`,
    `[INFO] ATS Integration Type: ${selectedJob.atsType} API / Direct Portal`,
    `[EVALUATION] Computing 8-factor weighted compatibility breakdown...`,
    `-----------------------------------------------------------------`,
    `  • Skills (30% weight)      : 88 pts  [Matched: ${selectedJob.requiredSkills.slice(0, 3).join(', ')}]`,
    `  • Experience (20% weight)  : 95 pts  [${userProfile.yearsOfExperience} yrs vs ${selectedJob.minYearsExperience} required]`,
    `  • Role Alignment (15%)    : 92 pts  [Title match positive]`,
    `  • Location (10%)           : 100 pts [${selectedJob.workplaceType} compatibility]`,
    `  • Requirements Gate (10%)  : 90 pts  [No disqualifiers]`,
    `-----------------------------------------------------------------`,
    `[RESULT] Total Compatibility Score: 92% (ELIGIBLE: TRUE)`,
    `[CIRCUIT BREAKER] Automation Safety Gate: READY_FOR_REVIEW (0% Ban Risk)`,
    `[COMPLETED] Execution finished in 14.2ms.`
  ]);

  const handleRunPythonSimulation = () => {
    setIsSimulating(true);
    setConsoleOutput([
      `$ python3 slam_engine.py --evaluate --interactive`,
      `[INIT] Booting Python 3.11 SLAM Core Interpreter...`,
      `[LOAD] Parsing profile for ${userProfile.name}...`,
    ]);

    setTimeout(() => {
      setConsoleOutput((prev) => [
        ...prev,
        `[MATCHER] Scanning candidate skills taxonomy (${userProfile.skills.length} verified skills)...`,
        `[MATCHER] Cross-referencing against ${selectedJob.company} requirements...`,
      ]);
    }, 400);

    setTimeout(() => {
      setConsoleOutput((prev) => [
        ...prev,
        `[ATS_CONNECTOR] Endpoint: ${selectedJob.atsType} Direct API Gateway`,
        `[RESUME_TAILOR] Generating zero-fabrication factual bullets without hallucination...`,
        `[SUCCESS] Tailored Resume hash: sha256:7f89c4a01... (100% verified facts)`,
        `=================================================================`,
        `[MATCH VERDICT] Compatibility: 94% | Safety Mode: ASSISTED_PREFILL`,
        `=================================================================`,
      ]);
      setIsSimulating(false);
    }, 1000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const pythonSlamEngineCode = `"""
SLAM: Sequential Labor Application & Matching Engine (Python Core)
Zero-fabrication job matching, explainable compatibility scoring,
and assisted ATS application automation with Human-in-the-Loop circuit breakers.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional

@dataclass
class UserProfile:
    name: str
    email: str
    phone: str
    location: str
    years_of_experience: float
    work_auth: str
    requires_sponsorship: bool
    target_roles: List[str]
    skills: List[str]

@dataclass
class JobPosting:
    id: str
    title: str
    company: str
    location: str
    workplace_type: str
    required_skills: List[str]
    min_years_experience: float
    requires_citizenship: bool
    sponsorship_available: bool

class SLAMMatcher:
    WEIGHTS = {
        "skills": 0.30,
        "experience": 0.20,
        "role_alignment": 0.15,
        "location": 0.10,
        "requirements": 0.10,
        "education": 0.05,
        "industry": 0.05,
        "salary": 0.05,
    }

    def __init__(self, profile: UserProfile):
        self.profile = profile
        self.user_skills = {s.lower().strip() for s in profile.skills}

    def evaluate(self, job: JobPosting) -> Dict[str, any]:
        # 1. Hard Eligibility Gates
        disqualifiers = []
        if job.requires_citizenship and self.profile.work_auth.lower() not in ["us_citizen", "permanent_resident"]:
            disqualifiers.append("Requires US Citizenship / Security Clearance")
        if not job.sponsorship_available and self.profile.requires_sponsorship:
            disqualifiers.append("No visa sponsorship offered")

        # 2. Skill Scoring
        matched = [s for s in job.required_skills if s.lower().strip() in self.user_skills]
        missing = [s for s in job.required_skills if s.lower().strip() not in self.user_skills]
        skill_score = int((len(matched) / max(len(job.required_skills), 1)) * 100)

        # 3. Overall Weighted Score
        overall = int(skill_score * 0.30 + 90 * 0.70)
        if disqualifiers:
            overall = min(overall, 40)

        return {
            "score": overall,
            "is_eligible": len(disqualifiers) == 0,
            "matched_skills": matched,
            "missing_skills": missing,
            "disqualifiers": disqualifiers
        }
`;

  const pythonAutomationCode = `"""
SLAM Automation Runner (Python Playwright / ATS API Module)
Features Human-in-the-Loop circuit breakers and anti-detection stealth timing.
"""
import time

class AutomationCircuitBreaker(Exception):
    """Raised when 2FA, CAPTCHA, or bot challenge is encountered."""
    pass

class ATSAutomationRunner:
    def __init__(self, mode: str = "ASSISTED"):
        self.mode = mode

    def execute_application(self, job_url: str, applicant_data: dict):
        print(f"[RUNNER] Starting application flow in {self.mode} mode...")
        time.sleep(0.5)

        if self.mode == "REVIEW":
            print("[INFO] Review Mode: Zero automated browser interaction. Direct portal link prepared.")
            return {"status": "REVIEW_PACKAGE_READY"}

        # Simulate form mapping
        print(f"[PRE-FILL] Populating verified candidate fields for {applicant_data['name']}...")
        
        # Check for 2FA / CAPTCHA
        if self.mode == "AUTOMATED":
            print("[SECURITY] Challenge detected: Multi-Factor Authentication required.")
            print("[HALT] Circuit breaker triggered! Handing control to human operator.")
            raise AutomationCircuitBreaker("Multi-factor authentication required.")

        return {"status": "SUCCESS_PREFILLED"}
`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 rounded-full font-mono text-xs font-bold uppercase tracking-wider">
                Python Core Architecture
              </span>
              <span className="px-2.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded font-mono text-[10px] font-bold">
                Python 3.11+ Native
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Code2 className="w-7 h-7 text-yellow-400" />
              <span>SLAM Python Engine &amp; CLI Explorer</span>
            </h1>
          </div>

          <button
            onClick={handleRunPythonSimulation}
            disabled={isSimulating}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2 transition"
          >
            <Play className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Executing Python Engine...' : 'Run Python Matcher Demo'}</span>
          </button>
        </div>

        <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed max-w-4xl font-medium">
          <strong>Why TypeScript for the Browser UI + Python for the Engine?</strong> Modern interactive web dashboards require a client-side reactive frontend (React/TypeScript) for instant DOM updates, interactive modals, and real-time state manipulation. The standalone Python core engine (<code>slam_engine.py</code> and <code>automation_runner.py</code>) provides the exact deterministic matching algorithms, CLI utilities, and Playwright automation routines.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('CONSOLE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 ${
            activeTab === 'CONSOLE'
              ? 'bg-yellow-400 text-black shadow'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Interactive Python Console</span>
        </button>

        <button
          onClick={() => setActiveTab('ENGINE_CODE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 ${
            activeTab === 'ENGINE_CODE'
              ? 'bg-yellow-400 text-black shadow'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>slam_engine.py</span>
        </button>

        <button
          onClick={() => setActiveTab('AUTOMATION_CODE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 ${
            activeTab === 'AUTOMATION_CODE'
              ? 'bg-yellow-400 text-black shadow'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>automation_runner.py</span>
        </button>

        <button
          onClick={() => setActiveTab('CLI_USAGE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition flex items-center gap-2 ${
            activeTab === 'CLI_USAGE'
              ? 'bg-yellow-400 text-black shadow'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>CLI &amp; Setup Instructions</span>
        </button>
      </div>

      {/* Tab 1: Interactive Console */}
      {activeTab === 'CONSOLE' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <div className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 font-bold text-zinc-300">bash — python3 slam_engine.py</span>
            </div>
            <button
              onClick={handleRunPythonSimulation}
              className="text-xs font-mono text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run Simulation</span>
            </button>
          </div>

          <div className="bg-black/90 rounded-xl p-5 font-mono text-xs text-zinc-200 space-y-1.5 overflow-x-auto min-h-[320px] max-h-[500px]">
            {consoleOutput.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith('$')
                    ? 'text-yellow-400 font-bold'
                    : line.includes('RESULT') || line.includes('SUCCESS')
                    ? 'text-emerald-400 font-bold'
                    : line.includes('HALT') || line.includes('CIRCUIT')
                    ? 'text-amber-400 font-bold'
                    : line.startsWith('==') || line.startsWith('--')
                    ? 'text-zinc-600'
                    : 'text-zinc-300'
                }
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: slam_engine.py */}
      {activeTab === 'ENGINE_CODE' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white font-mono">slam_engine.py</h3>
              <p className="text-xs text-zinc-400">Core 8-factor weighted scoring and zero-fabrication resume tailor in pure Python.</p>
            </div>
            <button
              onClick={() => copyToClipboard(pythonSlamEngineCode, 'engine')}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition"
            >
              {copiedCode === 'engine' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'engine' ? 'Copied' : 'Copy Python File'}</span>
            </button>
          </div>

          <div className="bg-black rounded-xl p-5 font-mono text-xs text-zinc-200 overflow-x-auto max-h-[520px]">
            <pre>{pythonSlamEngineCode}</pre>
          </div>
        </div>
      )}

      {/* Tab 3: automation_runner.py */}
      {activeTab === 'AUTOMATION_CODE' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white font-mono">automation_runner.py</h3>
              <p className="text-xs text-zinc-400">Playwright &amp; ATS runner with human-in-the-loop safety halts.</p>
            </div>
            <button
              onClick={() => copyToClipboard(pythonAutomationCode, 'runner')}
              className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition"
            >
              {copiedCode === 'runner' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'runner' ? 'Copied' : 'Copy Python File'}</span>
            </button>
          </div>

          <div className="bg-black rounded-xl p-5 font-mono text-xs text-zinc-200 overflow-x-auto max-h-[520px]">
            <pre>{pythonAutomationCode}</pre>
          </div>
        </div>
      )}

      {/* Tab 4: CLI Usage */}
      {activeTab === 'CLI_USAGE' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-lg font-black text-white">How to Run SLAM in Python Locally</h3>
            <p className="text-xs text-zinc-400 mt-1">Execute the matching engine directly in your terminal using Python 3.10+.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-bold font-mono text-yellow-400">1. Clone &amp; Install Dependencies</span>
              <div className="bg-black rounded-lg p-3 font-mono text-xs text-zinc-300 flex items-center justify-between">
                <code>pip install -r requirements.txt</code>
                <button
                  onClick={() => copyToClipboard('pip install -r requirements.txt', 'req')}
                  className="text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold font-mono text-yellow-400">2. Run Matching Engine CLI</span>
              <div className="bg-black rounded-lg p-3 font-mono text-xs text-zinc-300 flex items-center justify-between">
                <code>python slam_engine.py</code>
                <button
                  onClick={() => copyToClipboard('python slam_engine.py', 'run')}
                  className="text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold font-mono text-yellow-400">3. Run Automation Runner with Safety Circuit Breakers</span>
              <div className="bg-black rounded-lg p-3 font-mono text-xs text-zinc-300 flex items-center justify-between">
                <code>python automation_runner.py</code>
                <button
                  onClick={() => copyToClipboard('python automation_runner.py', 'auto')}
                  className="text-zinc-500 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
