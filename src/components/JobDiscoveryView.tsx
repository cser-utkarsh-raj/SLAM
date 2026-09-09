import React, { useEffect, useMemo, useState } from 'react';
import { track } from '@vercel/analytics';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, CheckCircle2, ExternalLink, MapPin, Search, ShieldCheck, Sparkles, Zap, X } from 'lucide-react';
import { JobPosting, UserProfile, ApplicationAnswer, TailoredResume } from '../types';
import { AdzunaLogo, JobicyLogo, RemoteOKLogo } from './SourceLogos';
import { ApplicationPreparationModal } from './ApplicationPreparationModal';

interface Props {
  jobs: JobPosting[]; userProfile: UserProfile; savedJobIds: string[]; onToggleSaveJob: (id: string) => void;
  compareJobIds: string[]; onToggleCompareJob: (job: JobPosting) => void; onPrepareJob: (job: JobPosting) => void;
  answerLibrary: ApplicationAnswer[]; onUpdateAnswerLibrary: (x: ApplicationAnswer[]) => void;
  onLaunchAutomation: (job: JobPosting, resume: TailoredResume | null, letter: string, answers: { question: string; answer: string }[]) => void;
  onSaveToTracker: (job: JobPosting, resume: TailoredResume | null, letter: string, answers: { question: string; answer: string }[]) => void;
  searchQuery: string; setSearchQuery: (q: string) => void; countryQuery: string; setCountryQuery: (c: string) => void;
  remoteOnly: boolean; setRemoteOnly: (r: boolean) => void; onSearch: (queryOverride?: string) => void; isSearching: boolean; searchError?: string;
}

