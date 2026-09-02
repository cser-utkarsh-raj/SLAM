import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Bookmark, BookmarkCheck, ExternalLink, MapPin, RefreshCw, Search } from 'lucide-react';
import { JobPosting, UserProfile, ApplicationAnswer, TailoredResume } from '../types';
import { LinkedInLogo, IndeedLogo, GlassdoorLogo, WellfoundLogo, WorkIndiaLogo, InstahyreLogo, AdzunaLogo } from './SourceLogos';

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

type SourceInfo = { sourceName?: string; sourceUrl?: string; sourceType?: string; postedDate?: string; isOfficial?: boolean };

const SOURCE_LOGOS: Record<string, React.FC<{ size?: number }>> = {
  linkedin: LinkedInLogo,
  indeed: IndeedLogo,
  glassdoor: GlassdoorLogo,
  wellfound: WellfoundLogo,
  workindia: WorkIndiaLogo,
  instahyre: InstahyreLogo,
  adzuna: AdzunaLogo,
};

function getSource(job: JobPosting): SourceInfo | null {
  const value = (job as any).sourcesList?.[0];
  return value && typeof value === 'object' ? value : null;
}

function getSourceName(job: JobPosting): string {
  const source = getSource(job);
  const value = source?.sourceName || (job as any).primarySource;
  return typeof value === 'string' && value.trim() ? value.trim() : 'Unknown source';
}

function SourceMark({ name, size = 34 }: { name: string; size?: number }) {
  const Logo = SOURCE_LOGOS[name.trim().toLowerCase()];
  return Logo ? <Logo size={size} /> : <span className="inline-flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-black text-white" style={{ width: size, height: size }}>{name.slice(0, 1).toUpperCase()}</span>;
}

function scoreFor(job: JobPosting) {
  const value = (job as any).match?.compatibilityScore;
  return typeof value === 'number' ? value : null;
}

