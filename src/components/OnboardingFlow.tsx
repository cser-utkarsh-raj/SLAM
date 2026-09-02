import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ResumeImporter } from './ResumeImporter';
import { 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  MapPin, 
  Briefcase, 
  ShieldCheck, 
  Award 
} from 'lucide-react';

interface Props {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<Props> = ({
  userProfile,
  setUserProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [newSkill, setNewSkill] = useState('');
  const [newRole, setNewRole] = useState('');

  const handleProfileExtracted = (extracted: UserProfile) => {
    setUserProfile((prev) => ({
      ...prev,
      ...extracted,
    }));
    setStep(2);
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

  const handleRemoveSkill = (s: string) => {
    setUserProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== s),
    }));
  };

  const handleAddTargetRole = () => {
    if (!newRole.trim()) return;
    if (!userProfile.targetRoles.includes(newRole.trim())) {
      setUserProfile((prev) => ({
        ...prev,
        targetRoles: [...prev.targetRoles, newRole.trim()],
      }));
    }
    setNewRole('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      {/* Step Indicator */}
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-xl mx-auto mb-4">
          {[
            { num: 1, label: 'Resume Intake' },
            { num: 2, label: 'Profile Verification' },
            { num: 3, label: 'Job Preferences' },
          ].map((s) => (
            <div key={s.num} className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                  step === s.num
                    ? 'bg-yellow-400 text-black ring-4 ring-yellow-400/20'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span
                className={`text-[11px] font-mono mt-2 uppercase tracking-wider ${
                  step === s.num ? 'text-white font-bold' : 'text-zinc-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: RESUME INTAKE */}
      {step === 1 && (
        <div>
          <ResumeImporter onProfile={handleProfileExtracted} />
          <div className="text-center mt-6">
            <button
              onClick={() => setStep(2)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition underline font-mono"
            >
              Skip resume upload and enter profile manually →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PROFILE VERIFICATION */}
      {step === 2 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <div className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-bold mb-1">
              Step 2 of 3
            </div>
            <h2 className="text-3xl font-display font-black text-white">
              VERIFY EXTRACTED PROFILE
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Review and refine your factual career qualifications. SLAM uses these for transparent compatibility scoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
              <input
                type="text"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                placeholder="e.g. Alex Morgan"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
              <input
                type="email"
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                placeholder="name@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Country / Market</label>
              <input
                type="text"
                value={userProfile.country}
                onChange={(e) => setUserProfile({ ...userProfile, country: e.target.value })}
                placeholder="e.g. India, United States, Germany"
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
              placeholder="e.g. Senior Full-Stack Engineer (React / Python / AWS)"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              Verified Technical Skills ({userProfile.skills.length})
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {userProfile.skills.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-full flex items-center gap-1.5"
                >
                  <span>{s}</span>
                  <button
                    onClick={() => handleRemoveSkill(s)}
                    className="text-zinc-500 hover:text-red-400 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. Docker, TypeScript)..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
              />
              <button
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg border border-zinc-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2"
            >
              <span>Continue to Preferences</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: JOB PREFERENCES */}
      {step === 3 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div className="border-b border-zinc-800 pb-4">
            <div className="text-xs font-mono uppercase tracking-widest text-yellow-400 font-bold mb-1">
              Step 3 of 3
            </div>
            <h2 className="text-3xl font-display font-black text-white">
              JOB SEARCH PREFERENCES
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Customize role targets and work arrangements for discovery.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">Target Roles</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(userProfile.targetRoles.length > 0
                ? userProfile.targetRoles
                : ['Software Engineer', 'Full Stack Developer']
              ).map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-xs text-white rounded-md flex items-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{role}</span>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTargetRole();
                  }
                }}
                placeholder="Add role (e.g. Backend Engineer)..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-400"
              />
              <button
                onClick={handleAddTargetRole}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg border border-zinc-700"
              >
                Add Role
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Work Arrangement</label>
              <select
                value={userProfile.relocationPreference}
                onChange={(e) => setUserProfile({ ...userProfile, relocationPreference: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
              >
                <option value="Remote Only">Remote Only</option>
                <option value="No">Hybrid / Local Preferred</option>
                <option value="Yes">Open to Relocation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Work Authorization</label>
              <select
                value={userProfile.workAuth}
                onChange={(e) => setUserProfile({ ...userProfile, workAuth: e.target.value as any })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400"
              >
                <option value="Authorized">Authorized to work (No sponsorship needed)</option>
                <option value="Needs Sponsorship">Requires Visa Sponsorship</option>
                <option value="Citizen/PR">Citizen / Permanent Resident</option>
                <option value="Unknown">Not Specified</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-400">
              <b className="text-white">Live Discovery Ready:</b> SLAM connects to live public job feeds and direct employer career listings matching your verified location and roles.
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={onComplete}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Live Discovery</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
