import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ProfileView } from './components/ProfileView';
import { JobDiscoveryView } from './components/JobDiscoveryView';
import { JobComparisonView } from './components/JobComparisonView';
import { ApplicationPrepView } from './components/ApplicationPrepView';
import { AutomationRunnerView } from './components/AutomationRunnerView';
import { TrackerView } from './components/TrackerView';
import { PythonEngineExplorer } from './components/PythonEngineExplorer';
import { 
  INITIAL_USER_PROFILE, 
  INITIAL_JOB_POSTINGS, 
  INITIAL_ANSWER_LIBRARY, 
  INITIAL_APPLICATION_RECORDS 
} from './data';
import { 
  UserProfile, 
  JobPosting, 
  ApplicationAnswer, 
  ApplicationRecord, 
  TailoredResume, 
  ApplicationStatus 
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discovery');

  // Career Profile State
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('slam_user_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_USER_PROFILE;
  });

  // Jobs State
  const [jobs, setJobs] = useState<JobPosting[]>(() => {
    const saved = localStorage.getItem('slam_jobs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_JOB_POSTINGS;
  });

  // Saved Jobs
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('slam_saved_job_ids');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ['job-stripe-01'];
  });

  // Compared Jobs
  const [compareJobIds, setCompareJobIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('slam_compare_job_ids');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return ['job-stripe-01', 'job-linear-02'];
  });

  // Answer Library
  const [answerLibrary, setAnswerLibrary] = useState<ApplicationAnswer[]>(() => {
    const saved = localStorage.getItem('slam_answer_library');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_ANSWER_LIBRARY;
  });

  // Application Records (Tracker)
  const [applicationRecords, setApplicationRecords] = useState<ApplicationRecord[]>(() => {
    const saved = localStorage.getItem('slam_app_records');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_APPLICATION_RECORDS;
  });

  // Selected Target Job for Preparation / Runner
  const [selectedJob, setSelectedJob] = useState<JobPosting>(jobs[0]);

  // Prepared Artifacts Cache
  const [preparedTailoredResume, setPreparedTailoredResume] = useState<TailoredResume | null>(null);
  const [preparedCoverLetter, setPreparedCoverLetter] = useState<string>('');
  const [preparedAnswers, setPreparedAnswers] = useState<{ question: string; answer: string }[]>([]);

  // Health / AI Key state
  const [hasAiKey, setHasAiKey] = useState<boolean>(true);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('slam_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('slam_saved_job_ids', JSON.stringify(savedJobIds));
  }, [savedJobIds]);

  useEffect(() => {
    localStorage.setItem('slam_compare_job_ids', JSON.stringify(compareJobIds));
  }, [compareJobIds]);

  useEffect(() => {
    localStorage.setItem('slam_answer_library', JSON.stringify(answerLibrary));
  }, [answerLibrary]);

  useEffect(() => {
    localStorage.setItem('slam_app_records', JSON.stringify(applicationRecords));
  }, [applicationRecords]);

  // Check health endpoint
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.hasAiKey === 'boolean') {
          setHasAiKey(data.hasAiKey);
        }
      })
      .catch(() => {});
  }, []);

  // Handlers
  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleToggleCompareJob = (job: JobPosting) => {
    setCompareJobIds((prev) =>
      prev.includes(job.id) ? prev.filter((id) => id !== job.id) : [...prev, job.id]
    );
  };

  const handleAddToCompare = (jobId: string) => {
    if (!compareJobIds.includes(jobId) && compareJobIds.length < 4) {
      setCompareJobIds((prev) => [...prev, jobId]);
    }
  };

  const handleRemoveFromCompare = (jobId: string) => {
    setCompareJobIds((prev) => prev.filter((id) => id !== jobId));
  };

  const handlePrepareJob = (job: JobPosting) => {
    setSelectedJob(job);
    setActiveTab('prep');
  };

  const handleLaunchAutomation = (
    job: JobPosting,
    tailoredResume: TailoredResume | null,
    coverLetter: string,
    answers: { question: string; answer: string }[]
  ) => {
    setSelectedJob(job);
    setPreparedTailoredResume(tailoredResume);
    setPreparedCoverLetter(coverLetter);
    setPreparedAnswers(answers);
    setActiveTab('automation');
  };

  const handleSaveToTracker = (
    job: JobPosting,
    tailoredResume: TailoredResume | null,
    coverLetter: string,
    answers: { question: string; answer: string }[]
  ) => {
    const existingIndex = applicationRecords.findIndex((r) => r.jobId === job.id);
    const newRecord: ApplicationRecord = {
      id: `app-rec-${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      salaryText: job.salaryText,
      dateDiscovered: job.postingDate,
      dateApplied: undefined,
      status: 'PREPARED',
      compatibilityScore: 92,
      applicationMode: 'REVIEW',
      tailoredResume: tailoredResume || undefined,
      coverLetter: coverLetter || undefined,
      submittedAnswers: answers,
      notes: 'Application package prepared and audited.',
      applicationUrl: job.applicationUrl,
      source: job.primarySource,
      lastUpdated: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      setApplicationRecords((prev) => {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...newRecord, id: copy[existingIndex].id };
        return copy;
      });
    } else {
      setApplicationRecords((prev) => [newRecord, ...prev]);
    }

    setActiveTab('tracker');
  };

  const handleMarkApplied = (job: JobPosting, mode: 'REVIEW' | 'ASSISTED' | 'AUTOMATED') => {
    const existingIndex = applicationRecords.findIndex((r) => r.jobId === job.id);
    const today = new Date().toISOString().split('T')[0];

    if (existingIndex >= 0) {
      setApplicationRecords((prev) => {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          status: 'APPLIED',
          dateApplied: today,
          applicationMode: mode,
          lastUpdated: new Date().toISOString(),
        };
        return copy;
      });
    } else {
      const newRecord: ApplicationRecord = {
        id: `app-rec-${Date.now()}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        salaryText: job.salaryText,
        dateDiscovered: job.postingDate,
        dateApplied: today,
        status: 'APPLIED',
        compatibilityScore: 94,
        applicationMode: mode,
        tailoredResume: preparedTailoredResume || undefined,
        coverLetter: preparedCoverLetter || undefined,
        submittedAnswers: preparedAnswers,
        notes: `Applied via ${mode} mode on official portal.`,
        applicationUrl: job.applicationUrl,
        source: job.primarySource,
        lastUpdated: new Date().toISOString(),
      };
      setApplicationRecords((prev) => [newRecord, ...prev]);
    }
  };

  const handleUpdateRecordStatus = (id: string, newStatus: ApplicationStatus) => {
    setApplicationRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status: newStatus, lastUpdated: new Date().toISOString() } : rec))
    );
  };

  const handleUpdateRecordNotes = (id: string, notes: string) => {
    setApplicationRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, notes, lastUpdated: new Date().toISOString() } : rec))
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        savedJobsCount={savedJobIds.length}
        compareJobsCount={compareJobIds.length}
        activeApplicationsCount={applicationRecords.length}
        hasAiKey={hasAiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        {activeTab === 'discovery' && (
          <JobDiscoveryView
            jobs={jobs}
            userProfile={userProfile}
            savedJobIds={savedJobIds}
            onToggleSaveJob={handleToggleSaveJob}
            compareJobIds={compareJobIds}
            onToggleCompareJob={handleToggleCompareJob}
            onPrepareJob={handlePrepareJob}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
          />
        )}

        {activeTab === 'compare' && (
          <JobComparisonView
            allJobs={jobs}
            compareJobIds={compareJobIds}
            userProfile={userProfile}
            onRemoveFromCompare={handleRemoveFromCompare}
            onAddToCompare={handleAddToCompare}
            onPrepareJob={handlePrepareJob}
          />
        )}

        {activeTab === 'prep' && (
          <ApplicationPrepView
            selectedJob={selectedJob}
            allJobs={jobs}
            onSelectJob={setSelectedJob}
            userProfile={userProfile}
            answerLibrary={answerLibrary}
            onUpdateAnswerLibrary={setAnswerLibrary}
            onLaunchAutomation={handleLaunchAutomation}
            onSaveToTracker={handleSaveToTracker}
          />
        )}

        {activeTab === 'automation' && (
          <AutomationRunnerView
            selectedJob={selectedJob}
            allJobs={jobs}
            onSelectJob={setSelectedJob}
            userProfile={userProfile}
            tailoredResume={preparedTailoredResume}
            coverLetter={preparedCoverLetter}
            answers={preparedAnswers}
            onMarkApplied={handleMarkApplied}
          />
        )}

        {activeTab === 'tracker' && (
          <TrackerView
            applications={applicationRecords}
            onUpdateStatus={handleUpdateRecordStatus}
            onUpdateNotes={handleUpdateRecordNotes}
          />
        )}

        {activeTab === 'python' && (
          <PythonEngineExplorer
            userProfile={userProfile}
            selectedJob={selectedJob}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-6 px-4 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">SLAM</span>
            <span>•</span>
            <span>Precision Career Match &amp; Assisted Application Platform</span>
          </div>
          <div>
            <span>Human-in-the-Loop Safe Architecture • Zero-Fabrication Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
