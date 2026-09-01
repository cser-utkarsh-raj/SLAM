import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { ProfileView } from './components/ProfileView';
import { JobDiscoveryView } from './components/JobDiscoveryView';
import { TrackerView } from './components/TrackerView';
import { DotFooter } from './components/DotFooter';
import { calculateCompatibility } from './utils/scoring';
import { INITIAL_USER_PROFILE, INITIAL_JOB_POSTINGS, INITIAL_ANSWER_LIBRARY, INITIAL_APPLICATION_RECORDS } from './data';
import { UserProfile, JobPosting, ApplicationAnswer, ApplicationRecord, TailoredResume, ApplicationStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => { const saved = localStorage.getItem('slam_user_profile'); if (saved) { try { return JSON.parse(saved); } catch (e) {} } return INITIAL_USER_PROFILE; });
  const [jobs, setJobs] = useState<JobPosting[]>(() => { const saved = localStorage.getItem('slam_jobs'); if (saved) { try { return JSON.parse(saved); } catch (e) {} } return INITIAL_JOB_POSTINGS; });
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => { const saved = localStorage.getItem('slam_saved_job_ids'); if (saved) { try { return JSON.parse(saved); } catch (e) {} } return ['job-stripe-01']; });
  const [compareJobIds, setCompareJobIds] = useState<string[]>(() => { const saved = localStorage.getItem('slam_compare_job_ids'); if (saved) { try { return JSON.parse(saved); } catch (e) {} } return ['job-stripe-01', 'job-linear-02']; });
  const [answerLibrary, setAnswerLibrary] = useState<ApplicationAnswer[]>(() => { const saved = localStorage.getItem('slam_answer_library'); if (saved) { try { return JSON.parse(saved); } catch (e) {} } return INITIAL_ANSWER_LIBRARY; });
  const [applicationRecords, setApplicationRecords] = useState<ApplicationRecord[]>(() => { const saved = localStorage.getItem('slam_app_records'); if (saved) { try { return JSON.parse(saved); } catch (e) {} } return INITIAL_APPLICATION_RECORDS; });
  const [selectedJob, setSelectedJob] = useState<JobPosting>(jobs[0]);
  const [preparedTailoredResume, setPreparedTailoredResume] = useState<TailoredResume | null>(null);
  const [preparedCoverLetter, setPreparedCoverLetter] = useState<string>('');
  const [preparedAnswers, setPreparedAnswers] = useState<{ question: string; answer: string }[]>([]);

  useEffect(() => { localStorage.setItem('slam_user_profile', JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem('slam_saved_job_ids', JSON.stringify(savedJobIds)); }, [savedJobIds]);
  useEffect(() => { localStorage.setItem('slam_compare_job_ids', JSON.stringify(compareJobIds)); }, [compareJobIds]);
  useEffect(() => { localStorage.setItem('slam_answer_library', JSON.stringify(answerLibrary)); }, [answerLibrary]);
  useEffect(() => { localStorage.setItem('slam_app_records', JSON.stringify(applicationRecords)); }, [applicationRecords]);

  const handleToggleSaveJob = (jobId: string) => setSavedJobIds((prev) => prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]);
  const handleToggleCompareJob = (job: JobPosting) => setCompareJobIds((prev) => prev.includes(job.id) ? prev.filter((id) => id !== job.id) : [...prev, job.id]);
  const handlePrepareJob = (job: JobPosting) => { setSelectedJob(job); setActiveTab('discover'); };
  const handleLaunchAutomation = (job: JobPosting, tailoredResume: TailoredResume | null, coverLetter: string, answers: { question: string; answer: string }[]) => { setSelectedJob(job); setPreparedTailoredResume(tailoredResume); setPreparedCoverLetter(coverLetter); setPreparedAnswers(answers); setActiveTab('discover'); };

  const handleSaveToTracker = (job: JobPosting, tailoredResume: TailoredResume | null, coverLetter: string, answers: { question: string; answer: string }[]) => {
    const existingIndex = applicationRecords.findIndex((r) => r.jobId === job.id);
    const score = calculateCompatibility(userProfile, job).compatibilityScore;
    const newRecord: ApplicationRecord = { id: `app-rec-${Date.now()}`, jobId: job.id, jobTitle: job.title, company: job.company, location: job.location, salaryText: job.salaryText, dateDiscovered: job.postingDate, dateApplied: undefined, status: 'PREPARED', compatibilityScore: score, applicationMode: 'REVIEW', tailoredResume: tailoredResume || undefined, coverLetter: coverLetter || undefined, submittedAnswers: answers, notes: 'Application package prepared and audited.', applicationUrl: job.applicationUrl, source: job.primarySource, lastUpdated: new Date().toISOString() };
    if (existingIndex >= 0) setApplicationRecords((prev) => { const copy = [...prev]; copy[existingIndex] = { ...copy[existingIndex], ...newRecord, id: copy[existingIndex].id }; return copy; });
    else setApplicationRecords((prev) => [newRecord, ...prev]);
    setActiveTab('applications');
  };

  const handleUpdateRecordStatus = (id: string, newStatus: ApplicationStatus) => setApplicationRecords((prev) => prev.map((rec) => rec.id === id ? { ...rec, status: newStatus, lastUpdated: new Date().toISOString() } : rec));
  const handleUpdateRecordNotes = (id: string, notes: string) => setApplicationRecords((prev) => prev.map((rec) => rec.id === id ? { ...rec, notes, lastUpdated: new Date().toISOString() } : rec));

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />
      <main className="flex-1 w-full pb-16">
        {activeTab === 'discover' && <JobDiscoveryView jobs={jobs} userProfile={userProfile} savedJobIds={savedJobIds} onToggleSaveJob={handleToggleSaveJob} compareJobIds={compareJobIds} onToggleCompareJob={handleToggleCompareJob} onPrepareJob={handlePrepareJob} answerLibrary={answerLibrary} onUpdateAnswerLibrary={setAnswerLibrary} onLaunchAutomation={handleLaunchAutomation} onSaveToTracker={handleSaveToTracker} />}
        {activeTab === 'profile' && <ProfileView userProfile={userProfile} setUserProfile={setUserProfile} />}
        {activeTab === 'saved' && <div className="max-w-7xl mx-auto px-4 py-12"><h1 className="text-4xl font-display font-black text-white mb-8">SAVED JOBS</h1><p className="text-zinc-400">You have {savedJobIds.length} saved opportunities.</p></div>}
        {activeTab === 'applications' && <TrackerView applications={applicationRecords} onUpdateStatus={handleUpdateRecordStatus} onUpdateNotes={handleUpdateRecordNotes} />}
      </main>
      <DotFooter />
    </div>
  );
}
