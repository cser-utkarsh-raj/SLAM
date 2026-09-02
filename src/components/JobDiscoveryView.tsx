import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, JobPosting, TailoredResume, ApplicationAnswer } from '../types';
import { ApplicationPreparationModal } from './ApplicationPreparationModal';
import { 
  Bookmark, 
  BookmarkCheck, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  RefreshCw, 
  SlidersHorizontal, 
  MapPin, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

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
}) => {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [preparingJob, setPreparingJob] = useState<JobPosting | null>(null);
  const [filterMinScore, setFilterMinScore] = useState<number>(0);

  const scoredJobs = useMemo(() => {
    return [...jobs]
      .filter((j) => {
        const score = (j as any).match?.compatibilityScore ?? 0;
        return score >= filterMinScore;
      })
      .sort((a, b) => ((b as any).match?.compatibilityScore ?? 0) - ((a as any).match?.compatibilityScore ?? 0));
  }, [jobs, filterMinScore]);

  const activeSelected = selectedJob || scoredJobs[0] || null;
  const match = (job: any) => job?.match || null;
  const userCountry = countryQuery || userProfile.country || 'Global';

  return (
    <div className="w-full relative min-h-screen">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header section */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-zinc-500 tracking-widest uppercase mb-2">
                Real-Time Discovery · Market: {userCountry.toUpperCase()}
              </div>
              <h1 className="text-4xl sm:text-6xl font-display font-black text-white leading-tight">
                JOB MATCHING.
              </h1>
            </div>

            <div className="text-xs text-zinc-400 font-mono">
              <span className="text-white font-bold">{scoredJobs.length}</span> live opportunities ranked against your verified profile
            </div>
          </div>
        </motion.div>

        {/* Live Filter & Search Toolbar */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 mb-8 backdrop-blur shadow-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job title, skills, keywords (e.g. React Developer)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div className="relative w-full lg:w-48">
              <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={countryQuery}
                onChange={(e) => setCountryQuery(e.target.value)}
                placeholder="Country (e.g. India, USA)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <label className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="accent-yellow-400 rounded"
              />
              <span>Remote Only</span>
            </label>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs font-black uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Quick preset suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
            <span>Quick queries:</span>
            {['Software Engineer', 'Frontend Developer', 'Full Stack', 'Backend Python', 'DevOps'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setSearchQuery(preset);
                  setTimeout(() => onSearch(), 50);
                }}
                className="px-2.5 py-0.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-column discovery view */}
        {scoredJobs.length === 0 ? (
          <div className="max-w-2xl mx-auto py-16 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <Search className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-black text-white">NO LISTINGS FOUND</h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
              We couldn't locate active listings matching &quot;{searchQuery}&quot; in {userCountry}. Try broadening your search keywords or switching off &quot;Remote Only&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery('developer');
                setCountryQuery('');
                setRemoteOnly(false);
                setTimeout(() => onSearch(), 50);
              }}
              className="mt-6 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white rounded-lg border border-zinc-700 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5 text-yellow-400" />
              <span>Reset Search Filters</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left list: Job cards */}
            <div className="w-full lg:w-5/12 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                <span>Ranked Opportunities</span>
                <span>Compatibility</span>
              </div>

              <AnimatePresence>
                {scoredJobs.map((job, index) => {
                  const isSelected = activeSelected?.id === job.id;
                  const isSaved = savedJobIds.includes(job.id);
                  const m = match(job);
                  const score = m?.compatibilityScore;

                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      onClick={() => setSelectedJob(job)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-zinc-900 border-yellow-400 shadow-md ring-1 ring-yellow-400/20'
                          : 'bg-[#0a0a0a] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-zinc-100 truncate mb-0.5">{job.title}</h3>
                          <div className="text-xs text-zinc-400 truncate">
                            {job.company} · {job.location || (job.remote ? 'Remote' : 'Location Unspecified')}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div
                            className={`text-xl font-black font-display ${
                              typeof score === 'number' && score >= 75 ? 'text-yellow-400' : 'text-white'
                            }`}
                          >
                            {typeof score === 'number' ? `${score}%` : '—'}
                          </div>
                          <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                            {score != null ? 'Match' : 'Unscored'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-900">
                        <span className="truncate">{job.freshnessLabel || 'Live listing'}</span>
                        <div className="flex items-center gap-2">
                          {job.remote && (
                            <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-mono">
                              Remote
                            </span>
                          )}
                          {isSaved && (
                            <span className="text-yellow-400 font-bold text-[10px] flex items-center gap-1">
                              <BookmarkCheck className="w-3 h-3" /> Saved
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Right details panel */}
            <div className="w-full lg:w-7/12 lg:sticky lg:top-20">
              <AnimatePresence mode="wait">
                {activeSelected ? (
                  <motion.div
                    key={activeSelected.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 pb-6 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 text-[10px] font-mono font-bold tracking-widest uppercase border border-yellow-400/30">
                            {activeSelected.primarySource || 'Official Source'}
                          </span>
                          {activeSelected.remote && (
                            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-300 text-[10px] font-mono rounded">
                              Remote
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-black text-white leading-tight">
                          {activeSelected.title}
                        </h2>
                        <div className="text-sm font-semibold text-zinc-400 mt-1">
                          {activeSelected.company} · {activeSelected.location || 'Location Not Specified'}
                        </div>
                      </div>

                      <button
                        onClick={() => onToggleSaveJob(activeSelected.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer ${
                          savedJobIds.includes(activeSelected.id)
                            ? 'bg-yellow-400/10 border-yellow-400/60 text-yellow-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                        title="Save Job"
                      >
                        {savedJobIds.includes(activeSelected.id) ? (
                          <BookmarkCheck className="w-5 h-5" />
                        ) : (
                          <Bookmark className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Compatibility scorecard */}
                    {(() => {
                      const m = match(activeSelected);
                      return (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">Match Score</div>
                              <div className="text-2xl font-black text-yellow-400 font-display mt-0.5">
                                {m?.compatibilityScore != null ? `${m.compatibilityScore}%` : '—'}
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">Experience</div>
                              <div className="text-sm font-bold text-white mt-1">
                                {activeSelected.minYearsExperience
                                  ? `${activeSelected.minYearsExperience}+ yrs`
                                  : 'Not specified'}
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">Posting Date</div>
                              <div className="text-sm font-bold text-white mt-1">
                                {activeSelected.freshnessLabel || 'Live'}
                              </div>
                            </div>

                            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                              <div className="text-[10px] font-mono text-zinc-500 uppercase">Source ATS</div>
                              <div className="text-sm font-bold text-white mt-1 truncate">
                                {activeSelected.sourcesList?.[0]?.sourceName || activeSelected.primarySource || 'Direct ATS'}
                              </div>
                            </div>
                          </div>

                          {/* Matched Skills */}
                          <div>
                            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                              Verified Skill Alignment
                            </h4>
                            {m?.matchedSkills?.length ? (
                              <div className="flex flex-wrap gap-2">
                                {m.matchedSkills.map((s: string) => (
                                  <span
                                    key={s}
                                    className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs rounded-lg flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                    <span>{s}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-500">
                                Skills could not be automatically matched against the current job snippet.
                              </p>
                            )}
                          </div>

                          {/* Missing Skills */}
                          {m?.missingSkills?.length > 0 && (
                            <div>
                              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                Potential Skill Gaps
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {m.missingSkills.map((s: string) => (
                                  <span
                                    key={s}
                                    className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Description summary */}
                          {activeSelected.description && (
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
                              <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                                Job Description Excerpt
                              </h4>
                              <p className="text-xs text-zinc-300 leading-relaxed max-h-40 overflow-y-auto font-mono whitespace-pre-wrap">
                                {activeSelected.description}
                              </p>
                            </div>
                          )}

                          {/* Action footer */}
                          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                            {activeSelected.applicationUrl ? (
                              <a
                                href={activeSelected.applicationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
                              >
                                <span>View official listing</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-yellow-400" />
                              </a>
                            ) : (
                              <span className="text-xs text-zinc-600 font-mono">Direct application link saved</span>
                            )}

                            <button
                              onClick={() => setPreparingJob(activeSelected)}
                              className="w-full sm:w-auto px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Prepare Application</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <div className="h-64 flex items-center justify-center border border-dashed border-zinc-800 rounded-2xl">
                    <span className="text-xs text-zinc-500">Select a job position to inspect details.</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Preparation Modal */}
      {preparingJob && (
        <ApplicationPreparationModal
          job={preparingJob}
          userProfile={userProfile}
          isOpen={Boolean(preparingJob)}
          onClose={() => setPreparingJob(null)}
          onSaveToTracker={onSaveToTracker}
        />
      )}
    </div>
  );
};
