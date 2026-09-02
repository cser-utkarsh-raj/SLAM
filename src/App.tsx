import React, { useEffect, useState, useCallback } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { JobDiscoveryView } from './components/JobDiscoveryView';
import { TrackerView } from './components/TrackerView';
import { ProfileView } from './components/ProfileView';
import { SavedJobsView } from './components/SavedJobsView';
import { OnboardingFlow } from './components/OnboardingFlow';
import { DotFooter } from './components/DotFooter';
import { AuthModal } from './components/AuthModal';
import { SlamPlusModal } from './components/SlamPlusModal';
import { AuthService, AuthUser, fetchFirestoreProfile, saveFirestoreProfile, fetchFirestoreApplications, saveFirestoreApplications, fetchFirestoreSavedJobIds, saveFirestoreSavedJobIds } from './services/firebaseAuth';
import { UserProfile, JobPosting, ApplicationAnswer, ApplicationRecord, TailoredResume } from './types';

const emptyProfile: UserProfile = { name:'', email:'', phone:'', location:'', country:'', timezone:'', headline:'', summary:'', yearsOfExperience:0, currentRole:'', targetRoles:[], industries:[], skills:[], technologies:[], certifications:[], education:[], workHistory:[], languages:[], workAuth:'Unknown', sponsorshipRequired:false, noticePeriod:'', availability:'', relocationPreference:'No', salaryExpectation:'' };
const API = import.meta.env.VITE_API_URL || '';
function readLocal<T>(key:string, fallback:T):T { try { const v=localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; } }
function hasProfile(profile:UserProfile) { return Boolean(profile.name && profile.country && (profile.skills.length || profile.targetRoles.length)); }
function profileSearchQuery(profile:UserProfile) {
  const role = profile.targetRoles?.[0] || profile.currentRole || '';
  const roleLower = role.toLowerCase();
  const allSkills = [...(profile.skills || []), ...(profile.technologies || [])].filter(Boolean);
  const uniqueSkills = Array.from(new Set(allSkills))
    .filter(s => s && !roleLower.includes(s.toLowerCase()))
    .slice(0, 4);
  const parts = [];
  if (role) parts.push(role);
  if (uniqueSkills.length > 0) parts.push(...uniqueSkills);
  return parts.join(' + ').slice(0, 120);
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => AuthService.init());
  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [showLanding, setShowLanding] = useState(() => !Boolean(AuthService.getUser()));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isSlamPlusModalOpen, setIsSlamPlusModalOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => readLocal('slam_user_profile', emptyProfile));
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => readLocal('slam_saved_job_ids', []));
  const [compareJobIds, setCompareJobIds] = useState<string[]>([]);
  const [answerLibrary, setAnswerLibrary] = useState<ApplicationAnswer[]>(() => readLocal('slam_answer_library', []));
  const [applicationRecords, setApplicationRecords] = useState<ApplicationRecord[]>(() => readLocal('slam_app_records', []));
  const [searchQuery, setSearchQuery] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { const unsubscribe=AuthService.onAuthStateChanged(async user=>{ setAuthUser(user); if(!user){setShowLanding(true);return;} setShowLanding(false); const [profile,apps,saved]=await Promise.all([fetchFirestoreProfile(user.uid,user.idToken),fetchFirestoreApplications(user.uid,user.idToken),fetchFirestoreSavedJobIds(user.uid,user.idToken)]); if(profile)setUserProfile(profile); if(apps)setApplicationRecords(apps); if(saved)setSavedJobIds(saved); if(!hasProfile(profile||userProfile))setActiveTab('onboarding'); }); return unsubscribe; }, []);
  useEffect(() => { localStorage.setItem('slam_user_profile',JSON.stringify(userProfile)); if(authUser&&hasProfile(userProfile))void saveFirestoreProfile(authUser.uid,authUser.idToken,userProfile); },[userProfile,authUser]);
  useEffect(() => { localStorage.setItem('slam_saved_job_ids',JSON.stringify(savedJobIds)); if(authUser)void saveFirestoreSavedJobIds(authUser.uid,authUser.idToken,savedJobIds); },[savedJobIds,authUser]);
  useEffect(() => { localStorage.setItem('slam_app_records',JSON.stringify(applicationRecords)); if(authUser)void saveFirestoreApplications(authUser.uid,authUser.idToken,applicationRecords); },[applicationRecords,authUser]);
  useEffect(() => { if(userProfile.country)setCountryQuery(v=>v||userProfile.country); if(!searchQuery&&hasProfile(userProfile))setSearchQuery(profileSearchQuery(userProfile)); },[userProfile.country,userProfile.targetRoles,userProfile.skills,userProfile.technologies,searchQuery]);

  const performJobSearch=useCallback(async()=>{if(!authUser||!hasProfile(userProfile))return;setIsSearching(true);try{const response=await fetch(`${API}/api/jobs/search`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:searchQuery||profileSearchQuery(userProfile),location:userProfile.location,country:countryQuery||userProfile.country,remote:remoteOnly,limit:30,profile:userProfile})});const raw=await response.text();let data:any={};try{data=raw?JSON.parse(raw):{};}catch{throw new Error('Job service returned invalid data.');}if(!response.ok)throw new Error(data.error||data.detail||`Job discovery failed (${response.status}).`);setJobs(Array.isArray(data.jobs)?data.jobs:[]);}catch(error){console.warn('Job search:',error);setJobs([]);}finally{setIsSearching(false);}},[authUser,userProfile,searchQuery,countryQuery,remoteOnly]);
  useEffect(()=>{if(authUser&&hasProfile(userProfile)&&activeTab==='discover')void performJobSearch();},[authUser,userProfile.country,userProfile.targetRoles.join('|'),userProfile.skills.join('|'),userProfile.technologies.join('|'),activeTab]);

  const handleSaveToTracker=(job:JobPosting,resume:TailoredResume|null,letter:string,answers:{question:string;answer:string}[])=>{const score=(job as any).match?.compatibilityScore;const record:ApplicationRecord={id:`app-${Date.now()}`,jobId:job.id,jobTitle:job.title,company:job.company,location:job.location,salaryText:job.salaryText,dateDiscovered:job.postingDate||new Date().toISOString().slice(0,10),status:'PREPARED',compatibilityScore:typeof score==='number'?score:0,applicationMode:'REVIEW',tailoredResume:resume||undefined,coverLetter:letter||undefined,submittedAnswers:answers,notes:'Prepared from verified profile data. Review before submitting.',applicationUrl:job.applicationUrl,source:job.primarySource||'SLAM',lastUpdated:new Date().toISOString()};setApplicationRecords(prev=>[record,...prev.filter(x=>x.jobId!==job.id)]);setActiveTab('applications');};
  const signOut=()=>{AuthService.signOut();setAuthUser(null);setUserProfile(emptyProfile);setJobs([]);setActiveTab('discover');};
  const authenticated=Boolean(authUser);

  const openSignIn = () => { setAuthModalMode('signin'); setIsAuthModalOpen(true); };
  const openSignUp = () => { setAuthModalMode('signup'); setIsAuthModalOpen(true); };

  if(showLanding&&!authenticated)return <div className="min-h-screen bg-[#050505] flex flex-col"><LandingPage onGetStarted={openSignUp} onSignIn={openSignIn}/><DotFooter/><AuthModal isOpen={isAuthModalOpen} initialMode={authModalMode} onClose={()=>setIsAuthModalOpen(false)} onSuccess={u=>{setAuthUser(u);setShowLanding(false);setIsAuthModalOpen(false);setActiveTab('onboarding');}}/></div>;
  return <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col selection:bg-yellow-400 selection:text-black"><Navbar activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} authUser={authUser} onOpenAuth={openSignIn} onSignOut={signOut} onOpenSlamPlus={()=>setIsSlamPlusModalOpen(true)} isSubscribed={isSubscribed}/><main className="flex-1 w-full pb-16">{activeTab==='onboarding'&&<OnboardingFlow userProfile={userProfile} setUserProfile={setUserProfile} onComplete={()=>{setActiveTab('discover');void performJobSearch();}}/>}{activeTab==='discover'&&<JobDiscoveryView jobs={jobs} userProfile={userProfile} savedJobIds={savedJobIds} onToggleSaveJob={id=>setSavedJobIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])} compareJobIds={compareJobIds} onToggleCompareJob={job=>setCompareJobIds(p=>p.includes(job.id)?p.filter(x=>x!==job.id):p.length<4?[...p,job.id]:p)} onPrepareJob={()=>{}} answerLibrary={answerLibrary} onUpdateAnswerLibrary={setAnswerLibrary} onLaunchAutomation={()=>{}} onSaveToTracker={handleSaveToTracker} searchQuery={searchQuery} setSearchQuery={setSearchQuery} countryQuery={countryQuery} setCountryQuery={setCountryQuery} remoteOnly={remoteOnly} setRemoteOnly={setRemoteOnly} onSearch={performJobSearch} isSearching={isSearching}/>} {activeTab==='saved'&&<SavedJobsView jobs={jobs} savedJobIds={savedJobIds} userProfile={userProfile} onToggleSaveJob={id=>setSavedJobIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])} onNavigateToDiscover={()=>setActiveTab('discover')} onSaveToTracker={handleSaveToTracker}/>} {activeTab==='applications'&&<TrackerView applications={applicationRecords} onUpdateStatus={(id,status)=>setApplicationRecords(p=>p.map(r=>r.id===id?{...r,status,dateApplied:status==='APPLIED'&&!r.dateApplied?new Date().toISOString().slice(0,10):r.dateApplied,lastUpdated:new Date().toISOString()}:r))} onUpdateNotes={(id,notes)=>setApplicationRecords(p=>p.map(r=>r.id===id?{...r,notes,lastUpdated:new Date().toISOString()}:r))}/>} {activeTab==='profile'&&<ProfileView userProfile={userProfile} setUserProfile={setUserProfile}/>}</main><DotFooter/><AuthModal isOpen={isAuthModalOpen} initialMode={authModalMode} onClose={()=>setIsAuthModalOpen(false)} onSuccess={u=>{setAuthUser(u);setShowLanding(false);setIsAuthModalOpen(false);if(!hasProfile(userProfile))setActiveTab('onboarding');}}/><SlamPlusModal isOpen={isSlamPlusModalOpen} onClose={()=>setIsSlamPlusModalOpen(false)} isSubscribed={isSubscribed} onActivated={()=>setIsSubscribed(true)}/></div>;
}
