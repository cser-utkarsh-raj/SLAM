import React, { useState } from 'react';
import { JobPosting, UserProfile, TailoredResume, ApplicationAnswer } from '../types';
import { ApplicationPreparationModal } from './ApplicationPreparationModal';
import { 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  Sparkles, 
  ArrowUpRight, 
  Search, 
  Compass 
} from 'lucide-react';

interface Props {
  jobs: JobPosting[];
  savedJobIds: string[];
  userProfile: UserProfile;
  onToggleSaveJob: (id: string) => void;
  onNavigateToDiscover: () => void;
  onSaveToTracker: (
    job: JobPosting,
    resume: TailoredResume | null,
    letter: string,
    answers: { question: string; answer: string }[]
  ) => void;
}

export const SavedJobsView: React.FC<Props> = ({
  jobs,
  savedJobIds,
  userProfile,
  onToggleSaveJob,
  onNavigateToDiscover,
  onSaveToTracker,
}) => {
  const [preparingJob, setPreparingJob] = useState<JobPosting | null>(null);
  const [filterText, setFilterText] = useState('');

  const savedJobs = jobs.filter((j) => savedJobIds.includes(j.id));
  const filtered = savedJobs.filter(
    (j) =>
      j.title.toLowerCase().includes(filterText.toLowerCase()) ||
      j.company.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-5 h-5 text-yellow-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">
              Saved Opportunities
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-black text-white">
            SAVED JOBS ({savedJobIds.length})
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Bookmarked positions for in-depth review, tailoring, and application preparation.
          </p>
        </div>

        {savedJobs.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter saved jobs..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-400"
            />
          </div>
        )}
      </div>

      {savedJobs.length === 0 ? (
        <div className="text-center py-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
          <Bookmark className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-display font-black text-white">NO SAVED POSITIONS</h2>
          <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto">
            Browse live listings in Job Discovery and click the bookmark icon to save roles here.
          </p>
          <button
            onClick={onNavigateToDiscover}
            className="mt-6 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider rounded-lg inline-flex items-center gap-2 cursor-pointer shadow"
          >
            <Compass className="w-4 h-4" />
            <span>Discover Live Roles</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => {
            const matchScore = (job as any).match?.compatibilityScore;
            return (
              <div
                key={job.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between gap-4 hover:border-zinc-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        {job.primarySource || 'Live Listing'}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{job.title}</h3>
                      <div className="text-xs text-zinc-400 font-medium">
                        {job.company} · {job.location || 'Location Not Specified'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-yellow-400 font-display">
                        {matchScore != null ? `${matchScore}%` : '—'}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 uppercase">Match</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                    <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded">
                      {job.freshnessLabel || 'Live'}
                    </span>
                    {job.remote && (
                      <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-emerald-400">
                        Remote
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onToggleSaveJob(job.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {job.applicationUrl && (
                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        <span>Listing</span>
                        <ArrowUpRight className="w-3 h-3 text-yellow-400" />
                      </a>
                    )}
                    <button
                      onClick={() => setPreparingJob(job)}
                      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Prepare Application</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
