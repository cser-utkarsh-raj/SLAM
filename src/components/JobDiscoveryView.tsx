import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, JobPosting, TailoredResume, ApplicationAnswer } from '../types';
import { ApplicationPreparationModal } from './ApplicationPreparationModal';
import { LinkedInLogo, IndeedLogo, GlassdoorLogo, WellfoundLogo, WorkIndiaLogo, InstahyreLogo, ArbeitnowLogo } from './SourceLogos';
import { Bookmark, BookmarkCheck, ArrowUpRight, CheckCircle2, Search, RefreshCw, MapPin, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';

interface Props {
  jobs: JobPosting[];
  userProfile: UserProfile;
  savedJobIds: string[];
  onToggleSaveJob: (id: string) => void;
  compareJobIds: string[];
  onToggleCompareJob: (job: JobPosting) => void;
  onPrepareJob: (job: JobPosting) => void;
  answerLibrary: ApplicationAnswer[];
  onUpdateAnswerLibrary: (x: ApplicationAnswer[]) => void;
  onLaunchAutomation: (job: JobPosting, resume: TailoredResume | null, letter: string, answers: { question: string; answer: string }[]) => void;
  onSaveToTracker: (job: JobPosting, resume: TailoredResume | null, letter: string, answers: { question: string; answer: string }[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  countryQuery: string;
  setCountryQuery: (c: string) => void;
  remoteOnly: boolean;
  setRemoteOnly: (r: boolean) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchError?: string;
}

const SOURCE_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  linkedin: LinkedInLogo,
  indeed: IndeedLogo,
  glassdoor: GlassdoorLogo,
  wellfound: WellfoundLogo,
  workindia: WorkIndiaLogo,
  instahyre: InstahyreLogo,
  arbeitnow: ArbeitnowLogo,
};

function getSource(job: JobPosting) {
  return job.sourcesList?.[0] || null;
}

function getSourceName(job: JobPosting) {
  return getSource(job)?.sourceName || job.primarySource || 'Unknown source';
}

function SourceMark({ name, size = 30 }: { name: string; size?: number }) {
  const Logo = SOURCE_LOGOS[name.trim().toLowerCase()];
  return Logo ? <Logo size={size} /> : <span className="inline-flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-[10px] font-black text-white" style={{ width: size, height: size }}>{name.slice(0, 1).toUpperCase()}</span>;
}

export const JobDiscoveryView: React.FC<Props> = ({
  jobs,
  userProfile,
  savedJobIds,
  onToggleSaveJob,
  onSaveToTracker,
  searchQuery,
  setSearchQuery,
  countryQuery,
  setCountryQuery,
  remoteOnly,
  setRemoteOnly,
  onSearch,
  isSearching,
  searchError = '',
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [preparingJob, setPreparingJob] = useState<JobPosting | null>(null);

  const scoredJobs = useMemo(() => {
    return [...jobs].sort((a, b) => ((b as any).match?.compatibilityScore ?? 0) - ((a as any).match?.compatibilityScore ?? 0));
  }, [jobs]);

  const activeSelected = selectedJobId ? scoredJobs.find((job) => job.id === selectedJobId) || null : scoredJobs[0] || null;
  const match = (job: any) => job?.match || null;
  const userCountry = countryQuery || userProfile.country || 'Global';

  return (
    <div className="w-full relative min-h-screen">
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-zinc-500 tracking-widest uppercase mb-2">Live discovery · {userCountry}</div>
              <h1 className="text-4xl sm:text-6xl font-display font-black text-white leading-tight">JOB MATCHING.</h1>
            </div>
            <div className="text-xs text-zinc-400 font-mono"><span className="text-white font-bold">{scoredJobs.length}</span> verified listings in this search</div>
          </div>
        </motion.div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-8 backdrop-blur shadow-xl">
          <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search roles, skills or keywords" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <div className="relative w-full lg:w-48">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3.5" />
              <input type="text" value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder="Country or market" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400" />
            </div>
            <label className="flex items-center gap-2 px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 cursor-pointer select-none"><input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} className="accent-yellow-400 rounded" /><span>Remote only</span></label>
            <button type="submit" disabled={isSearching} className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"><RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} /><span>{isSearching ? 'Searching…' : 'Search'}</span></button>
          </form>

          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono"><span>Try:</span>{['Software Engineer', 'Frontend Developer', 'Full Stack', 'Python Backend', 'DevOps'].map((preset) => <button key={preset} type="button" onClick={() => { setSearchQuery(preset); setTimeout(() => onSearch(), 50); }} className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 transition">{preset}</button>)}</div>
        </div>

        {isSearching ? (
          <div className="max-w-2xl mx-auto py-20 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"><RefreshCw className="w-8 h-8 text-yellow-400 mx-auto mb-4 animate-spin" /><h2 className="text-xl font-display font-black text-white">SEARCHING LIVE SOURCES</h2><p className="text-xs text-zinc-500 mt-2">Fetching current listings and calculating compatibility from your verified profile.</p></div>
        ) : searchError ? (
          <div className="max-w-2xl mx-auto py-16 text-center bg-zinc-900/60 border border-red-900/50 rounded-2xl p-8"><AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-4" /><h2 className="text-2xl font-display font-black text-white">LIVE SEARCH UNAVAILABLE</h2><p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">{searchError}</p><button onClick={onSearch} className="mt-6 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-lg inline-flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Try again</button></div>
        ) : scoredJobs.length === 0 ? (
          <div className="max-w-2xl mx-auto py-16 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"><Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" /><h2 className="text-2xl font-display font-black text-white">NO VERIFIED LISTINGS FOUND</h2><p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">No live source returned a listing for “{searchQuery || 'your current profile'}” in {userCountry}. Try a broader role, another market, or turn off Remote only.</p><button onClick={() => { setSearchQuery('developer'); setCountryQuery(''); setRemoteOnly(false); setTimeout(() => onSearch(), 50); }} className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg border border-zinc-700 inline-flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-yellow-400" /> Broaden search</button></div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full lg:w-5/12 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-wider"><span>Ranked opportunities</span><span>Compatibility</span></div>
              <AnimatePresence>
                {scoredJobs.map((job, index) => {
                  const isSelected = activeSelected?.id === job.id;
                  const isSaved = savedJobIds.includes(job.id);
                  const m = match(job);
                  const score = m?.compatibilityScore;
                  const sourceName = getSourceName(job);
                  return (
                    <motion.button key={job.id} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.02, 0.3) }} onClick={() => setSelectedJobId(job.id)} className={`w-full text-left cursor-pointer p-4 rounded-xl border transition-all ${isSelected ? 'bg-zinc-900 border-yellow-400 shadow-md ring-1 ring-yellow-400/20' : 'bg-[#0a0a0a] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'}`}>
                      <div className="flex justify-between items-start gap-3"><div className="flex gap-3 min-w-0 flex-1"><SourceMark name={sourceName} size={32} /><div className="min-w-0"><h3 className="text-sm font-bold text-zinc-100 line-clamp-2 mb-0.5">{job.title}</h3><div className="text-xs text-zinc-400 truncate">{job.company} · {job.location || (job.remote ? 'Remote' : 'Location not specified')}</div></div></div><div className="text-right shrink-0"><div className={`text-xl font-black font-display ${typeof score === 'number' && score >= 75 ? 'text-yellow-400' : 'text-white'}`}>{typeof score === 'number' ? `${score}%` : '—'}</div><div className="text-[9px] font-mono font-bold text-zinc-500 uppercase">{score != null ? 'Match' : 'Unscored'}</div></div></div>
                      <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 gap-3"><span className="truncate">Source: {sourceName}</span><div className="flex items-center gap-2 shrink-0">{job.remote && <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono">Remote</span>}{isSaved && <span className="text-yellow-400 font-bold flex items-center gap-1"><BookmarkCheck className="w-3 h-3" /> Saved</span>}</div></div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="w-full lg:w-7/12 lg:sticky lg:top-20">
              <AnimatePresence mode="wait">
                {activeSelected ? (
                  <motion.div key={activeSelected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
                    {(() => {
                      const m = match(activeSelected);
                      const source = getSource(activeSelected);
                      const sourceName = getSourceName(activeSelected);
                      return (
                        <>
                          <div className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-800">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-3"><span className="inline-flex items-center gap-2 px-2.5 py-1 bg-yellow-400/10 text-yellow-400 text-[10px] font-mono font-bold tracking-widest uppercase border border-yellow-400/30"><SourceMark name={sourceName} size={22} />Source: {sourceName}</span>{activeSelected.remote && <span className="px-2 py-1 bg-zinc-800 text-zinc-300 text-[10px] font-mono rounded">Remote</span>}</div>
                              <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">{activeSelected.title}</h2>
                              <div className="text-sm font-semibold text-zinc-400 mt-1">{activeSelected.company} · {activeSelected.location || 'Location not specified'}</div>
                            </div>
                            <button onClick={() => onToggleSaveJob(activeSelected.id)} className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${savedJobIds.includes(activeSelected.id) ? 'bg-yellow-400/10 border-yellow-400/60 text-yellow-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`} title="Save job" aria-label={savedJobIds.includes(activeSelected.id) ? 'Remove saved job' : 'Save job'}>{savedJobIds.includes(activeSelected.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}</button>
                          </div>

                          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0"><SourceMark name={sourceName} size={42} /><div className="min-w-0"><div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Listing source</div><div className="text-sm font-bold text-white truncate">{sourceName}</div><div className="text-[10px] text-zinc-500 mt-0.5">{source?.isOfficial ? 'Official source' : 'Third-party source'} · original listing</div></div></div>
                            {activeSelected.applicationUrl && <a href={activeSelected.applicationUrl} target="_blank" rel="noreferrer" className="shrink-0 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white rounded-lg inline-flex items-center justify-center gap-2"><span>Open original</span><ExternalLink className="w-3.5 h-3.5 text-yellow-400" /></a>}
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl"><div className="text-[10px] font-mono text-zinc-500 uppercase">Match score</div><div className="text-2xl font-black text-yellow-400 font-display mt-0.5">{m?.compatibilityScore != null ? `${m.compatibilityScore}%` : '—'}</div></div>
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl"><div className="text-[10px] font-mono text-zinc-500 uppercase">Experience</div><div className="text-sm font-bold text-white mt-1">{activeSelected.minYearsExperience ? `${activeSelected.minYearsExperience}+ yrs` : 'Not specified'}</div></div>
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl"><div className="text-[10px] font-mono text-zinc-500 uppercase">Posted</div><div className="text-sm font-bold text-white mt-1">{activeSelected.postingDate || 'Not specified'}</div></div>
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl"><div className="text-[10px] font-mono text-zinc-500 uppercase">Employment</div><div className="text-sm font-bold text-white mt-1">{activeSelected.employmentType || 'Not specified'}</div></div>
                          </div>

                          <div><h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">Verified skill alignment</h4>{m?.matchedSkills?.length ? <div className="flex flex-wrap gap-2">{m.matchedSkills.map((s: string) => <span key={s} className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs rounded-lg flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /><span>{s}</span></span>)}</div> : <p className="text-xs text-zinc-500">No verified skill overlap was detected from the returned listing.</p>}</div>

                          {m?.missingSkills?.length > 0 && <div><h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">Potential skill gaps</h4><div className="flex flex-wrap gap-2">{m.missingSkills.map((s: string) => <span key={s} className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg">{s}</span>)}</div></div>}

                          {activeSelected.description && <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2"><div className="flex items-center justify-between gap-3"><h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Original job description</h4><span className="text-[9px] font-mono text-zinc-600 uppercase">Source text</span></div><p className="text-xs text-zinc-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">{activeSelected.description}</p></div>}

                          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                            <div className="text-[10px] font-mono text-zinc-500">Source: <span className="text-zinc-300">{sourceName}</span> · SLAM did not create this listing.</div>
                            <button onClick={() => setPreparingJob(activeSelected)} className="w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"><Sparkles className="w-4 h-4" /><span>Prepare application</span></button>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                ) : <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl"><span className="text-xs text-zinc-500">Select a listing to inspect details.</span></div>}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {preparingJob && <ApplicationPreparationModal job={preparingJob} userProfile={userProfile} isOpen={Boolean(preparingJob)} onClose={() => setPreparingJob(null)} onSaveToTracker={onSaveToTracker} />}
    </div>
  );
};
