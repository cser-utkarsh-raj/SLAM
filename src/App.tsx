import React, { useEffect, useState } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { JobDiscoveryView } from './components/JobDiscoveryView';
import { TrackerView } from './components/TrackerView';
import { DotFooter } from './components/DotFooter';
import { ResumeImporter } from './components/ResumeImporter';
import { UserProfile, JobPosting, ApplicationAnswer, ApplicationRecord, TailoredResume, ApplicationStatus } from './types';

const emptyProfile: UserProfile = {
  name:'',email:'',phone:'',location:'',country:'',timezone:'',headline:'',summary:'',yearsOfExperience:0,currentRole:'',targetRoles:[],industries:[],skills:[],technologies:[],certifications:[],education:[],workHistory:[],languages:[],workAuth:'Unknown',sponsorshipRequired:false,noticePeriod:'',availability:'',relocationPreference:'No',salaryExpectation:''
};
const API = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [activeTab,setActiveTab]=useState<ActiveTab>('discover');
  const [userProfile,setUserProfile]=useState<UserProfile>(()=>{try{return JSON.parse(localStorage.getItem('slam_user_profile')||'null')||emptyProfile}catch{return emptyProfile}});
  const [jobs,setJobs]=useState<JobPosting[]>([]);
  const [savedJobIds,setSavedJobIds]=useState<string[]>(()=>JSON.parse(localStorage.getItem('slam_saved_job_ids')||'[]'));
  const [compareJobIds,setCompareJobIds]=useState<string[]>([]);
  const [answerLibrary,setAnswerLibrary]=useState<ApplicationAnswer[]>(()=>JSON.parse(localStorage.getItem('slam_answer_library')||'[]'));
  const [applicationRecords,setApplicationRecords]=useState<ApplicationRecord[]>(()=>JSON.parse(localStorage.getItem('slam_app_records')||'[]'));
  const [selectedJob,setSelectedJob]=useState<JobPosting|null>(null);
  const [preparedTailoredResume,setPreparedTailoredResume]=useState<TailoredResume|null>(null);
  const [preparedCoverLetter,setPreparedCoverLetter]=useState('');
  const [preparedAnswers,setPreparedAnswers]=useState<{question:string;answer:string}[]>([]);

  useEffect(()=>{localStorage.setItem('slam_user_profile',JSON.stringify(userProfile));},[userProfile]);
  useEffect(()=>{localStorage.setItem('slam_saved_job_ids',JSON.stringify(savedJobIds));},[savedJobIds]);
  useEffect(()=>{localStorage.setItem('slam_app_records',JSON.stringify(applicationRecords));},[applicationRecords]);
  useEffect(()=>{const query=userProfile.targetRoles[0]||userProfile.currentRole||'software engineer'; fetch(`${API}/api/jobs/search`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,remote:false,limit:30})}).then(r=>r.ok?r.json():null).then(d=>{if(d?.jobs)setJobs(d.jobs)}).catch(()=>{});},[userProfile.targetRoles,userProfile.currentRole]);

  const toggleSave=(id:string)=>setSavedJobIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleCompare=(job:JobPosting)=>setCompareJobIds(p=>p.includes(job.id)?p.filter(x=>x!==job.id):p.length<4?[...p,job.id]:p);
  const prepare=(job:JobPosting)=>{setSelectedJob(job);setActiveTab('discover');};
  const launch=(job:JobPosting,resume:TailoredResume|null,letter:string,answers:{question:string;answer:string}[])=>{setSelectedJob(job);setPreparedTailoredResume(resume);setPreparedCoverLetter(letter);setPreparedAnswers(answers);setActiveTab('discover');};
  const saveTracker=(job:JobPosting,resume:TailoredResume|null,letter:string,answers:{question:string;answer:string}[])=>{
    const record:ApplicationRecord={id:`app-${Date.now()}`,jobId:job.id,jobTitle:job.title,company:job.company,location:job.location,salaryText:job.salaryText,dateDiscovered:job.postingDate,status:'PREPARED',compatibilityScore:0,applicationMode:'REVIEW',tailoredResume:resume||undefined,coverLetter:letter||undefined,submittedAnswers:answers,notes:'Prepared by SLAM. User review required before submission.',applicationUrl:job.applicationUrl,source:job.primarySource,lastUpdated:new Date().toISOString()};
    setApplicationRecords(p=>[record,...p.filter(x=>x.jobId!==job.id)]);setActiveTab('applications');
  };

  return <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-black">
    <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile}/>
    <main className="flex-1 w-full pb-16">
      {activeTab==='discover' && <JobDiscoveryView jobs={jobs} userProfile={userProfile} savedJobIds={savedJobIds} onToggleSaveJob={toggleSave} compareJobIds={compareJobIds} onToggleCompareJob={toggleCompare} onPrepareJob={prepare} answerLibrary={answerLibrary} onUpdateAnswerLibrary={setAnswerLibrary} onLaunchAutomation={launch} onSaveToTracker={saveTracker}/>} 
      {activeTab==='profile' && <ResumeImporter onProfile={p=>setUserProfile(prev=>({...prev,...p}))}/>} 
      {activeTab==='saved' && <div className="max-w-7xl mx-auto px-6 py-16"><h1 className="text-5xl font-black">SAVED JOBS</h1><p className="text-zinc-500 mt-3">{savedJobIds.length} saved opportunities.</p></div>}
      {activeTab==='applications' && <TrackerView applications={applicationRecords} onUpdateStatus={(id,s:ApplicationStatus)=>setApplicationRecords(p=>p.map(r=>r.id===id?{...r,status:s,lastUpdated:new Date().toISOString()}:r))} onUpdateNotes={(id,n)=>setApplicationRecords(p=>p.map(r=>r.id===id?{...r,notes:n,lastUpdated:new Date().toISOString()}:r))}/>} 
    </main><DotFooter/>
  </div>;
}
