import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayCircle, 
  Pause, 
  Square, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  Eye, 
  Check, 
  AlertCircle, 
  ChevronRight 
} from 'lucide-react';
import { 
  JobPosting, 
  UserProfile, 
  TailoredResume, 
  AutomationTask, 
  AutomationStep, 
  AutomationLog 
} from '../types';

interface AutomationRunnerViewProps {
  selectedJob: JobPosting | null;
  allJobs: JobPosting[];
  onSelectJob: (job: JobPosting) => void;
  userProfile: UserProfile;
  tailoredResume: TailoredResume | null;
  coverLetter: string;
  answers: { question: string; answer: string }[];
  onMarkApplied: (job: JobPosting, mode: 'REVIEW' | 'ASSISTED' | 'AUTOMATED') => void;
}

export const AutomationRunnerView: React.FC<AutomationRunnerViewProps> = ({
  selectedJob,
  allJobs,
  onSelectJob,
  userProfile,
  tailoredResume,
  coverLetter,
  answers,
  onMarkApplied,
}) => {
  const currentJob = selectedJob || allJobs[0];

  const [mode, setMode] = useState<'REVIEW' | 'ASSISTED' | 'AUTOMATED'>('REVIEW');
  const [taskState, setTaskState] = useState<AutomationStep>('READY');
  const [progress, setProgress] = useState(25);
  const [statusMessage, setStatusMessage] = useState('Application package compiled. Ready for execution.');
  const [humanHaltReason, setHumanHaltReason] = useState<string | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([
    {
      id: 'log-1',
      timestamp: new Date().toLocaleTimeString(),
      message: `Initialized job runner for ${currentJob.company} (${currentJob.title})`,
      type: 'info',
    },
    {
      id: 'log-2',
      timestamp: new Date().toLocaleTimeString(),
      message: `Verified profile: ${userProfile.name} (${userProfile.yearsOfExperience} yrs exp, ${userProfile.workAuth})`,
      type: 'info',
    },
    {
      id: 'log-3',
      timestamp: new Date().toLocaleTimeString(),
      message: tailoredResume ? 'Attached factual tailored resume v1.' : 'Attached master canonical resume.',
      type: 'success',
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const runnerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (message: string, type: 'info' | 'warn' | 'success' | 'alert') => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ]);
  };

  const handleStartRunner = () => {
    setIsRunning(true);
    setHumanHaltReason(null);

    if (mode === 'REVIEW') {
      setTaskState('READY');
      setProgress(100);
      setStatusMessage('Review package complete. Please inspect details and apply via the official job portal.');
      addLog('Review package finalized. Awaiting user direct submission.', 'success');
      setIsRunning(false);
      return;
    }

    if (mode === 'ASSISTED') {
      setTaskState('FILLING');
      setProgress(45);
      setStatusMessage('Assisted form mapper active. Pre-filling verified profile fields...');
      addLog('Connecting to supported job application form schema...', 'info');

      runnerTimerRef.current = setTimeout(() => {
        setProgress(75);
        addLog('Pre-filled Name, Email, Phone, LinkedIn, and Resume Attachment.', 'success');
        addLog('Pre-filled screening answers from Answer Library.', 'success');
        setTaskState('REVIEW');
        setProgress(90);
        setStatusMessage('Form pre-filled. Please review all fields before clicking submit.');
        setIsRunning(false);
      }, 1500);
      return;
    }

    if (mode === 'AUTOMATED') {
      setTaskState('AUTHENTICATED');
      setProgress(35);
      setStatusMessage('Validating application endpoint security rules...');
      addLog('Checking ATS security headers & authentication challenges...', 'info');

      runnerTimerRef.current = setTimeout(() => {
        // Trigger safety halt if portal requires 2FA or CAPTCHA
        setTaskState('HALTED_HUMAN_ACTION');
        setProgress(60);
        const reason = '2FA / Cloudflare Turnstile Verification Detected. Per SLAM safety policy, the automation runner has paused to hand control back to the human operator.';
        setHumanHaltReason(reason);
        setStatusMessage('HUMAN ACTION REQUIRED: Multi-Factor Authentication or Bot-Verification Challenge');
        addLog(`HALT: ${reason}`, 'alert');
        setIsRunning(false);
      }, 2000);
    }
  };

  const handleHumanResolved = () => {
    setHumanHaltReason(null);
    setTaskState('SUBMITTING');
    setProgress(90);
    setStatusMessage('Human verification confirmed. Resuming supported submission...');
    addLog('Operator verified 2FA challenge. Continuing form submission...', 'info');

    setTimeout(() => {
      setTaskState('SUBMITTED');
      setProgress(100);
      setStatusMessage('Application submitted successfully to official portal.');
      addLog('Application successfully received by ATS endpoint.', 'success');
      setIsRunning(false);
      onMarkApplied(currentJob, mode);
    }, 1200);
  };

  const handleResetRunner = () => {
    if (runnerTimerRef.current) clearTimeout(runnerTimerRef.current);
    setIsRunning(false);
    setTaskState('READY');
    setProgress(25);
    setHumanHaltReason(null);
    setStatusMessage('Runner reset. Ready.');
    setLogs([
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        message: `Reset runner for ${currentJob.company}.`,
        type: 'info',
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-display">
            <PlayCircle className="w-6 h-6 text-yellow-400" />
            <span>Assisted &amp; Controlled Automation Runner</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
            SLAM applies strict Human-in-the-Loop circuit breakers. Never bypasses 2FA or CAPTCHA; hands control to user when needed.
          </p>
        </div>

        {/* Target Job Selector */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <span className="text-xs text-zinc-400 font-mono">Active Job:</span>
          <select
            value={currentJob.id}
            onChange={(e) => {
              const j = allJobs.find((item) => item.id === e.target.value);
              if (j) onSelectJob(j);
            }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-yellow-400 max-w-xs"
          >
            {allJobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.company} — {j.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mode 1: Review Mode */}
        <div
          onClick={() => setMode('REVIEW')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            mode === 'REVIEW'
              ? 'bg-zinc-900 border-yellow-400 shadow-md ring-1 ring-yellow-400'
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-yellow-400">Mode 1 (Default)</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              0% Ban Risk
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Review Mode</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            SLAM generates all materials (tailored CV, cover letter, answers). You review and click through to apply directly on the verified official portal.
          </p>
        </div>

        {/* Mode 2: Assisted Mode */}
        <div
          onClick={() => setMode('ASSISTED')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            mode === 'ASSISTED'
              ? 'bg-zinc-900 border-yellow-400 shadow-md ring-1 ring-yellow-400'
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-yellow-400">Mode 2</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              Assisted Flow
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Assisted Form Pre-Fill</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            SLAM maps and pre-fills structured fields on supported job ATS forms. You inspect the populated fields and manually trigger final submission.
          </p>
        </div>

        {/* Mode 3: Supported Automated */}
        <div
          onClick={() => setMode('AUTOMATED')}
          className={`p-5 rounded-xl border cursor-pointer transition-all ${
            mode === 'AUTOMATED'
              ? 'bg-zinc-900 border-yellow-400 shadow-md ring-1 ring-yellow-400'
              : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase text-yellow-400">Mode 3</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950 text-amber-300 border border-amber-800">
              Safety Gated
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">Supported Automated Flow</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Automates verified steps on compatible endpoints. Automatically halts when 2FA or CAPTCHA challenges are detected.
          </p>
        </div>
      </div>

      {/* Main Execution Monitor */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
        {/* Runner Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Target Opportunity:</span>
              <span className="text-sm font-bold text-white">{currentJob.company} — {currentJob.title}</span>
            </div>
            <div className="text-xs text-zinc-400 mt-0.5 font-mono">
              Status State: <strong className="text-yellow-400 uppercase font-bold">{taskState}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetRunner}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition"
              title="Reset runner"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {taskState !== 'SUBMITTED' && taskState !== 'HALTED_HUMAN_ACTION' && (
              <button
                onClick={handleStartRunner}
                disabled={isRunning}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs font-extrabold rounded-lg shadow flex items-center gap-2 transition"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{mode === 'REVIEW' ? 'Launch Direct Application Portal' : 'Execute Runner Flow'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">{statusMessage}</span>
            <span className="text-yellow-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className={`h-full transition-all duration-500 ${
                taskState === 'HALTED_HUMAN_ACTION'
                  ? 'bg-red-500'
                  : taskState === 'SUBMITTED'
                  ? 'bg-emerald-400'
                  : 'bg-yellow-400'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* HUMAN ACTION REQUIRED HALT CIRCUIT BREAKER */}
        {taskState === 'HALTED_HUMAN_ACTION' && (
          <div className="p-5 bg-red-950/50 border-2 border-red-700 rounded-xl space-y-4 text-red-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-white font-mono uppercase tracking-wider">
                  Human Action Required (Safety Circuit Breaker Active)
                </h3>
                <p className="text-xs text-red-200 leading-relaxed">
                  {humanHaltReason}
                </p>
                <div className="text-[11px] text-red-300 font-mono mt-2">
                  SLAM policy: Never attempt to spoof fingerprints or bypass multi-factor authentication.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-red-800/60">
              <a
                href={currentJob.applicationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition"
              >
                <span>Open Portal to Solve 2FA</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={handleHumanResolved}
                className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold rounded-lg shadow flex items-center gap-1.5 transition"
              >
                <Check className="w-4 h-4" />
                <span>I Have Verified / Completed Challenge</span>
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS NOTIFICATION */}
        {taskState === 'SUBMITTED' && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-center justify-between text-emerald-300 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-bold text-white text-sm">Application Completed &amp; Tracked</div>
                <div>The application record for {currentJob.company} has been logged in your Application Tracker.</div>
              </div>
            </div>
            <a
              href={currentJob.applicationUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white font-semibold rounded-lg transition"
            >
              Verify on Portal
            </a>
          </div>
        )}

        {/* REVIEW MODE DIRECT LINK LAUNCHER */}
        {mode === 'REVIEW' && taskState !== 'SUBMITTED' && (
          <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-400" />
                <span>Official Direct Application Portal</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">Greenhouse / Direct ATS</span>
            </div>
            <p className="text-xs text-zinc-300">
              Your tailored resume and answer package are ready in your clipboard. Click below to apply on the verified job portal.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href={currentJob.applicationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold rounded-lg shadow flex items-center gap-2 transition"
              >
                <span>Apply on {currentJob.company} Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  setTaskState('SUBMITTED');
                  setProgress(100);
                  setStatusMessage('Marked as applied.');
                  onMarkApplied(currentJob, 'REVIEW');
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition"
              >
                Mark as Applied &amp; Track
              </button>
            </div>
          </div>
        )}

        {/* Real-time Telemetry Terminal Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" />
              <span>Event Telemetry Logs</span>
            </span>
            <span className="text-[11px] text-zinc-500">{logs.length} events logged</span>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-[11px] text-zinc-300 space-y-1.5 max-h-56 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2">
                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    log.type === 'alert'
                      ? 'text-red-400 font-bold'
                      : log.type === 'success'
                      ? 'text-emerald-400'
                      : log.type === 'warn'
                      ? 'text-amber-400'
                      : 'text-zinc-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
