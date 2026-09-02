import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, CheckCircle2, ExternalLink, Lock, ShieldCheck, Radio } from 'lucide-react';
import { ConnectionsPanel } from './ConnectionsPanel';
import { LinkedInLogo, IndeedLogo, GlassdoorLogo, WellfoundLogo, WorkIndiaLogo, InstahyreLogo, ArbeitnowLogo, SOURCE_URLS } from './SourceLogos';

interface Props { onGetStarted: () => void; onSignIn: () => void; }

const sources = [
  { name: 'Arbeitnow', Logo: ArbeitnowLogo, status: 'LIVE FEED', href: SOURCE_URLS.arbeitnow },
  { name: 'LinkedIn', Logo: LinkedInLogo, status: 'OFFICIAL SITE', href: SOURCE_URLS.linkedin },
  { name: 'Indeed', Logo: IndeedLogo, status: 'OFFICIAL SITE', href: SOURCE_URLS.indeed },
  { name: 'Glassdoor', Logo: GlassdoorLogo, status: 'OFFICIAL SITE', href: SOURCE_URLS.glassdoor },
  { name: 'Wellfound', Logo: WellfoundLogo, status: 'OFFICIAL SITE', href: SOURCE_URLS.wellfound },
  { name: 'WorkIndia', Logo: WorkIndiaLogo, status: 'OFFICIAL SITE', href: SOURCE_URLS.workindia },
  { name: 'Instahyre', Logo: InstahyreLogo, status: 'OFFICIAL SITE', href: SOURCE_URLS.instahyre },
];

export const LandingPage: React.FC<Props> = ({ onGetStarted, onSignIn }) => {
  const reduceMotion = useReducedMotion();
  const [score, setScore] = useState(reduceMotion ? 92 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1100);
      setScore(Math.round((1 - Math.pow(1 - progress, 3)) * 92));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [reduceMotion]);

  const fade = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
    visible: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0.1 : 0.55, delay: reduceMotion ? 0 : delay, ease: [0.16, 1, 0.3, 1] } }),
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black">
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-24 border-b border-zinc-900 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] pointer-events-none opacity-40 blur-[120px]" style={{ background: 'radial-gradient(ellipse at center, rgba(250,204,21,.08) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center relative">
          <motion.div variants={fade} initial="hidden" animate="visible" custom={0.1} className="lg:col-span-7">
            <div className="flex items-center gap-5 select-none">
              <img src="/slam-logo.svg" alt="SLAM" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 shrink-0" />
              <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-[-0.07em] leading-none">SLAM</h1>
            </div>
            <p className="mt-8 max-w-xl text-lg sm:text-xl text-zinc-300 font-light leading-relaxed">One authoritative career profile. Real listings. Explainable compatibility scoring.</p>
            <p className="mt-2 max-w-xl text-sm text-zinc-500 leading-relaxed">SLAM only displays data it can trace to a real source or your verified profile. Missing facts stay missing.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <button onClick={onGetStarted} className="group px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-3 transition cursor-pointer"><span>BUILD MY PROFILE</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></button>
              <button onClick={onSignIn} className="px-7 py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer">SIGN IN</button>
            </div>
            <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-wrap gap-6 text-xs text-zinc-500 font-mono"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-yellow-400" /> Source-of-truth profile</div><div className="flex items-center gap-2"><Lock className="w-4 h-4" /> No third-party passwords</div></div>
          </motion.div>

          <motion.div variants={fade} initial="hidden" animate="visible" custom={0.2} className="lg:col-span-5">
            <div className="border border-zinc-800 bg-[#090909] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5"><div className="flex items-center gap-2.5"><div className="w-2 h-2 rounded-full bg-yellow-400" /><span className="font-mono text-xs font-bold tracking-widest text-zinc-200">MATCH ENGINE / DEMO</span></div><span className="text-[10px] font-mono text-zinc-500 px-2 py-0.5 border border-zinc-800 rounded">ILLUSTRATIVE</span></div>
              <div className="p-5 border border-zinc-800 bg-zinc-950 rounded-xl">
                <div className="flex items-start justify-between gap-4"><div><div className="text-xs font-mono text-zinc-500">EXAMPLE ROLE</div><div className="font-bold text-base text-white mt-1">Backend / Platform Engineer</div><div className="text-xs text-zinc-400 mt-0.5">Remote · example scoring state</div></div><div className="text-right shrink-0"><div className="text-3xl font-display font-black text-yellow-400 tabular-nums">{score}%</div><div className="text-[9px] font-mono text-zinc-500 uppercase">DEMO SCORE</div></div></div>
                <div className="mt-4 pt-3 border-t border-zinc-900"><div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">Example skill overlap</div><div className="flex flex-wrap gap-1.5">{['Python','FastAPI','PostgreSQL','Docker'].map((skill) => <span key={skill} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-yellow-400" />{skill}</span>)}</div></div>
              </div>
              <div className="mt-3 p-4 border border-zinc-900 bg-zinc-950/60 rounded-xl flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-zinc-400"><Radio className="w-3.5 h-3.5 text-emerald-400" /> Live source connected</div><span className="text-xs font-mono text-emerald-400">Arbeitnow</span></div>
              <div className="mt-4 text-[10px] font-mono text-zinc-600 text-center">The example above is not a live job. Real listings always show their source.</div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-10 border-b border-zinc-900 bg-[#070707] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-5 flex items-center justify-between gap-4"><span className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400 font-bold">JOB SOURCES</span><span className="text-[11px] font-mono text-zinc-600 hidden sm:inline">LIVE CONNECTIONS ARE MARKED CLEARLY</span></div>
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-3 min-w-max pb-1">
            {sources.map((source) => (
              <a key={source.name} href={source.href} target="_blank" rel="noreferrer" className="group w-[180px] sm:w-[195px] border border-zinc-800 bg-zinc-950 rounded-xl p-4 flex flex-col gap-4 hover:border-zinc-600 hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between"><source.Logo size={44} /><ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-yellow-400 transition" /></div>
                <div><div className="text-sm font-bold text-white font-display">{source.name}</div><div className={`mt-1 text-[9px] font-mono tracking-widest ${source.status === 'LIVE FEED' ? 'text-emerald-400' : 'text-zinc-500'}`}>{source.status}</div></div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-zinc-900"><div className="grid lg:grid-cols-12 gap-12 items-start"><div className="lg:col-span-5"><span className="text-[11px] font-mono font-bold tracking-[0.25em] text-yellow-400 uppercase">THE SLAM METHOD</span><h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-3 leading-[0.95] tracking-tight">REAL DATA.<br />EXPLAINABLE<br />DECISIONS.</h2><p className="mt-5 text-sm text-zinc-400 leading-relaxed max-w-md">Your resume is the source of truth for candidate facts. Job listings keep their original source and application URL. Matching explains what overlaps and what does not.</p></div><div className="lg:col-span-7 space-y-3">{[['01','INGEST','Parse only facts present in your resume.'],['02','MATCH','Score skills, experience, role fit, and location without inventing qualifications.'],['03','PREPARE','Generate application material from verified profile facts and keep you in control of submission.']].map(([n,title,body]) => <div key={n} className="p-5 border border-zinc-800 bg-zinc-950 rounded-xl flex gap-5"><span className="font-mono text-yellow-400 text-sm font-bold">{n}</span><div><div className="font-display font-black text-white">{title}</div><div className="text-sm text-zinc-500 mt-1 leading-relaxed">{body}</div></div></div>)}</div></div></section>

      <section className="py-20 bg-[#070707] border-b border-zinc-900"><ConnectionsPanel /></section>
    </div>
  );
};
