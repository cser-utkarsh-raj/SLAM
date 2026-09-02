import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserProfile, JobPosting, TailoredResume, ApplicationAnswer } from '../types';
import { Bookmark, BookmarkCheck, ArrowUpRight, CheckCircle2, AlertTriangle, Search } from 'lucide-react';

interface Props {
  jobs: JobPosting[]; userProfile: UserProfile; savedJobIds: string[]; onToggleSaveJob:(id:string)=>void;
  compareJobIds:string[]; onToggleCompareJob:(job:JobPosting)=>void; onPrepareJob:(job:JobPosting)=>void;
  answerLibrary:ApplicationAnswer[]; onUpdateAnswerLibrary:(x:ApplicationAnswer[])=>void;
  onLaunchAutomation:(job:JobPosting,resume:TailoredResume|null,letter:string,answers:{question:string;answer:string}[])=>void;
  onSaveToTracker:(job:JobPosting,resume:TailoredResume|null,letter:string,answers:{question:string;answer:string}[])=>void;
}

export const JobDiscoveryView:React.FC<Props>=({jobs,userProfile,savedJobIds,onToggleSaveJob,onPrepareJob})=>{
  const [selectedJob,setSelectedJob]=useState<JobPosting|null>(null);
  const scoredJobs=useMemo(()=>[...jobs].sort((a,b)=>(((b as any).match?.compatibilityScore??0)-((a as any).match?.compatibilityScore??0))),[jobs]);
  const match=(job:any)=>job.match || null;
  const country=userProfile.country || userProfile.location || 'your market';

  if(!userProfile.name && !userProfile.skills.length) return <div className="max-w-5xl mx-auto px-6 py-24 text-center"><div className="mx-auto w-16 h-16 border border-zinc-800 flex items-center justify-center"><Search/></div><h1 className="text-5xl font-black mt-8">START WITH YOUR RESUME.</h1><p className="text-zinc-500 mt-4">Import your real resume from Profile. SLAM will use it to find and score relevant opportunities.</p></div>;
  if(!jobs.length) return <div className="max-w-5xl mx-auto px-6 py-24 text-center"><h1 className="text-5xl md:text-7xl font-black">NO MATCHES YET.</h1><p className="text-zinc-500 mt-4">SLAM couldn't find live listings for {country} right now. Try another target role or refresh later.</p></div>;

  return <div className="w-full relative min-h-screen"><div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]"/>
    <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="mb-12"><div className="text-sm font-bold text-zinc-500 tracking-widest uppercase mb-4">LIVE DISCOVERY · {country.toUpperCase()}</div><h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black text-white leading-[0.9]">FIND YOUR<br/>BEST MATCH.</h1><p className="mt-6 text-zinc-400 text-lg">{scoredJobs.length} live opportunities ranked against your profile.</p></motion.div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-5/12 flex flex-col gap-2"><div className="pb-4 border-b border-zinc-900 text-xs font-bold text-zinc-500 tracking-widest uppercase">Top matches</div>
          <AnimatePresence>{scoredJobs.map((job,index)=>{const isSelected=selectedJob?.id===job.id;const saved=savedJobIds.includes(job.id);const m=match(job);const score=m?.compatibilityScore;return <motion.div key={job.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:index*.03}} onClick={()=>setSelectedJob(job)} className={`group cursor-pointer p-5 border-l-4 transition-all ${isSelected?'bg-zinc-900 border-yellow-400':'bg-[#0a0a0a] border-transparent hover:bg-zinc-900'}`}>
            <div className="flex justify-between items-start gap-4"><div className="flex-1"><h3 className="text-lg font-bold text-zinc-100 mb-1">{job.title}</h3><div className="text-sm text-zinc-400">{job.company} · {job.location || 'Location unavailable'}</div></div><div className="text-right"><div className={`text-2xl font-black font-display ${score>=85?'text-yellow-400':'text-white'}`}>{typeof score==='number'?`${score}%`:'—'}</div><div className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{score!=null?'Match':'Unscored'}</div></div></div>
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500"><span>{job.freshnessLabel||'Live listing'}</span><span>{job.employmentType||'Employment type unavailable'}</span>{saved&&<span className="text-yellow-400">Saved</span>}</div>
          </motion.div>})}</AnimatePresence>
        </div>
        <div className="w-full lg:w-7/12 lg:sticky lg:top-24"><AnimatePresence mode="wait">{selectedJob?<motion.div key={selectedJob.id} initial={{opacity:0,filter:'blur(4px)'}} animate={{opacity:1,filter:'blur(0px)'}} className="bg-[#0a0a0a] border border-zinc-900 p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-8"><div><h2 className="text-3xl font-display font-black text-white leading-none">{selectedJob.title}</h2><div className="text-lg text-zinc-400 mt-2">{selectedJob.company}</div></div><button onClick={()=>onToggleSaveJob(selectedJob.id)} className={`p-3 border ${savedJobIds.includes(selectedJob.id)?'bg-yellow-400/10 border-yellow-400/50 text-yellow-400':'border-zinc-800 text-zinc-500'}`}>{savedJobIds.includes(selectedJob.id)?<BookmarkCheck/>:<Bookmark/>}</button></div>
          {(()=>{const m=match(selectedJob);return <><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><Metric label="Compatibility" value={m?.compatibilityScore!=null?`${m.compatibilityScore}%`:'Not scored'}/><Metric label="Location" value={selectedJob.location||'Unavailable'}/><Metric label="Posted" value={selectedJob.freshnessLabel||'Unknown'}/><Metric label="Applicants" value={selectedJob.applicantCount||'Unavailable'}/></div>
          <div className="space-y-8"><div><h3 className="section-title">Why you match</h3>{m?.matchedSkills?.length?<div className="space-y-2">{m.matchedSkills.map((s:string)=><div key={s} className="flex items-center gap-2 text-sm text-zinc-300"><CheckCircle2 className="w-4 h-4 text-emerald-500"/>{s}</div>)}</div>:<p className="text-sm text-zinc-600">No skill matches were verified from the available listing data.</p>}</div>
          {m?.missingSkills?.length>0&&<div><h3 className="section-title">Potential gaps</h3><div className="flex flex-wrap gap-2">{m.missingSkills.map((s:string)=><span key={s} className="px-3 py-1 bg-zinc-900 text-zinc-500 text-xs font-mono">{s}</span>)}</div></div>}
          {m?.concerns?.length>0&&<div className="border border-yellow-400/20 p-4"><h3 className="section-title flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-yellow-400"/>Check before applying</h3>{m.concerns.map((c:string)=><p key={c} className="text-sm text-zinc-400 mt-2">{c}</p>)}</div>}
          <div className="pt-8 border-t border-zinc-900 flex items-center justify-between gap-4"><a href={selectedJob.applicationUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-zinc-500 hover:text-white flex items-center gap-2">View source listing <ArrowUpRight className="w-3 h-3"/></a><button onClick={()=>onPrepareJob(selectedJob)} className="px-8 py-4 bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-yellow-400">Prepare application</button></div></div></>})()}
        </motion.div>:<div className="h-[400px] flex items-center justify-center border border-dashed border-zinc-900"><span className="text-sm text-zinc-600">Select a position to view details</span></div>}</AnimatePresence></div>
      </div>
    </div>
  </div>;
};
function Metric({label,value}:{label:string;value:string}){return <div className="space-y-1"><div className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">{label}</div><div className="text-sm font-medium text-white">{value}</div></div>}
