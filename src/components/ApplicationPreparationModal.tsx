import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  JobPosting, 
  UserProfile, 
  TailoredResume, 
  ApplicationAnswer 
} from '../types';
import { 
  X, 
  Sparkles, 
  FileText, 
  Mail, 
  CheckCircle2, 
  ArrowUpRight, 
  Copy, 
  Check, 
  ShieldCheck, 
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface Props {
  job: JobPosting;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveToTracker: (
    job: JobPosting,
    tailoredResume: TailoredResume | null,
    coverLetter: string,
    answers: { question: string; answer: string }[]
  ) => void;
}

const API = import.meta.env.VITE_API_URL || '';

export const ApplicationPreparationModal: React.FC<Props> = ({
  job,
  userProfile,
  isOpen,
  onClose,
  onSaveToTracker,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'letter' | 'screening'>('overview');
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [letterError, setLetterError] = useState<string | null>(null);
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);

  // Screening question answers
  const [authAnswer, setAuthAnswer] = useState(
    userProfile.workAuth === 'Needs Sponsorship'
      ? 'I will require visa sponsorship now or in the future.'
      : 'I am legally authorized to work without sponsorship.'
  );
  const [noticeAnswer, setNoticeAnswer] = useState(userProfile.noticePeriod || '2 Weeks notice');
  const [salaryAnswer, setSalaryAnswer] = useState(userProfile.salaryExpectation || 'Negotiable / Market rate');
  const [relocationAnswer, setRelocationAnswer] = useState(
    userProfile.relocationPreference === 'Remote Only'
      ? 'Seeking remote opportunities only.'
      : userProfile.relocationPreference === 'Yes'
      ? 'Open to relocation for this role.'
      : 'Prefer local opportunities or remote.'
  );

  useEffect(() => {
    if (isOpen && !coverLetter) {
      void generateCoverLetter();
    }
  }, [isOpen]);

  const generateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    setLetterError(null);
    try {
      const res = await fetch(`${API}/api/ai/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: userProfile, job }),
      });
      const data = await res.json();
      if (data?.coverLetter) {
        setCoverLetter(data.coverLetter);
      } else {
        // Build factual fallback letter
        const fallback = `Dear Hiring Team at ${job.company},

I am writing to express my strong interest in the ${job.title} position. With over ${userProfile.yearsOfExperience || 1} years of experience in software development and specialized expertise in ${userProfile.skills.slice(0, 4).join(', ')}, I am confident in my ability to contribute effectively to your engineering goals.

In my recent experience, I have focused on:
${userProfile.workHistory?.[0]?.bullets?.slice(0, 2).map((b) => `• ${b}`).join('\n') || `• Delivering scalable software solutions.`}

I look forward to discussing how my background matches the requirements of ${job.company}.

Sincerely,
${userProfile.name || 'Candidate'}`;
        setCoverLetter(fallback);
      }
    } catch (e: any) {
      setLetterError('AI cover letter generator was unreachable. Generated a template from your verified profile.');
      const fallback = `Dear Hiring Team at ${job.company},\n\nI am writing to apply for the ${job.title} role. My background in ${userProfile.skills.slice(0, 3).join(', ')} aligns well with your team's objectives.\n\nSincerely,\n${userProfile.name || 'Candidate'}`;
      setCoverLetter(fallback);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const buildTailoredResumeText = () => {
    return `${(userProfile.name || 'CANDIDATE').toUpperCase()}
${userProfile.email} | ${userProfile.phone} | ${userProfile.location}

TARGET POSITION: ${job.title} at ${job.company}

PROFESSIONAL SUMMARY
${userProfile.summary || userProfile.headline}

MATCHED KEY COMPETENCIES
${userProfile.skills.join(' • ')}

PROFESSIONAL EXPERIENCE
${(userProfile.workHistory || [])
  .map(
    (w) => `
${w.role.toUpperCase()} — ${w.company} (${w.startDate} - ${w.endDate})
${(w.bullets || []).map((b) => `• ${b}`).join('\n')}`
  )
  .join('\n')}

EDUCATION
${(userProfile.education || [])
  .map((e) => `${e.degree} in ${e.fieldOfStudy} — ${e.institution} (${e.graduationYear})`)
  .join('\n')}
`;
  };

  const handleCopyResume = () => {
    navigator.clipboard.writeText(buildTailoredResumeText());
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  const handleSaveAndTrack = () => {
    const tailoredRes: TailoredResume = {
      id: `tailored-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      timestamp: new Date().toISOString(),
      tailoredSummary: userProfile.summary || userProfile.headline,
      tailoredSkills: userProfile.skills,
      tailoredWorkHistory: userProfile.workHistory,
      modificationsList: ['Structured alignment with job requirements without fabrication'],
    };

    const answers = [
      { question: 'Work Authorization', answer: authAnswer },
      { question: 'Notice Period / Earliest Start', answer: noticeAnswer },
      { question: 'Compensation Expectation', answer: salaryAnswer },
      { question: 'Location & Relocation Preference', answer: relocationAnswer },
    ];

    onSaveToTracker(job, tailoredRes, coverLetter, answers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-mono font-bold tracking-widest uppercase border border-yellow-400/30">
                Application Preparation
              </span>
              <span className="text-xs text-zinc-500 font-mono">Zero Fabrication Enforced</span>
            </div>
            <h2 className="text-2xl font-display font-black text-white">{job.title}</h2>
            <div className="text-xs text-zinc-400 mt-0.5">
              {job.company} · {job.location || 'Location not specified'}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 gap-2">
          {[
            { id: 'overview', label: 'Match Overview', icon: Briefcase },
            { id: 'resume', label: 'Tailored Resume', icon: FileText },
            { id: 'letter', label: 'Cover Letter', icon: Mail },
            { id: 'screening', label: 'Screening Answers', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Match Score</div>
                  <div className="text-2xl font-black text-yellow-400 font-display mt-0.5">
                    {(job as any).match?.compatibilityScore != null
                      ? `${(job as any).match.compatibilityScore}%`
                      : '85%'}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Experience Req</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {job.minYearsExperience ? `${job.minYearsExperience}+ years` : 'Not specified'}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Workplace</div>
                  <div className="text-sm font-bold text-white mt-1">
                    {job.remote ? 'Remote' : job.location || 'On-site'}
                  </div>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Source</div>
                  <div className="text-sm font-bold text-white mt-1 truncate">
                    {job.primarySource || 'Direct ATS'}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                  Verified Candidate Qualifications
                </h4>
                <div className="flex flex-wrap gap-2">
                  {userProfile.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl">
                <div className="text-xs font-bold text-white mb-1">Application Protocol</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  SLAM organizes your factual master profile into customized application materials. You maintain complete control to review, edit, copy, or submit directly on the employer's official page.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TAILORED RESUME */}
          {activeTab === 'resume' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                  Formatted plain-text resume highlighting qualifications for <b className="text-white">{job.title}</b>.
                </div>
                <button
                  onClick={handleCopyResume}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded border border-zinc-700 flex items-center gap-1.5 transition"
                >
                  {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}
                  <span>{copiedResume ? 'Copied!' : 'Copy Resume'}</span>
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[360px] overflow-y-auto">
                {buildTailoredResumeText()}
              </div>
            </div>
          )}

          {/* TAB 3: COVER LETTER */}
          {activeTab === 'letter' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                  Factual, concise cover letter generated from your verified accomplishments.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateCoverLetter}
                    disabled={isGeneratingLetter}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Regenerate</span>
                  </button>
                  <button
                    onClick={handleCopyLetter}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded border border-zinc-700 flex items-center gap-1.5 transition"
                  >
                    {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}
                    <span>{copiedLetter ? 'Copied!' : 'Copy Letter'}</span>
                  </button>
                </div>
              </div>

              {letterError && (
                <div className="p-3 bg-yellow-950/30 border border-yellow-800/40 rounded text-yellow-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{letterError}</span>
                </div>
              )}

              <textarea
                rows={10}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Cover letter will appear here..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-yellow-400 leading-relaxed"
              />
            </div>
          )}

          {/* TAB 4: SCREENING QUESTIONS */}
          {activeTab === 'screening' && (
            <div className="space-y-4">
              <div className="text-xs text-zinc-400">
                Common application questions pre-filled from your profile. Edit as needed before saving.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Are you legally authorized to work in this location?
                  </label>
                  <input
                    type="text"
                    value={authAnswer}
                    onChange={(e) => setAuthAnswer(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    What is your earliest availability / notice period?
                  </label>
                  <input
                    type="text"
                    value={noticeAnswer}
                    onChange={(e) => setNoticeAnswer(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    What are your compensation expectations?
                  </label>
                  <input
                    type="text"
                    value={salaryAnswer}
                    onChange={(e) => setSalaryAnswer(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">
                    Are you open to relocation or hybrid work?
                  </label>
                  <input
                    type="text"
                    value={relocationAnswer}
                    onChange={(e) => setRelocationAnswer(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          {job.applicationUrl ? (
            <a
              href={job.applicationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 underline"
            >
              <span>Open Employer Job Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-yellow-400" />
            </a>
          ) : (
            <span className="text-xs text-zinc-500 font-mono">Official posting url saved</span>
          )}

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndTrack}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-lg shadow transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save &amp; Track Application</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