const PRESETS = ['Software Engineering', 'Backend', 'Frontend', 'Data & AI', 'Cloud & DevOps', 'Product'];
const LEVELS = ['Internship', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead/Director'];

type SourceInfo = { sourceName?: string };
function src(job: JobPosting): string { return String(((job as any).sourcesList?.[0] as SourceInfo | undefined)?.sourceName || (job as any).primarySource || 'Live'); }
function score(job: JobPosting): number | null { const v = (job as any).match?.compatibilityScore; return typeof v === 'number' ? v : null; }
function level(job: JobPosting): string { const v = String(job.experienceLevel || '').toLowerCase(); if (v.includes('intern')) return 'Internship'; if (v.includes('junior') || v.includes('entry')) return 'Entry Level'; if (v.includes('senior')) return 'Senior Level'; if (v.includes('lead') || v.includes('director') || v.includes('principal')) return 'Lead/Director'; return 'Mid Level'; }
function age(date: string): number { const t = new Date(date || '').getTime(); return Number.isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : 999; }
function posted(date: string): string { const d = age(date); return d === 0 ? 'Today' : d === 1 ? '1 day ago' : d < 30 ? `${d} days ago` : date || 'Recently'; }
function salary(job: JobPosting): string { const min = Number((job as any).salaryMin || (job as any).minSalary || 0); const max = Number((job as any).salaryMax || (job as any).maxSalary || 0); if (!min && !max) return ''; const cur = String((job as any).salaryCurrency || (job as any).currency || ''); return `${cur ? `${cur} ` : ''}${min || ''}${min && max ? '–' : ''}${max || ''}`; }

const logoCache = new Map<string, string | null>();
function logoCandidates(company: string, applicationUrl: string): string[] {
  const cleanName = company.toLowerCase().replace(/\b(inc|incorporated|corp|corporation|co|company|ltd|limited|llc|llp|plc|gmbh|ag|sa|srl|spa|bv|nv|ab|oy|pty|pvt|private|group|holdings|technologies|solutions|services)\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
  const words = cleanName.split(' ').filter(Boolean);
  const compact = words.join('');
  const candidates = new Set<string>();
  if (compact) candidates.add(`https://cdn.simpleicons.org/${compact}`);
  if (words[0]) candidates.add(`https://cdn.simpleicons.org/${words[0]}`);
  if (words[1]) candidates.add(`https://cdn.simpleicons.org/${words[1]}`);
  try {
    const host = new URL(applicationUrl).hostname.toLowerCase().replace(/^www\./, '');
    if (host && !/(adzuna|jobicy|remoteok)\./.test(host)) candidates.add(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`);
  } catch { /* keep brand candidates */ }
  return [...candidates];
}

function CompanyLogo({ job }: { job: JobPosting }) {
  const direct = String((job as any).companyLogo || (job as any).company_logo || '').trim();
  const key = `${job.company}|${job.applicationUrl}|${direct}`;
  const [index, setIndex] = useState(0);
  const candidates = useMemo(() => direct ? [direct] : logoCandidates(String(job.company || ''), String(job.applicationUrl || '')), [direct, job.company, job.applicationUrl]);
  useEffect(() => setIndex(0), [key]);
  const url = candidates[index];
  if (!url) return <div className="w-[58px] h-[58px] rounded-2xl bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center text-white font-black text-xs">{String(job.company || '?').slice(0, 2).toUpperCase()}</div>;
  return <div className="w-[58px] h-[58px] rounded-2xl bg-white border border-white/10 shadow-lg shrink-0 flex items-center justify-center overflow-hidden"><img src={url} alt={`${job.company} logo`} className="w-[46px] h-[46px] object-contain" loading="lazy" decoding="async" onError={() => setIndex(v => v + 1)} /><span className="sr-only">{job.company}</span></div>;
}

function SourceFallback({ source, size = 56 }: { source: string; size?: number }) {
  const value = source.toLowerCase();
  if (value === 'adzuna') return <AdzunaLogo size={size} />;
  if (value === 'jobicy') return <JobicyLogo size={size} />;
  if (value === 'remote ok') return <RemoteOKLogo size={size} />;
  return <div className="inline-flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-700 text-white font-black" style={{ width: size, height: size }}>{source.slice(0, 1).toUpperCase()}</div>;
}

export const JobDiscoveryView: React.FC<Props> = ({ jobs, userProfile, savedJobIds, onToggleSaveJob, onLaunchAutomation, onSaveToTracker, searchQuery, setSearchQuery, countryQuery, setCountryQuery, remoteOnly, setRemoteOnly, onSearch, isSearching, searchError = '' }) => {
  const [jobType, setJobType] = useState<'All' | 'Remote' | 'On-site' | 'Hybrid'>('All');
  const [levelFilter, setLevelFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Any time');
  const [salaryFilter, setSalaryFilter] = useState('Any');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('Relevance');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const pageSize = 20;
  const country = userProfile.country || countryQuery || 'India';

  const filtered = useMemo(() => [...jobs].filter(job => {
    if (jobType !== 'All' && jobType !== 'Remote' && job.remoteType !== jobType) return false;
    if (remoteOnly && !job.remote) return false;
    if (levelFilter !== 'All' && level(job) !== levelFilter) return false;
    const d = age(job.postingDate); if (dateFilter === 'Last 24 hours' && d > 0) return false; if (dateFilter === 'Last 7 days' && d > 7) return false; if (dateFilter === 'Last 30 days' && d > 30) return false;
    const max = Number((job as any).salaryMax || (job as any).maxSalary || 0);
    if (salaryFilter === '₹3-6 LPA' && (!max || max < 300000)) return false;
    if (salaryFilter === '₹6-12 LPA' && (!max || max < 600000 || max > 1200000)) return false;
    if (salaryFilter === '₹12-25 LPA' && (!max || max < 1200000 || max > 2500000)) return false;
    if (salaryFilter === '₹25+ LPA' && (!max || max < 2500000)) return false;
    return true;
  }).sort((a, b) => sort === 'Newest' ? age(a.postingDate) - age(b.postingDate) : sort === 'Salary' ? Number((b as any).salaryMax || 0) - Number((a as any).salaryMax || 0) : (score(b) ?? 0) - (score(a) ?? 0)), [jobs, jobType, remoteOnly, levelFilter, dateFilter, salaryFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const runSearch = (q?: string) => { if (q !== undefined) setSearchQuery(q); setPage(1); void onSearch(q); };

  const prepareAndOpen = (job: JobPosting, resume: TailoredResume | null, letter: string, answers: { question: string; answer: string }[]) => {
    onSaveToTracker(job, resume, letter, answers);
    onLaunchAutomation(job, resume, letter, answers);
    if (job.applicationUrl) window.open(job.applicationUrl, '_blank', 'noopener,noreferrer');
    track('auto_apply_started', { source: src(job), method: job.applicationMethod });
    setSelectedJob(null);
  };

  return <div className="w-full min-h-screen bg-[#050505] text-zinc-100">
    <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-7 py-6">
      <div className="flex flex-col xl:flex-row gap-6">
        <aside className="xl:w-[245px] shrink-0"><div className="sticky top-20 bg-[#090909] border border-zinc-800 rounded-2xl overflow-hidden"><div className="p-4 border-b border-zinc-800 flex justify-between"><span className="text-sm font-black tracking-widest">FILTERS</span><button className="text-xs text-yellow-400" onClick={() => { setJobType('All'); setLevelFilter('All'); setDateFilter('Any time'); setSalaryFilter('Any'); setRemoteOnly(false); setPage(1); }}>Clear all</button></div><div className="p-4 space-y-6">
          <section><h3 className="text-xs font-bold mb-3">Country</h3><div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3"><div className="flex items-center gap-2 text-xs font-bold text-white"><MapPin className="w-3.5 h-3.5 text-yellow-400" />{country}</div><div className="text-[10px] leading-4 text-zinc-500 mt-1">Country is the hard boundary. City is only a preference.</div><input value={countryQuery || userProfile.country || ''} onChange={e => setCountryQuery(e.target.value)} placeholder="Change country" className="mt-2 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-yellow-400" /></div></section>
          <section><h3 className="text-xs font-bold mb-3">Job Type</h3>{(['Remote','On-site','Hybrid'] as const).map(v => <label key={v} className="flex items-center gap-2.5 text-xs text-zinc-400 py-1.5"><input type="checkbox" className="accent-yellow-400" checked={jobType === v || (v === 'Remote' && remoteOnly)} onChange={() => { setJobType(jobType === v ? 'All' : v); setRemoteOnly(v === 'Remote'); setPage(1); }} />{v}<span className="ml-auto text-zinc-600">{jobs.filter(j => v === 'Remote' ? j.remote : j.remoteType === v).length}</span></label>)}</section>
          <section><h3 className="text-xs font-bold mb-3">Experience Level</h3>{LEVELS.map(v => <label key={v} className="flex items-center gap-2.5 text-xs text-zinc-400 py-1.5"><input type="checkbox" className="accent-yellow-400" checked={levelFilter === v} onChange={() => { setLevelFilter(levelFilter === v ? 'All' : v); setPage(1); }} />{v}<span className="ml-auto text-zinc-600">{jobs.filter(j => level(j) === v).length}</span></label>)}</section>
          <section><h3 className="text-xs font-bold mb-3">Salary (INR)</h3>{['Any','₹3-6 LPA','₹6-12 LPA','₹12-25 LPA','₹25+ LPA'].map(v => <label key={v} className="flex items-center gap-2.5 text-xs text-zinc-400 py-1.5"><input type="radio" name="salary" className="accent-yellow-400" checked={salaryFilter === v} onChange={() => { setSalaryFilter(v); setPage(1); }} />{v}</label>)}</section>
          <section><h3 className="text-xs font-bold mb-3">Date Posted</h3>{['Any time','Last 24 hours','Last 7 days','Last 30 days'].map(v => <label key={v} className="flex items-center gap-2.5 text-xs text-zinc-400 py-1.5"><input type="radio" name="date" className="accent-yellow-400" checked={dateFilter === v} onChange={() => { setDateFilter(v); setPage(1); }} />{v}</label>)}</section>
        </div></div></aside>

        <main className="min-w-0 flex-1">
          <div className="flex flex-col 2xl:flex-row 2xl:items-end justify-between gap-5 mb-5"><div><div className="text-[10px] font-mono font-bold text-yellow-400 tracking-[0.18em] mb-2">LIVE JOB DISCOVERY</div><h1 className="text-4xl sm:text-5xl font-display font-black leading-none">Discover Your <span className="text-yellow-400">Next Opportunity</span></h1><p className="mt-3 text-sm text-zinc-500">Real jobs. Real companies. Country-wide for <span className="text-white font-semibold">{country}</span>{userProfile.location ? ` · city preference: ${userProfile.location}` : ''} · <span className="text-yellow-400">{userProfile.targetRoles?.[0] || 'Software & Technology'}</span></p></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] text-zinc-500 flex gap-2 items-center"><span className="w-2 h-2 rounded-full bg-emerald-400" />Live Jobs</div><b className="text-sm">{jobs.length} loaded</b></div><div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] text-zinc-500 flex gap-2 items-center"><Sparkles className="w-3 h-3 text-violet-400" />AI Matched</div><b className="text-sm">Profile based</b></div><div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] text-zinc-500 flex gap-2 items-center"><Zap className="w-3 h-3 text-yellow-400" />AI Apply</div><b className="text-sm">Prepare & open</b></div><div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800"><div className="text-[10px] text-zinc-500 flex gap-2 items-center"><ShieldCheck className="w-3 h-3 text-emerald-400" />Country Safe</div><b className="text-sm">{country} only</b></div></div></div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5"><form onSubmit={e => { e.preventDefault(); runSearch(); }} className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-2.5"><label className="relative"><Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search a role or skill (e.g. software engineer, data science)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-yellow-400" /></label><label className="relative"><MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-500" /><input value={countryQuery} onChange={e => setCountryQuery(e.target.value)} placeholder="Country" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:border-yellow-400" /></label><button disabled={isSearching} className="px-6 py-3 rounded-xl bg-yellow-400 text-black text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50"><Search className="w-4 h-4" />{isSearching ? 'Searching…' : 'Search'}</button></form><div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-800"><span className="text-[10px] font-mono text-zinc-600 py-1">QUICK</span>{PRESETS.map(p => <button type="button" key={p} onClick={() => runSearch(p)} className="px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white">{p}</button>)}</div></div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-5 mb-3"><div className="text-sm text-zinc-400"><b className="text-white">Found {filtered.length} jobs</b> <span className="mx-2 text-zinc-700">·</span><span className="text-emerald-400 inline-flex gap-1 items-center"><CheckCircle2 className="w-3 h-3" /> live data</span></div><select value={sort} onChange={e => setSort(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs"><option>Relevance</option><option>Newest</option><option>Salary</option></select></div>

          {isSearching && <div className="py-20 rounded-2xl border border-zinc-800 text-center"><div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-yellow-400 animate-spin mx-auto" /><b className="block mt-4">Fetching live jobs</b><span className="text-xs text-zinc-500">Contacting the connected job feeds…</span></div>}
          {!isSearching && searchError && <div className="py-16 rounded-2xl border border-red-900/50 text-center"><b>Live search unavailable</b><p className="text-sm text-zinc-500 mt-2">{searchError}</p><button onClick={() => runSearch()} className="mt-5 px-5 py-2.5 bg-yellow-400 text-black rounded-lg text-xs font-black">Retry</button></div>}
          {!isSearching && !searchError && !visible.length && <div className="py-16 rounded-2xl border border-zinc-800 text-center"><b>No matching live jobs</b><p className="text-sm text-zinc-500 mt-2">Try a broader role or remove a filter.</p></div>}

          {!isSearching && !searchError && <div className="space-y-2.5">{visible.map((job, i) => { const s = score(job); const saved = savedJobIds.includes(job.id); const description = String((job as any).description || '').replace(/\s+/g, ' ').trim(); return <motion.article key={job.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * .02, .2) }} className="rounded-2xl border border-zinc-800 bg-[#080808] p-4 sm:p-5 hover:bg-zinc-900/80 hover:border-zinc-700 transition"><div className="flex flex-col lg:flex-row lg:items-center gap-4"><CompanyLogo job={job} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base sm:text-lg font-black text-white">{job.title}</h2>{job.applicationMethod === 'Assisted Flow' && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-400/10 border border-emerald-400/20 text-[9px] font-black text-emerald-400"><CheckCircle2 className="w-3 h-3" /> Assisted</span>}</div><div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400"><b className="text-zinc-300">{job.company}</b><span>·</span><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location || country}</span><span>·</span><span>{job.employmentType || 'Full-time'}</span><span>·</span><span>{level(job)}</span></div><p className="mt-2 text-xs text-zinc-500 leading-5 line-clamp-2">{description || 'Open the listing for the employer-provided job description.'}</p><div className="flex flex-wrap gap-1.5 mt-3">{(job.requiredSkills || []).slice(0, 5).map(skill => <span key={skill} className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400">{skill}</span>)}</div></div><div className="lg:w-[250px] flex lg:flex-col lg:items-end justify-between gap-3"><div className="text-right">{salary(job) && <div className="font-black text-white">{salary(job)}</div>}<div className="text-[10px] text-zinc-600 mt-1">{posted(job.postingDate)}</div>{s !== null && <div className="text-[10px] text-yellow-400 mt-1 font-bold">{s}% profile match</div>}<div className="text-[10px] text-zinc-600 mt-1">Source: {src(job)}</div></div><div className="flex items-center gap-2"><button onClick={() => onToggleSaveJob(job.id)} className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400">{saved ? <BookmarkCheck className="w-4 h-4 text-yellow-400" /> : <Bookmark className="w-4 h-4" />}</button><button onClick={() => setSelectedJob(job)} className="px-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-[10px] font-black inline-flex items-center gap-1.5"><BriefcaseIcon />Details</button><button onClick={() => setSelectedJob(job)} className="px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-[10px] font-black inline-flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" />Auto Apply</button></div></div></div></motion.article>; })}</div>}

          {!isSearching && !searchError && pages > 1 && <div className="flex justify-center items-center gap-3 mt-6"><button disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-2 border border-zinc-800 rounded-lg text-xs disabled:opacity-30">Previous</button><span className="text-xs text-zinc-500">Page {currentPage} of {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(p => p + 1)} className="px-3 py-2 border border-zinc-800 rounded-lg text-xs disabled:opacity-30">Next</button></div>}
        </main>
      </div>
    </div>

    {selectedJob && <ApplicationPreparationModal job={selectedJob} userProfile={userProfile} isOpen={Boolean(selectedJob)} onClose={() => setSelectedJob(null)} onSaveToTracker={prepareAndOpen} />}
  </div>;
};

const BriefcaseIcon = () => <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-sm border border-zinc-500 text-[7px] font-black">i</span>;
