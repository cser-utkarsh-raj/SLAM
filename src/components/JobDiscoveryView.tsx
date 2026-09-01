import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Clock, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck, 
  Layers, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Briefcase, 
  UserCheck, 
  ArrowUpRight 
} from 'lucide-react';
import { JobPosting, UserProfile } from '../types';
import { CompatibilityModal } from './CompatibilityModal';

interface JobDiscoveryViewProps {
  jobs: JobPosting[];
  userProfile: UserProfile;
  savedJobIds: string[];
  onToggleSaveJob: (jobId: string) => void;
  compareJobIds: string[];
  onToggleCompareJob: (job: JobPosting) => void;
  onPrepareJob: (job: JobPosting) => void;
}

export const JobDiscoveryView: React.FC<JobDiscoveryViewProps> = ({
  jobs,
  userProfile,
  savedJobIds,
  onToggleSaveJob,
  compareJobIds,
  onToggleCompareJob,
  onPrepareJob,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [selectedJobForModal, setSelectedJobForModal] = useState<JobPosting | null>(null);
  const [inspectingJob, setInspectingJob] = useState<JobPosting | null>(null);

  // Simple deterministic compatibility quick-scorer
  const getQuickScore = (job: JobPosting) => {
    const userSkills = new Set(userProfile.skills.map((s) => s.toLowerCase()));
    const matched = job.requiredSkills.filter((s) => userSkills.has(s.toLowerCase()));
    const skillRatio = matched.length / Math.max(job.requiredSkills.length, 1);
    const expScore = Math.min(20, Math.round((userProfile.yearsOfExperience / Math.max(job.minYearsExperience, 1)) * 20));
    const titleMatch = (userProfile.headline || '').toLowerCase().includes(job.title.toLowerCase().split(' ')[0]) ? 15 : 10;
    return Math.min(100, Math.max(45, Math.round(skillRatio * 30 + expScore + titleMatch + 15 + 10)));
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCompany = job.company.toLowerCase().includes(q);
        const matchesSkills = job.requiredSkills.some((s) => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCompany && !matchesSkills) return false;
      }

      // Location filter
      if (selectedLocation !== 'All' && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      // Remote filter
      if (remoteOnly && !job.remote) {
        return false;
      }

      // Match score filter
      if (minMatchScore > 0) {
        const score = getQuickScore(job);
        if (score < minMatchScore) return false;
      }

      return true;
    });
  }, [jobs, searchQuery, selectedLocation, remoteOnly, minMatchScore, userProfile]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Search & Filter Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-display">
            <Search className="w-6 h-6 text-yellow-400" />
            <span>Multi-Source Job Discovery</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
            Deduplicated jobs consolidated across direct company ATS systems, public boards, and career aggregators.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          {/* Main Search Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search by role, required skills (React, TypeScript), or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-yellow-400"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 py-2 text-xs text-zinc-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Secondary Quick Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-medium">Location:</span>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400"
              >
                <option value="All">All Locations</option>
                <option value="San Francisco">San Francisco, CA</option>
                <option value="New York">New York, NY</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg hover:border-zinc-700">
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                className="rounded border-zinc-700 text-yellow-400 focus:ring-0"
              />
              <span className="text-zinc-300">Remote Only</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-zinc-400 font-medium">Min Match:</span>
              <select
                value={minMatchScore}
                onChange={(e) => setMinMatchScore(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-yellow-400"
              >
                <option value={0}>All Scores</option>
                <option value={80}>80%+ Strong Match</option>
                <option value={90}>90%+ Top Match</option>
              </select>
            </div>

            <div className="ml-auto text-xs font-mono text-zinc-400">
              Showing <span className="text-yellow-400 font-bold">{filteredJobs.length}</span> verified postings
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List Grid */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No matching job postings found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Try loosening your search filters or clear the keywords query to discover additional verified opportunities.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('All');
                setRemoteOnly(false);
                setMinMatchScore(0);
              }}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filteredJobs.map((job) => {
            const score = getQuickScore(job);
            const isSaved = savedJobIds.includes(job.id);
            const isCompared = compareJobIds.includes(job.id);

            return (
              <div
                key={job.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 sm:p-6 transition-all space-y-4 shadow-sm"
              >
                {/* Top Row: Title, Company, Badges, Match Score */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 
                        onClick={() => setInspectingJob(job)}
                        className="text-base sm:text-lg font-bold text-white hover:text-yellow-400 cursor-pointer transition tracking-tight"
                      >
                        {job.title}
                      </h2>
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] font-semibold border border-zinc-700">
                        {job.employmentType}
                      </span>
                      {job.remote && (
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-800/60">
                          Remote
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                      <span className="font-semibold text-zinc-200">{job.company}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        {job.location}
                      </span>
                      {job.salaryText && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium font-mono">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.salaryText}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-zinc-500 font-mono text-[11px]">
                        <Clock className="w-3 h-3" />
                        {job.freshnessLabel}
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Badge Button */}
                  <button
                    onClick={() => setSelectedJobForModal(job)}
                    className="flex items-center gap-2.5 px-3.5 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-lg self-start transition group"
                  >
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                        Compatibility
                      </span>
                      <span className="text-lg font-extrabold font-mono text-yellow-400">
                        {score}%
                      </span>
                    </div>
                    <Sparkles className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition" />
                  </button>
                </div>

                {/* Deduplication & Source Tracking Bar */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <span className="font-semibold text-zinc-300">Sources ({job.sourcesList.length}):</span>
                    <span>{job.sourcesList.map((s) => s.sourceName).join(' • ')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                    {job.applicantCount && <span>{job.applicantCount}</span>}
                    <span className="text-zinc-500">Method: <strong className="text-zinc-300 font-normal">{job.applicationMethod}</strong></span>
                  </div>
                </div>

                {/* Skills Match Pill Preview */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-mono text-zinc-500 mr-1">Required:</span>
                  {job.requiredSkills.map((skill) => {
                    const isMatched = userProfile.skills.some(
                      (s) => s.toLowerCase() === skill.toLowerCase()
                    );
                    return (
                      <span
                        key={skill}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border ${
                          isMatched
                            ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {skill}
                      </span>
                    );
                  })}
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleSaveJob(job.id)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSaved
                          ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                      }`}
                      title={isSaved ? 'Job Saved' : 'Save Job'}
                    >
                      {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <button
                      onClick={() => onToggleCompareJob(job)}
                      className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                        isCompared
                          ? 'bg-zinc-800 text-yellow-400 border-yellow-400/50'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
                      }`}
                      title="Compare against other jobs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isCompared ? 'Comparing' : 'Compare'}</span>
                    </button>

                    <button
                      onClick={() => setSelectedJobForModal(job)}
                      className="px-3 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 text-xs font-medium rounded-lg border border-zinc-800 transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Explain Match</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectingJob(job)}
                      className="px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => onPrepareJob(job)}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Prepare Application</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Deep Compatibility Breakdown Modal */}
      {selectedJobForModal && (
        <CompatibilityModal
          job={selectedJobForModal}
          userProfile={userProfile}
          onClose={() => setSelectedJobForModal(null)}
          onPrepareJob={onPrepareJob}
          onToggleCompare={onToggleCompareJob}
          isCompared={compareJobIds.includes(selectedJobForModal.id)}
        />
      )}

      {/* Inspecting Job Drawer/Modal */}
      {inspectingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setInspectingJob(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2"
            >
              ✕
            </button>

            <div className="border-b border-zinc-800 pb-4 pr-10 space-y-1">
              <h2 className="text-xl font-bold text-white">{inspectingJob.title}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">{inspectingJob.company}</span>
                <span>{inspectingJob.location}</span>
                {inspectingJob.salaryText && <span className="text-emerald-400">{inspectingJob.salaryText}</span>}
                <span className="font-mono text-zinc-500">{inspectingJob.freshnessLabel}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div>
                <h3 className="font-mono font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
                  About the Opportunity
                </h3>
                <p className="text-zinc-300 whitespace-pre-wrap">{inspectingJob.description}</p>
              </div>

              <div>
                <h3 className="font-mono font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
                  Key Responsibilities
                </h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  {inspectingJob.responsibilities.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-mono font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
                  Requirements &amp; Qualifications
                </h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-300">
                  {inspectingJob.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </div>

              {inspectingJob.recruiterName && (
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
                  <h4 className="font-mono font-bold text-zinc-400 uppercase tracking-wider text-[11px]">
                    Publicly Listed Contact
                  </h4>
                  <div className="text-zinc-200 font-semibold">{inspectingJob.recruiterName}</div>
                  {inspectingJob.recruiterEmail && (
                    <div className="text-zinc-400 font-mono text-[11px]">{inspectingJob.recruiterEmail}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
              <a
                href={inspectingJob.applicationUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
              >
                <span>Direct Listing URL</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const j = inspectingJob;
                    setInspectingJob(null);
                    onPrepareJob(j);
                  }}
                  className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold rounded-lg shadow transition"
                >
                  Prepare Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
