import React from 'react';
import { ArrowRight, ExternalLink, Lock, ShieldCheck } from 'lucide-react';
import { AdzunaLogo, JobicyLogo, RemoteOKLogo, LinkedInLogo, IndeedLogo, InstahyreLogo, NaukriLogo, GlassdoorLogo, WellfoundLogo, SOURCE_URLS } from './SourceLogos';

interface Props { onGetStarted: () => void; onSignIn: () => void; }

const liveSources = [
  { name: 'Adzuna', Logo: AdzunaLogo, href: SOURCE_URLS.adzuna },
  { name: 'Jobicy', Logo: JobicyLogo, href: SOURCE_URLS.jobicy },
  { name: 'Remote OK', Logo: RemoteOKLogo, href: SOURCE_URLS.remoteok },
];

const externalPlatforms = [
  { name: 'LinkedIn', Logo: LinkedInLogo, href: SOURCE_URLS.linkedin },
  { name: 'Indeed', Logo: IndeedLogo, href: SOURCE_URLS.indeed },
  { name: 'Instahyre', Logo: InstahyreLogo, href: SOURCE_URLS.instahyre },
  { name: 'Naukri', Logo: NaukriLogo, href: SOURCE_URLS.naukri },
  { name: 'Glassdoor', Logo: GlassdoorLogo, href: SOURCE_URLS.glassdoor },
  { name: 'Wellfound', Logo: WellfoundLogo, href: SOURCE_URLS.wellfound },
];

export const LandingPage: React.FC<Props> = ({ onGetStarted, onSignIn }) => (
  <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black">
    <section className="relative pt-16 pb-20 md:pt-24 md:pb-24 border-b border-zinc-900 overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] pointer-events-none opacity-40 blur-[120px]" style={{ background: 'radial-gradient(ellipse at center, rgba(250,204,21,.08) 0%, transparent 70%)' }} />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="max-w-4xl">
          <div className="flex items-center gap-0 select-none h-[92px] sm:h-[108px] md:h-[122px]">
            <img src="/slam-logo.svg" alt="SLAM" className="h-[88px] sm:h-[104px] md:h-[118px] w-[88px] sm:w-[104px] md:w-[118px] shrink-0 -mr-2 sm:-mr-3 md:-mr-4" />
            <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-[-0.07em] leading-none">LAM</h1>
          </div>
          <h2 className="mt-9 text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight leading-[1.02] max-w-3xl">Find work that actually fits.</h2>
          <p className="mt-5 max-w-2xl text-lg sm:text-xl text-zinc-300 font-light leading-relaxed">Keep one career profile, discover real openings, and see why a job matches your experience.</p>
          <p className="mt-3 max-w-2xl text-sm text-zinc-500 leading-relaxed">SLAM uses the information you provide and live job listings from connected sources. Every listing keeps its original application link.</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <button onClick={onGetStarted} className="group px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-3 transition cursor-pointer"><span>BUILD MY PROFILE</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></button>
            <button onClick={onSignIn} className="px-7 py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer">SIGN IN</button>
          </div>
          <div className="mt-12 pt-6 border-t border-zinc-900 flex flex-wrap gap-7 text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-yellow-400" /> Your profile stays yours</div>
            <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> No third-party passwords</div>
            <div>Original application links</div>
          </div>
        </div>
      </div>
    </section>

    <section className="py-12 border-b border-zinc-900 bg-[#070707] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6"><span className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400 font-bold">CONNECTED JOB FEEDS</span><p className="mt-1 text-xs text-zinc-600">These are the sources SLAM can query directly.</p></div>
      <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar"><div className="flex gap-4 min-w-max pb-1">
        {liveSources.map((source) => (
          <a key={source.name} href={source.href} target="_blank" rel="noreferrer" className="group w-[220px] border border-zinc-800 bg-zinc-950 rounded-xl p-5 flex items-center gap-4 hover:border-zinc-600 hover:-translate-y-1 transition-all duration-300">
            <source.Logo size={52} /><div className="min-w-0 flex-1"><div className="text-base font-bold text-white font-display">{source.name}</div><div className="mt-1 text-[9px] font-mono tracking-widest text-emerald-400">CONNECTED FEED</div></div><ExternalLink className="w-4 h-4 text-zinc-700 group-hover:text-yellow-400 transition shrink-0" />
          </a>
        ))}
      </div></div>
    </section>

    <section className="py-12 border-b border-zinc-900 bg-[#050505] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6"><span className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400 font-bold">MORE JOB PLATFORMS</span><p className="mt-1 text-xs text-zinc-600">Open these sites directly for their own live search.</p></div>
      <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar"><div className="flex gap-4 min-w-max pb-1">
        {externalPlatforms.map((source) => (
          <a key={source.name} href={source.href} target="_blank" rel="noreferrer" className="group w-[190px] border border-zinc-800 bg-zinc-950 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-600 hover:-translate-y-1 transition-all duration-300">
            <source.Logo size={48} /><div className="min-w-0"><div className="text-sm font-bold text-white font-display">{source.name}</div><div className="mt-1 text-[9px] font-mono tracking-widest text-zinc-600 group-hover:text-yellow-400 transition">OPEN JOB SEARCH ↗</div></div>
          </a>
        ))}
      </div></div>
    </section>
  </div>
);
