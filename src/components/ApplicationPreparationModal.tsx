import React, { useEffect, useState } from 'react';
import { JobPosting, UserProfile, TailoredResume } from '../types';
import { X, Sparkles, FileText, Mail, CheckCircle2, Copy, Check, ShieldCheck, Briefcase, AlertCircle } from 'lucide-react';

interface Props {
  job: JobPosting;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveToTracker: (job: JobPosting, tailoredResume: TailoredResume | null, coverLetter: string, answers: { question: string; answer: string }[]) => void;
}

const API = import.meta.env.VITE_API_URL || '';

const authFromProfile = (value: UserProfile['workAuth']) => {
  if (value === 'Authorized') return 'I am legally authorized to work without sponsorship.';
  if (value === 'Needs Sponsorship') return 'I will require visa sponsorship now or in the future.';
  if (value === 'Citizen/PR') return 'I am a citizen or permanent resident and do not require sponsorship.';
  return '';
};

const relocationFromProfile = (value: UserProfile['relocationPreference']) => {
  if (value === 'Remote Only') return 'Seeking remote opportunities only.';
  if (value === 'Yes') return 'Open to relocation for this role.';
  if (value === 'No') return 'Prefer local opportunities or remote work.';
  return '';
};

export const ApplicationPreparationModal: React.FC<Props> = ({ job, userProfile, isOpen, onClose, onSaveToTracker }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'letter' | 'screening'>('overview');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [letterError, setLetterError] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [authAnswer, setAuthAnswer] = useState(() => authFromProfile(userProfile.workAuth));
  const [noticeAnswer, setNoticeAnswer] = useState(() => userProfile.noticePeriod || '');
  const [salaryAnswer, setSalaryAnswer] = useState(() => userProfile.salaryExpectation || '');
  const [relocationAnswer, setRelocationAnswer] = useState(() => relocationFromProfile(userProfile.relocationPreference));

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('overview');
    setCoverLetter('');
    setLetterError('');
    setAuthAnswer(authFromProfile(userProfile.workAuth));
    setNoticeAnswer(userProfile.noticePeriod || '');
    setSalaryAnswer(userProfile.salaryExpectation || '');
    setRelocationAnswer(relocationFromProfile(userProfile.relocationPreference));
  }, [isOpen, job.id, userProfile.workAuth, userProfile.noticePeriod, userProfile.salaryExpectation, userProfile.relocationPreference]);

  const generateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    setLetterError('');
    try {
      const response = await fetch(`${API}/api/ai/cover-letter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: userProfile, job }) });
      const data = await response.json();
      if (!response.ok || !data?.coverLetter) throw new Error(data?.detail || 'The AI cover-letter service is unavailable.');
      setCoverLetter(String(data.coverLetter));
    } catch (error) {
      setCoverLetter('');
      setLetterError(error instanceof Error ? error.message : 'No verified cover letter could be generated. Nothing was fabricated.');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const buildResumeText = () => {
    const name = userProfile.name || 'NAME NOT PROVIDED';
    const contact = [userProfile.email, userProfile.phone, userProfile.location].filter(Boolean).join(' | ') || 'CONTACT DETAILS NOT PROVIDED';
    const summary = userProfile.summary || userProfile.headline || 'PROFESSIONAL SUMMARY NOT PROVIDED';
    const skills = userProfile.skills.length ? userProfile.skills.join(' • ') : 'SKILLS NOT PROVIDED';
    const experience = userProfile.workHistory.length ? userProfile.workHistory.map((w) => `\n${w.role || 'ROLE NOT PROVIDED'} — ${w.company || 'COMPANY NOT PROVIDED'} (${w.startDate || '?'} - ${w.endDate || 'Present'})\n${(w.bullets || []).map((b) => `• ${b}`).join('\n')}`).join('\n') : 'WORK HISTORY NOT PROVIDED';
    const education = userProfile.education.length ? userProfile.education.map((e) => `${e.degree || 'Degree not provided'}${e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''} — ${e.institution || 'Institution not provided'}${e.graduationYear ? ` (${e.graduationYear})` : ''}`).join('\n') : 'EDUCATION NOT PROVIDED';
    return `${name.toUpperCase()}\n${contact}\n\nTARGET POSITION\n${job.title} at ${job.company}\n\nPROFESSIONAL SUMMARY\n${summary}\n\nSKILLS\n${skills}\n\nPROFESSIONAL EXPERIENCE\n${experience}\n\nEDUCATION\n${education}`;
  };

  const copy = async (text: string, kind: 'letter' | 'resume') => {
    await navigator.clipboard.writeText(text);
    if (kind === 'letter') { setCopiedLetter(true); setTimeout(() => setCopiedLetter(false), 2000); }
    else { setCopiedResume(true); setTimeout(() => setCopiedResume(false), 2000); }
  };

  const saveAndTrack = () => {
    const tailoredResume: TailoredResume = {
      id: `tailored-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      timestamp: new Date().toISOString(),
      tailoredSummary: userProfile.summary || userProfile.headline,
      tailoredSkills: userProfile.skills,
      tailoredWorkHistory: userProfile.workHistory,
      modificationsList: ['Reformatted verified profile data for this role; no qualifications were added.'],
    };
    const answers = [
      ['Work Authorization', authAnswer],
      ['Notice Period / Earliest Start', noticeAnswer],
      ['Compensation Expectation', salaryAnswer],
      ['Location & Relocation Preference', relocationAnswer],
    ].filter(([, answer]) => answer.trim()).map(([question, answer]) => ({ question, answer }));
    onSaveToTracker(job, tailoredResume, coverLetter, answers);
    onClose();
  };

  if (!isOpen) return null;
  const score = (job as any).match?.compatibilityScore;

  return <div className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <div className="p-6 border-b border-zinc-800 flex items-start justify-between bg-zinc-950/80"><div><div className="flex items-center gap-2 mb-1"><span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-mono font-bold tracking-widest uppercase border border-yellow-400/30">Application Preparation</span><span className="text-xs text-zinc-500 font-mono">Verified data only</span></div><h2 className="text-2xl font-display font-black text-white">{job.title}</h2><div className="text-xs text-zinc-400 mt-0.5">{job.company} · {job.location || 'Location not specified'}</div></div><button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800"><X className="w-5 h-5" /></button></div>

      <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 gap-2 overflow-x-auto">{[['overview','Match Overview',Briefcase],['resume','Resume',FileText],['letter','Cover Letter',Mail],['screening','Screening',ShieldCheck]].map(([id,label,Icon]) => <button key={String(id)} onClick={() => setActiveTab(id as any)} className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap ${activeTab === id ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' : 'border-transparent text-zinc-400'}`}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {activeTab === 'overview' && <div className="space-y-6"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg"><div className="text-[10px] font-mono text-zinc-500 uppercase">Match Score</div><div className="text-2xl font-black text-yellow-400 font-display mt-0.5">{typeof score === 'number' ? `${score}%` : '—'}</div></div><div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg"><div className="text-[10px] font-mono text-zinc-500 uppercase">Experience</div><div className="text-sm font-bold text-white mt-1">{job.minYearsExperience ? `${job.minYearsExperience}+ years` : 'Not specified'}</div></div><div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg"><div className="text-[10px] font-mono text-zinc-500 uppercase">Workplace</div><div className="text-sm font-bold text-white mt-1">{job.remote ? 'Remote' : job.location || 'Not specified'}</div></div><div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg"><div className="text-[10px] font-mono text-zinc-500 uppercase">Source</div><div className="text-sm font-bold text-white mt-1 truncate">{job.primarySource || 'Not specified'}</div></div></div><div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5"><h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-3">Verified Candidate Skills</h4>{userProfile.skills.length ? <div className="flex flex-wrap gap-2">{userProfile.skills.map((s) => <span key={s} className="px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 rounded-md flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" />{s}</span>)}</div> : <div className="text-xs text-zinc-500">No skills have been verified yet.</div>}</div><div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl"><div className="text-xs font-bold text-white mb-1">Submission control</div><p className="text-xs text-zinc-400 leading-relaxed">SLAM prepares material from your verified profile. Review it yourself and submit through the employer's official application page.</p></div></div>}

        {activeTab === 'resume' && <div className="space-y-4"><div className="flex items-center justify-between"><div className="text-xs text-zinc-400">Formatted from the profile facts currently stored in SLAM.</div><button onClick={() => void copy(buildResumeText(),'resume')} className="px-3 py-1.5 bg-zinc-800 text-xs font-bold text-white rounded border border-zinc-700 flex items-center gap-1.5">{copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}{copiedResume ? 'Copied!' : 'Copy Resume'}</button></div><pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">{buildResumeText()}</pre></div>}

        {activeTab === 'letter' && <div className="space-y-4"><div className="flex items-center justify-between"><div className="text-xs text-zinc-400">AI-generated only when the model can ground it in supplied facts.</div><div className="flex gap-2"><button onClick={() => void generateCoverLetter()} disabled={isGeneratingLetter} className="px-3 py-1.5 bg-zinc-800 disabled:opacity-50 text-xs font-semibold text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-yellow-400" />{isGeneratingLetter ? 'Generating…' : 'Generate'}</button><button onClick={() => void copy(coverLetter,'letter')} disabled={!coverLetter} className="px-3 py-1.5 bg-zinc-800 disabled:opacity-40 text-xs font-bold text-white rounded border border-zinc-700 flex items-center gap-1.5">{copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}{copiedLetter ? 'Copied!' : 'Copy'}</button></div></div>{letterError && <div className="p-3 bg-yellow-950/30 border border-yellow-800/40 rounded text-yellow-300 text-xs flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0" /><span>{letterError}</span></div>}<textarea rows={12} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="No letter generated yet. Click Generate." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-yellow-400 leading-relaxed" /></div>}

        {activeTab === 'screening' && <div className="space-y-5"><div className="p-4 bg-yellow-950/20 border border-yellow-900/50 rounded-xl text-xs text-yellow-200">Only submit an answer when it is explicitly supported by your profile. Blank means you have not provided the fact yet.</div><label className="block text-xs text-zinc-400">Work Authorization<input value={authAnswer} onChange={(e) => setAuthAnswer(e.target.value)} placeholder="Not provided" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white" /></label><label className="block text-xs text-zinc-400">Notice Period / Earliest Start<input value={noticeAnswer} onChange={(e) => setNoticeAnswer(e.target.value)} placeholder="Not provided" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white" /></label><label className="block text-xs text-zinc-400">Compensation Expectation<input value={salaryAnswer} onChange={(e) => setSalaryAnswer(e.target.value)} placeholder="Not provided" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white" /></label><label className="block text-xs text-zinc-400">Location & Relocation Preference<input value={relocationAnswer} onChange={(e) => setRelocationAnswer(e.target.value)} placeholder="Not provided" className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-white" /></label></div>}
      </div>

      <div className="p-5 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between gap-4"><div className="text-[11px] text-zinc-500 font-mono">Nothing here is auto-submitted.</div><button onClick={saveAndTrack} className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase rounded-lg">Save Preparation</button></div>
    </div>
  </div>;
};
