import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, JobPosting, TailoredResume, ApplicationAnswer } from '../types';
import { calculateCompatibility } from '../utils/scoring';
import { Bookmark, BookmarkCheck, ArrowUpRight, FileText, CheckCircle2 } from 'lucide-react';

interface JobDiscoveryViewProps {
  jobs: JobPosting[];
  userProfile: UserProfile;
  savedJobIds: string[];
  onToggleSaveJob: (jobId: string) => void;
  compareJobIds: string[];
  onToggleCompareJob: (job: JobPosting) => void;
  onPrepareJob: (job: JobPosting) => void;
  answerLibrary: ApplicationAnswer[];
  onUpdateAnswerLibrary: (library: ApplicationAnswer[]) => void;
  onLaunchAutomation: (
    job: JobPosting,
    tailoredResume: TailoredResume | null,
    coverLetter: string,
    answers: { question: string; answer: string }[]
  ) => void;
  onSaveToTracker: (
    job: JobPosting,
    tailoredResume: TailoredResume | null,
    coverLetter: string,
    answers: { question: string; answer: string }[]
  ) => void;
}

export const JobDiscoveryView: React.FC<JobDiscoveryViewProps> = ({
  jobs,
  userProfile,
  savedJobIds,
  onToggleSaveJob,
  onPrepareJob,
  onLaunchAutomation,
  onSaveToTracker
}) => {
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  // Score all jobs using the SINGLE SOURCE OF TRUTH
  const scoredJobs = useMemo(() => {
    return jobs.map(job => {
      const comp = calculateCompatibility(userProfile, job);
      return { ...job, _score: comp };
    }).sort((a, b) => b._score.compatibilityScore - a._score.compatibilityScore);
  }, [jobs, userProfile]);

  return (
    <div className="w-full relative min-h-screen">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-[linear-gradient(to_bottom,transparent,rgba(250,204,21,0.05)_50%,transparent)]" />
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Huge Typography Header */}
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="text-sm font-bold text-zinc-500 tracking-widest uppercase mb-4">
            GOOD EVENING, {userProfile.name.split(' ')[0].toUpperCase()}
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black text-white leading-[0.9] tracking-tight">
            FIND YOUR <br/>
            BEST MATCH.
          </h1>
          <p className="mt-6 text-zinc-400 text-lg sm:text-xl font-sans tracking-wide">
            {scoredJobs.length} opportunities align with your profile.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-8">
             <div className="px-3 py-1.5 bg-yellow-400 text-black text-xs font-black tracking-widest uppercase cursor-pointer">
               90%+ Top Matches
             </div>
             <div className="px-3 py-1.5 bg-zinc-900 text-zinc-400 text-xs font-bold tracking-widest uppercase border border-zinc-800 cursor-pointer hover:bg-zinc-800 hover:text-white transition-colors">
               New Today
             </div>
             <div className="px-3 py-1.5 bg-zinc-900 text-zinc-400 text-xs font-bold tracking-widest uppercase border border-zinc-800 cursor-pointer hover:bg-zinc-800 hover:text-white transition-colors">
               Remote
             </div>
             <div className="px-3 py-1.5 bg-zinc-900 text-zinc-400 text-xs font-bold tracking-widest uppercase border border-zinc-800 cursor-pointer hover:bg-zinc-800 hover:text-white transition-colors">
               Easy Apply
             </div>
          </div>
        </motion.div>

        {/* Split Screen Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Panel: Job List */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900">
              <span className="text-xs font-bold text-zinc-500 tracking-widest uppercase">Top Matches</span>
            </div>
            
            <div className="flex flex-col gap-2">
              <AnimatePresence>
                {scoredJobs.map((job, index) => {
                  const isSelected = selectedJob?.id === job.id;
                  const isSaved = savedJobIds.includes(job.id);

                  return (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      onClick={() => setSelectedJob(job)}
                      className={`group cursor-pointer p-5 border-l-4 transition-all duration-200 ${
                        isSelected 
                          ? 'bg-zinc-900 border-yellow-400' 
                          : 'bg-[#0a0a0a] border-transparent hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold font-sans tracking-tight mb-1 ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                            {job.title}
                          </h3>
                          <div className="text-sm font-medium text-zinc-400">
                            {job.company} · {job.location}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-black font-display tracking-tighter ${
                             job._score.compatibilityScore >= 90 ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {job._score.compatibilityScore}%
                          </div>
                          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Match</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-zinc-500">
                         <span className="flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                           {job.freshnessLabel}
                         </span>
                         <span>{job.employmentType}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel: Detail View */}
          <div className="w-full lg:w-7/12 sticky top-24">
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, filter: 'blur(4px)' }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#0a0a0a] border border-zinc-900 p-8 shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-8">
                     <div>
                       <h2 className="text-3xl font-display font-black text-white mb-2 leading-none">{selectedJob.title}</h2>
                       <div className="text-lg text-zinc-400 font-medium">{selectedJob.company}</div>
                     </div>
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSaveJob(selectedJob.id);
                        }}
                        className={`p-3 border transition-colors ${
                          savedJobIds.includes(selectedJob.id)
                            ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-900'
                        }`}
                      >
                        {savedJobIds.includes(selectedJob.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                      </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                     <div className="space-y-1">
                       <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Compatibility</div>
                       <div className="text-2xl font-black text-yellow-400 font-display">
                         {
                           // @ts-ignore
                           selectedJob._score.compatibilityScore
                         }%
                       </div>
                     </div>
                     <div className="space-y-1">
                       <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Location</div>
                       <div className="text-sm font-medium text-white">{selectedJob.location}</div>
                     </div>
                     <div className="space-y-1">
                       <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Posted</div>
                       <div className="text-sm font-medium text-white">{selectedJob.freshnessLabel}</div>
                     </div>
                     <div className="space-y-1">
                       <div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Applicants</div>
                       <div className="text-sm font-medium text-white">{selectedJob.applicantCount || 'N/A'}</div>
                     </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Why you match</h3>
                      <div className="space-y-2">
                        {
                          // @ts-ignore
                          selectedJob._score.matchedSkills.map((skill: string) => (
                          <div key={skill} className="flex items-center gap-2 text-sm text-zinc-300">
                             <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                             <span>{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    { 
                      // @ts-ignore
                      selectedJob._score.missingSkills.length > 0 && (
                      <div>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Missing</h3>
                        <div className="flex flex-wrap gap-2">
                          {
                            // @ts-ignore
                            selectedJob._score.missingSkills.map((skill: string) => (
                            <span key={skill} className="px-3 py-1 bg-zinc-900 text-zinc-500 text-xs font-mono">
                               {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-8 border-t border-zinc-900 flex items-center justify-between">
                      <a href={selectedJob.applicationUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                        View source listing <ArrowUpRight className="w-3 h-3" />
                      </a>
                      
                      <button 
                        onClick={() => onPrepareJob(selectedJob)}
                        className="px-8 py-4 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-yellow-400 transition-colors"
                      >
                        Prepare Application
                      </button>
                    </div>
                  </div>

                </motion.div>
              ) : (
                <div className="h-[400px] flex items-center justify-center border border-dashed border-zinc-900">
                  <span className="text-sm font-medium text-zinc-600 tracking-wide">Select a position to view details</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
