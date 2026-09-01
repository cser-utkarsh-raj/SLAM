import React from 'react';
import { 
  Layers, 
  Trash2, 
  ArrowRight, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase, 
  UserCheck 
} from 'lucide-react';
import { JobPosting, UserProfile } from '../types';

interface JobComparisonViewProps {
  allJobs: JobPosting[];
  compareJobIds: string[];
  userProfile: UserProfile;
  onRemoveFromCompare: (jobId: string) => void;
  onAddToCompare: (jobId: string) => void;
  onPrepareJob: (job: JobPosting) => void;
}

export const JobComparisonView: React.FC<JobComparisonViewProps> = ({
  allJobs,
  compareJobIds,
  userProfile,
  onRemoveFromCompare,
  onAddToCompare,
  onPrepareJob,
}) => {
  const comparedJobs = allJobs.filter((j) => compareJobIds.includes(j.id));
  const unselectedJobs = allJobs.filter((j) => !compareJobIds.includes(j.id));

  const getJobScore = (job: JobPosting) => {
    const userSkills = new Set(userProfile.skills.map((s) => s.toLowerCase()));
    const matched = job.requiredSkills.filter((s) => userSkills.has(s.toLowerCase()));
    const skillRatio = matched.length / Math.max(job.requiredSkills.length, 1);
    const expScore = Math.min(20, Math.round((userProfile.yearsOfExperience / Math.max(job.minYearsExperience, 1)) * 20));
    return Math.min(100, Math.max(45, Math.round(skillRatio * 30 + expScore + 15 + 10 + 10)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5 font-display">
            <Layers className="w-6 h-6 text-yellow-400" />
            <span>Multi-Job Comparison Matrix</span>
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 font-medium">
            Compare 2 to 4 opportunities side-by-side across compatibility, salary, required skills, application friction, and freshness.
          </p>
        </div>

        {comparedJobs.length > 0 && (
          <button
            onClick={() => compareJobIds.forEach((id) => onRemoveFromCompare(id))}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold rounded-lg border border-zinc-800 self-start sm:self-auto transition"
          >
            Clear Matrix
          </button>
        )}
      </div>

      {comparedJobs.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-yellow-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">No jobs currently selected for comparison</h2>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Select 2 to 4 opportunities from the list below to compare compensation bands, requirements, and profile compatibility.
            </p>
          </div>

          {/* Quick Add List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto text-left">
            {allJobs.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center justify-between gap-3 transition"
              >
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{job.title}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{job.company} • {job.location}</div>
                </div>
                <button
                  onClick={() => onAddToCompare(job.id)}
                  className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-950">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="p-4 w-48 text-xs font-mono uppercase text-zinc-400 font-semibold">Criteria</th>
                  {comparedJobs.map((job) => (
                    <th key={job.id} className="p-4 w-72 text-left relative align-top">
                      <button
                        onClick={() => onRemoveFromCompare(job.id)}
                        className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-red-400 rounded transition"
                        title="Remove from comparison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="pr-6 space-y-1">
                        <div className="text-sm font-extrabold text-white tracking-tight">{job.title}</div>
                        <div className="text-xs font-semibold text-yellow-400">{job.company}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/80 text-xs">
                {/* Row 1: Compatibility Score */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Compatibility Fit</td>
                  {comparedJobs.map((job) => {
                    const score = getJobScore(job);
                    return (
                      <td key={job.id} className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black font-mono text-yellow-400">{score}%</span>
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                            {score >= 90 ? 'Top Match' : score >= 80 ? 'Strong Match' : 'Moderate'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>

                {/* Row 2: Location & Work Mode */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Location &amp; Policy</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4 text-zinc-300">
                      <div className="font-semibold text-white">{job.location}</div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{job.remoteType} • {job.employmentType}</div>
                    </td>
                  ))}
                </tr>

                {/* Row 3: Compensation */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Compensation</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4">
                      {job.salaryText ? (
                        <div className="font-mono text-emerald-400 font-bold">{job.salaryText}</div>
                      ) : (
                        <div className="text-zinc-500 italic">Undisclosed / Market standard</div>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 4: Experience Level */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Experience Min</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4 text-zinc-300 font-mono">
                      {job.minYearsExperience}+ Years Required ({job.experienceLevel})
                    </td>
                  ))}
                </tr>

                {/* Row 5: Required vs Matched Skills */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400 align-top">Skills Match</td>
                  {comparedJobs.map((job) => {
                    const userSkills = new Set(userProfile.skills.map((s) => s.toLowerCase()));
                    return (
                      <td key={job.id} className="p-4 space-y-2 align-top">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
                            Matched Skills
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {job.requiredSkills
                              .filter((s) => userSkills.has(s.toLowerCase()))
                              .map((s) => (
                                <span key={s} className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded text-[10px] font-mono">
                                  {s}
                                </span>
                              ))}
                          </div>
                        </div>

                        {job.requiredSkills.some((s) => !userSkills.has(s.toLowerCase())) && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                              Missing / Not Listed
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {job.requiredSkills
                                .filter((s) => !userSkills.has(s.toLowerCase()))
                                .map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded text-[10px] font-mono">
                                    {s}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* Row 6: Freshness & Deduplicated Sources */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Freshness &amp; Sources</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4 text-zinc-300 space-y-1">
                      <div className="font-mono text-[11px] text-zinc-200">{job.freshnessLabel}</div>
                      <div className="text-[10px] text-zinc-500">{job.sourcesList.map((s) => s.sourceName).join(', ')}</div>
                    </td>
                  ))}
                </tr>

                {/* Row 7: Application Method */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Application Method</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-mono text-[11px]">
                        {job.applicationMethod}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Row 8: Public Recruiter Info */}
                <tr className="hover:bg-zinc-900/40">
                  <td className="p-4 font-mono font-bold text-zinc-400">Recruiter Contact</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4">
                      {job.recruiterName ? (
                        <div className="text-zinc-200">
                          <div className="font-semibold">{job.recruiterName}</div>
                          {job.recruiterEmail && (
                            <div className="text-[11px] text-zinc-400 font-mono">{job.recruiterEmail}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic">No public recruiter listed</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Row 9: Actions */}
                <tr className="bg-zinc-900/50">
                  <td className="p-4 font-mono font-bold text-zinc-400">Action</td>
                  {comparedJobs.map((job) => (
                    <td key={job.id} className="p-4">
                      <button
                        onClick={() => onPrepareJob(job)}
                        className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs rounded-lg shadow transition flex items-center justify-center gap-1.5"
                      >
                        <span>Prepare Application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Option to Add Additional Jobs if < 4 */}
          {comparedJobs.length < 4 && unselectedJobs.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Add another job to this matrix ({comparedJobs.length}/4 selected)
              </h3>
              <div className="flex flex-wrap gap-2">
                {unselectedJobs.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => onAddToCompare(j.id)}
                    className="px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 rounded-lg flex items-center gap-2 transition"
                  >
                    <Plus className="w-3 h-3 text-yellow-400" />
                    <span>{j.company}: {j.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