export const JobDiscoveryView: React.FC<Props> = ({
  jobs, userProfile, savedJobIds, onToggleSaveJob, searchQuery, setSearchQuery, countryQuery, setCountryQuery,
  remoteOnly, setRemoteOnly, onSearch, isSearching, searchError = ''
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const rankedJobs = useMemo(() => [...jobs].sort((a, b) => (scoreFor(b) ?? -1) - (scoreFor(a) ?? -1)), [jobs]);
  const selectedJob = rankedJobs.find(job => job.id === selectedJobId) || rankedJobs[0] || null;
  const country = countryQuery || userProfile.country || 'your selected market';

  const runPreset = (query: string) => {
    setSearchQuery(query);
    window.setTimeout(onSearch, 0);
  };

  return (
    <div className="w-full min-h-screen relative">
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div><div className="text-[10px] sm:text-xs font-mono font-bold text-yellow-400/80 tracking-[0.18em] uppercase mb-2">LIVE JOB DISCOVERY · {country}</div><h1 className="text-4xl sm:text-6xl font-display font-black text-white leading-none">JOB MATCHING.</h1><p className="mt-3 text-sm text-zinc-500 max-w-xl">Country-first search. Every result keeps its original source and application link.</p></div>
          <div className="text-xs text-zinc-500 font-mono"><span className="text-white font-bold">{rankedJobs.length}</span> verified listings</div>
        </motion.header>

        <div className="bg-zinc-900/85 border border-zinc-800 rounded-2xl p-4 mb-8 backdrop-blur-xl shadow-xl">
          <form onSubmit={e => { e.preventDefault(); onSearch(); }} className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto_auto] gap-3">
            <label className="relative block"><span className="sr-only">Job search</span><Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Role, skills or keywords" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400" /></label>
            <label className="relative block"><span className="sr-only">Country or location</span><MapPin className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" /><input value={countryQuery} onChange={e => setCountryQuery(e.target.value)} placeholder="Country / location" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400" /></label>
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 cursor-pointer select-none"><input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} className="accent-yellow-400" /> Remote only</label>
            <button type="submit" disabled={isSearching} className="px-5 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition"><RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} /> {isSearching ? 'Searching…' : 'Search'}</button>
          </form>
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800 text-[10px] font-mono text-zinc-600"><span>QUICK SEARCH</span>{['Software Engineer','Frontend Developer','Full Stack','Python Backend','DevOps'].map(preset => <button key={preset} type="button" onClick={() => runPreset(preset)} className="px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition">{preset}</button>)}</div>
        </div>

        {isSearching && <div className="max-w-2xl mx-auto py-20 text-center bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8"><RefreshCw className="w-8 h-8 text-yellow-400 mx-auto mb-4 animate-spin" /><h2 className="text-xl font-display font-black text-white">SEARCHING {country.toUpperCase()}</h2><p className="text-xs text-zinc-500 mt-2">Only country-matched live listings are allowed through.</p></div>}
        {!isSearching && searchError && <div className="max-w-2xl mx-auto py-16 text-center bg-zinc-900/70 border border-red-900/50 rounded-2xl p-8"><AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-4" /><h2 className="text-2xl font-display font-black text-white">LIVE SEARCH UNAVAILABLE</h2><p className="text-sm text-zinc-400 mt-2 max-w-lg mx-auto">{searchError}</p><button onClick={onSearch} className="mt-6 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black rounded-lg inline-flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> Retry</button></div>}
        {!isSearching && !searchError && rankedJobs.length === 0 && <div className="max-w-2xl mx-auto py-16 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"><Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" /><h2 className="text-2xl font-display font-black text-white">NO VERIFIED LISTINGS FOUND</h2><p className="text-sm text-zinc-400 mt-2">Nothing matched <strong className="text-white">{searchQuery || 'your profile'}</strong> in <strong className="text-white">{country}</strong>. Try a broader role or nearby location.</p><button onClick={() => runPreset('developer')} className="mt-6 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 inline-flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5 text-yellow-400" /> Broaden search</button></div>}

        {!isSearching && !searchError && rankedJobs.length > 0 && <div className="grid grid-cols-1 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
          <div className="space-y-2.5"><div className="flex items-center justify-between px-1 pb-2 border-b border-zinc-800 text-[10px] font-mono text-zinc-600 uppercase tracking-widest"><span>Ranked opportunities</span><span>Compatibility</span></div>
            <AnimatePresence initial={false}>{rankedJobs.map((job, index) => { const sourceName = getSourceName(job); const score = scoreFor(job); const selected = selectedJob?.id === job.id; const saved = savedJobIds.includes(job.id); return <motion.button key={job.id} type="button" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .025, .25) }} onClick={() => setSelectedJobId(job.id)} className={`w-full text-left p-4 rounded-xl border transition-all ${selected ? 'bg-zinc-900 border-yellow-400/80 shadow-lg shadow-yellow-400/5' : 'bg-[#080808] border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'}`}>
              <div className="flex gap-3 min-w-0"><SourceMark name={sourceName} size={38} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-sm font-bold text-white line-clamp-2">{job.title}</h3><p className="text-xs text-zinc-400 truncate mt-1">{job.company} · {job.location || 'Location not specified'}</p></div><div className="text-right shrink-0">{score !== null ? <><div className={`text-xl font-display font-black ${score >= 75 ? 'text-yellow-400' : 'text-white'}`}>{score}%</div><div className="text-[8px] font-mono text-zinc-600 uppercase">Match</div></> : <div className="text-xs font-mono text-zinc-600">UNSCORED</div>}</div></div><div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between gap-3 text-[10px] text-zinc-600"><span className="truncate">Source: <strong className="text-zinc-400">{sourceName}</strong></span>{saved && <span className="text-yellow-400 flex items-center gap-1"><BookmarkCheck className="w-3 h-3" /> Saved</span>}</div></div></div>
            </motion.button>; })}</AnimatePresence>
          </div>

          <AnimatePresence mode="wait">{selectedJob && <motion.article key={selectedJob.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lg:sticky lg:top-20 bg-[#090909] border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-2xl overflow-hidden">
            {(() => { const source = getSource(selectedJob); const sourceName = getSourceName(selectedJob); const score = scoreFor(selectedJob); const saved = savedJobIds.includes(selectedJob.id); return <>
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-800"><div className="min-w-0"><div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1.5 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-mono font-bold uppercase tracking-wider"><SourceMark name={sourceName} size={22} /> Source: {sourceName}</div><h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">{selectedJob.title}</h2><p className="mt-1.5 text-sm font-semibold text-zinc-400">{selectedJob.company} · {selectedJob.location || 'Location not specified'}</p></div><button type="button" onClick={() => onToggleSaveJob(selectedJob.id)} className={`shrink-0 p-2.5 rounded-xl border ${saved ? 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10' : 'text-zinc-400 border-zinc-800 bg-zinc-950 hover:text-white'}`} aria-label={saved ? 'Remove saved job' : 'Save job'}>{saved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}</button></div>
              <div className="mt-5 p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-center gap-3 min-w-0"><SourceMark name={sourceName} size={44} /><div className="min-w-0"><div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Listing source</div><div className="text-sm font-bold text-white">{sourceName}</div><div className="text-[10px] text-zinc-500 mt-0.5">{source?.sourceType || 'External job source'} · original listing</div></div></div>{selectedJob.applicationUrl && <a href={selectedJob.applicationUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg text-xs font-black inline-flex items-center justify-center gap-2">OPEN ORIGINAL <ExternalLink className="w-3.5 h-3.5" /></a>}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5"><div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl"><div className="text-[9px] font-mono text-zinc-600 uppercase">Country filter</div><div className="text-xs font-bold text-white mt-1">{country}</div></div><div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl"><div className="text-[9px] font-mono text-zinc-600 uppercase">Posted</div><div className="text-xs font-bold text-white mt-1">{selectedJob.postingDate || 'Not supplied'}</div></div><div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl"><div className="text-[9px] font-mono text-zinc-600 uppercase">Match</div><div className="text-xs font-bold text-yellow-400 mt-1">{score === null ? 'Not scored' : `${score}%`}</div></div></div>
              <div className="mt-6"><div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">Description</div><p className="text-sm leading-7 text-zinc-300 whitespace-pre-line">{selectedJob.description || 'The source did not provide a readable description.'}</p></div>
              <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-zinc-600"><span>Source: {sourceName}</span><span>SLAM does not create or rewrite listings.</span></div>
            </>; })()}
          </motion.article>}</AnimatePresence>
        </div>}
      </div>
    </div>
  );
};
