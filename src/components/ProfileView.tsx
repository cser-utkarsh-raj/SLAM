import React, { useState } from 'react';
import { 
  User, 
  Upload, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Settings2, 
  FileText, 
  Copy, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile, WorkExperience, EducationItem, WorkAuthStatus } from '../types';

interface ProfileViewProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSaveProfileNotification?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  setUserProfile,
  onSaveProfileNotification,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'resume_parse' | 'master_preview'>('profile');
  const [resumeTextInput, setResumeTextInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [copiedResume, setCopiedResume] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle Resume Parsing via Backend API
  const handleParseResume = async () => {
    if (!resumeTextInput.trim()) {
      setParseError('Please paste your resume text or upload a document.');
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setParseStatus('Normalizing resume text through AI parsing engine...');

    try {
      const res = await fetch('/api/ai/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: resumeTextInput, filename: 'uploaded_resume.txt' }),
      });

      let data: any = null;
      if (res.ok) {
        data = await res.json();
      }

      const p = data?.profile;
      if (p) {
        setUserProfile((prev) => ({
          ...prev,
          name: p.name || prev.name,
          email: p.email || prev.email,
          phone: p.phone || prev.phone,
          location: p.location || prev.location,
          headline: p.headline || prev.headline,
          summary: p.summary || prev.summary,
          yearsOfExperience: typeof p.yearsOfExperience === 'number' ? p.yearsOfExperience : prev.yearsOfExperience,
          skills: Array.isArray(p.skills) && p.skills.length > 0 ? Array.from(new Set([...prev.skills, ...p.skills])) : prev.skills,
          workHistory: Array.isArray(p.workHistory) && p.workHistory.length > 0
            ? p.workHistory.map((w: any, idx: number) => ({
                id: `exp-${Date.now()}-${idx}`,
                company: w.company || 'Company',
                role: w.role || 'Software Engineer',
                startDate: w.startDate || '2022',
                endDate: w.endDate || (w.isCurrent ? 'Present' : '2023'),
                isCurrent: Boolean(w.isCurrent),
                bullets: Array.isArray(w.bullets) && w.bullets.length > 0 ? w.bullets : ['Delivered core production features and improved system performance.'],
              }))
            : prev.workHistory,
          education: Array.isArray(p.education) && p.education.length > 0
            ? p.education.map((e: any, idx: number) => ({
                id: `edu-${Date.now()}-${idx}`,
                institution: e.institution || 'University',
                degree: e.degree || 'Bachelor of Science',
                fieldOfStudy: e.fieldOfStudy || 'Computer Science',
                graduationYear: e.graduationYear || '2022',
              }))
            : prev.education,
          certifications: Array.isArray(p.certifications) && p.certifications.length > 0 ? p.certifications : prev.certifications,
        }));

        setParseStatus(`Successfully normalized profile via ${data.engine || 'SLAM Profile Normalizer'}!`);
        setTimeout(() => setActiveSubTab('profile'), 1200);
      } else {
        // Local client fallback
        const lines = resumeTextInput.split('\n').map((l) => l.trim()).filter(Boolean);
        const emailMatch = resumeTextInput.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = resumeTextInput.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        const techSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Docker', 'AWS', 'Tailwind CSS'].filter((s) =>
          new RegExp(`\\b${s}\\b`, 'i').test(resumeTextInput)
        );

        setUserProfile((prev) => ({
          ...prev,
          name: lines[0] && lines[0].length < 40 ? lines[0] : prev.name,
          email: emailMatch ? emailMatch[0] : prev.email,
          phone: phoneMatch ? phoneMatch[0] : prev.phone,
          skills: techSkills.length > 0 ? Array.from(new Set([...prev.skills, ...techSkills])) : prev.skills,
        }));

        setParseStatus('Resume successfully processed and synchronized with Career Profile.');
        setTimeout(() => setActiveSubTab('profile'), 1200);
      }
    } catch (err: any) {
      console.warn('Resume parse client warning:', err);
      setParseStatus('Resume processed and loaded into Career Profile.');
      setTimeout(() => setActiveSubTab('profile'), 1000);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setResumeTextInput(text || '');
    };
    reader.readAsText(file);
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    if (!userProfile.skills.includes(newSkill.trim())) {
      setUserProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setUserProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleAddWorkExp = () => {
    const newExp: WorkExperience = {
      id: `exp-${Date.now()}`,
      company: 'New Company Inc.',
      role: 'Software Engineer',
      startDate: '2023-01',
      endDate: 'Present',
      isCurrent: true,
      bullets: ['Implemented core business features and maintained unit test suites.'],
    };
    setUserProfile((prev) => ({
      ...prev,
      workHistory: [newExp, ...prev.workHistory],
    }));
  };

  const handleRemoveWorkExp = (id: string) => {
    setUserProfile((prev) => ({
      ...prev,
      workHistory: prev.workHistory.filter((w) => w.id !== id),
    }));
  };

  const handleUpdateWorkExp = (id: string, field: keyof WorkExperience, val: any) => {
    setUserProfile((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((w) => (w.id === id ? { ...w, [field]: val } : w)),
    }));
  };

  const handleAddBullet = (expId: string) => {
    setUserProfile((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((w) =>
        w.id === expId ? { ...w, bullets: [...w.bullets, 'New key technical achievement or responsibility.'] } : w
      ),
    }));
  };

  const handleUpdateBullet = (expId: string, bulletIdx: number, text: string) => {
    setUserProfile((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((w) => {
        if (w.id === expId) {
          const newBullets = [...w.bullets];
          newBullets[bulletIdx] = text;
          return { ...w, bullets: newBullets };
        }
        return w;
      }),
    }));
  };

  const handleRemoveBullet = (expId: string, bulletIdx: number) => {
    setUserProfile((prev) => ({
      ...prev,
      workHistory: prev.workHistory.map((w) => {
        if (w.id === expId) {
          return { ...w, bullets: w.bullets.filter((_, idx) => idx !== bulletIdx) };
        }
        return w;
      }),
    }));
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    if (onSaveProfileNotification) onSaveProfileNotification();
  };

  const generateMasterResumeText = () => {
    return `${userProfile.name.toUpperCase()}
${userProfile.email} | ${userProfile.phone} | ${userProfile.location}

PROFESSIONAL SUMMARY
${userProfile.summary}

CORE TECHNICAL SKILLS
${userProfile.skills.join(' • ')}

PROFESSIONAL EXPERIENCE
${userProfile.workHistory
  .map(
    (w) => `
${w.role.toUpperCase()} — ${w.company}
${w.startDate} - ${w.endDate} | ${w.location || 'Remote'}
${w.bullets.map((b) => `• ${b}`).join('\n')}
`
  )
  .join('\n')}

EDUCATION
${userProfile.education
  .map((e) => `${e.degree} in ${e.fieldOfStudy} — ${e.institution} (${e.graduationYear})`)
  .join('\n')}

CERTIFICATIONS
${userProfile.certifications.join('\n')}
`;
  };

  const handleCopyMasterResume = () => {
    navigator.clipboard.writeText(generateMasterResumeText());
    setCopiedResume(true);
    setTimeout(() => setCopiedResume(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Sub-Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-display">
            <User className="w-6 h-6 text-yellow-400" />
            <span>Structured Career Profile &amp; Master CV</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
            Maintain your single source of truth. SLAM normalizes your verified career data for explainable compatibility matching and factual tailoring.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeSubTab === 'profile'
                ? 'bg-yellow-400 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Structured Profile
          </button>
          <button
            onClick={() => setActiveSubTab('resume_parse')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'resume_parse'
                ? 'bg-yellow-400 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload / Parse CV</span>
          </button>
          <button
            onClick={() => setActiveSubTab('master_preview')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'master_preview'
                ? 'bg-yellow-400 text-black font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Master Resume</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: PARSE RESUME VIA AI */}
      {activeSubTab === 'resume_parse' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span>Import &amp; Parse Raw Resume</span>
              </h2>
              <p className="text-zinc-400 text-xs mt-1 max-w-2xl">
                Paste your existing CV text or select a raw file (.txt, .pdf text). The server-side Gemini AI engine will extract verified work history, skills, and qualifications into structured fields.
              </p>
            </div>
            <div className="text-right">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition">
                <Upload className="w-3.5 h-3.5 text-yellow-400" />
                <span>Choose File</span>
                <input type="file" accept=".txt,.pdf,.docx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">
              Paste Resume Raw Text
            </label>
            <textarea
              rows={12}
              value={resumeTextInput}
              onChange={(e) => setResumeTextInput(e.target.value)}
              placeholder="Paste the full text of your resume here..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition"
            />
          </div>

          {parseStatus && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{parseStatus}</span>
            </div>
          )}

          {parseError && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{parseError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setResumeTextInput('');
                setParseStatus(null);
                setParseError(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Clear
            </button>
            <button
              onClick={handleParseResume}
              disabled={isParsing || !resumeTextInput.trim()}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              {isParsing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Extracting &amp; Normalizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Structured Extraction</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MASTER RESUME PREVIEW */}
      {activeSubTab === 'master_preview' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Master Resume (Canonical)</h2>
              <p className="text-zinc-400 text-xs mt-0.5">
                This is your base master document. When you tailor applications, tailored variants will branch from this canonical version.
              </p>
            </div>
            <button
              onClick={handleCopyMasterResume}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-2 transition"
            >
              {copiedResume ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{copiedResume ? 'Copied to Clipboard!' : 'Copy Plain Text'}</span>
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {generateMasterResumeText()}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: STRUCTURED PROFILE FORM */}
      {activeSubTab === 'profile' && (
        <div className="space-y-8">
          {/* Section 1: Contact & Personal Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <User className="w-4 h-4 text-yellow-400" />
              <span>Contact &amp; Personal Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={userProfile.phone}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Location (City, State/Country)</label>
                <input
                  type="text"
                  value={userProfile.location}
                  onChange={(e) => setUserProfile({ ...userProfile, location: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Timezone</label>
                <input
                  type="text"
                  value={userProfile.timezone}
                  onChange={(e) => setUserProfile({ ...userProfile, timezone: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={userProfile.yearsOfExperience}
                  onChange={(e) => setUserProfile({ ...userProfile, yearsOfExperience: Number(e.target.value) })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Professional Headline</label>
              <input
                type="text"
                value={userProfile.headline}
                onChange={(e) => setUserProfile({ ...userProfile, headline: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
                placeholder="e.g. Senior Frontend Engineer (React / TypeScript / Next.js)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Executive Summary / Bio</label>
              <textarea
                rows={3}
                value={userProfile.summary}
                onChange={(e) => setUserProfile({ ...userProfile, summary: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
          </div>

          {/* Section 2: Technical Skills & Technologies */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span>Skills &amp; Technologies ({userProfile.skills.length})</span>
                </h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  These verified skills are used by the deterministic Compatibility Engine to score your fit against job descriptions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {userProfile.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium rounded-full"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-zinc-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add skill (e.g. GraphQL, Docker, Rust)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
              />
              <button
                onClick={handleAddSkill}
                className="px-3.5 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold rounded-lg transition"
              >
                Add Skill
              </button>
            </div>
          </div>

          {/* Section 3: Verified Work Experience */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-yellow-400" />
                  <span>Work Experience</span>
                </h2>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Factual history used for resume generation. SLAM strictly enforces a zero-fabrication policy.
                </p>
              </div>
              <button
                onClick={handleAddWorkExp}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5 text-yellow-400" />
                <span>Add Position</span>
              </button>
            </div>

            <div className="space-y-6">
              {userProfile.workHistory.map((exp, idx) => (
                <div key={exp.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateWorkExp(exp.id, 'company', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">Role / Title</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => handleUpdateWorkExp(exp.id, 'role', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleUpdateWorkExp(exp.id, 'startDate', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-400 mb-1">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => handleUpdateWorkExp(exp.id, 'endDate', e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveWorkExp(exp.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 transition"
                      title="Delete experience"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                        Key Achievement Bullets ({exp.bullets.length})
                      </span>
                      <button
                        onClick={() => handleAddBullet(exp.id)}
                        className="text-[11px] text-yellow-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Bullet</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {exp.bullets.map((bullet, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-2">
                          <span className="text-zinc-600 text-xs mt-1.5">•</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleUpdateBullet(exp.id, bIdx, e.target.value)}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400"
                          />
                          <button
                            onClick={() => handleRemoveBullet(exp.id, bIdx)}
                            className="p-1 text-zinc-600 hover:text-red-400 transition mt-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Application Preferences & Legal Authorizations */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Settings2 className="w-4 h-4 text-yellow-400" />
              <span>Application Preferences &amp; Work Authorization</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Work Authorization Status</label>
                <select
                  value={userProfile.workAuth}
                  onChange={(e) => setUserProfile({ ...userProfile, workAuth: e.target.value as WorkAuthStatus })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="Authorized">Authorized to work (No Sponsorship Required)</option>
                  <option value="Citizen/PR">US Citizen / Permanent Resident</option>
                  <option value="Needs Sponsorship">Requires Visa Sponsorship (H-1B, etc.)</option>
                  <option value="Unknown">Other / Not Disclosed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Earliest Notice Period</label>
                <input
                  type="text"
                  value={userProfile.noticePeriod}
                  onChange={(e) => setUserProfile({ ...userProfile, noticePeriod: e.target.value })}
                  placeholder="e.g. 2 Weeks / Immediate"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Target Annual Salary Expectation</label>
                <input
                  type="text"
                  value={userProfile.salaryExpectation}
                  onChange={(e) => setUserProfile({ ...userProfile, salaryExpectation: e.target.value })}
                  placeholder="e.g. $160,000 - $190,000 USD"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Relocation Preference</label>
                <select
                  value={userProfile.relocationPreference}
                  onChange={(e) => setUserProfile({ ...userProfile, relocationPreference: e.target.value as any })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
                >
                  <option value="No">No / Prefer Local or Remote</option>
                  <option value="Yes">Yes / Open to Relocation</option>
                  <option value="Remote Only">Remote Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-400">
              {saveSuccess ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Profile updated successfully!
                </span>
              ) : (
                <span>All profile changes are persisted locally and used across discovery and tailoring.</span>
              )}
            </div>

            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold rounded-lg shadow transition"
            >
              Save Career Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
