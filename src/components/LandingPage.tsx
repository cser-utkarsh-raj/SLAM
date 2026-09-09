import React from 'react';
import { ArrowRight, Check, ExternalLink, Lock, MapPin, Search, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { AdzunaLogo, JobicyLogo, RemoteOKLogo, LinkedInLogo, IndeedLogo, InstahyreLogo, NaukriLogo, GlassdoorLogo, WellfoundLogo, SOURCE_URLS } from './SourceLogos';

interface Props { onGetStarted: () => void; onSignIn: () => void; }

const liveSources = [
  { name: 'Adzuna', Logo: AdzunaLogo, href: SOURCE_URLS.adzuna, text: 'Live job feed' },
  { name: 'Jobicy', Logo: JobicyLogo, href: SOURCE_URLS.jobicy, text: 'Remote openings' },
  { name: 'Remote OK', Logo: RemoteOKLogo, href: SOURCE_URLS.remoteok, text: 'Remote openings' },
];

const externalPlatforms = [
  { name: 'LinkedIn', Logo: LinkedInLogo, href: SOURCE_URLS.linkedin },
  { name: 'Indeed', Logo: IndeedLogo, href: SOURCE_URLS.indeed },
  { name: 'Instahyre', Logo: InstahyreLogo, href: SOURCE_URLS.instahyre },
  { name: 'Naukri', Logo: NaukriLogo, href: SOURCE_URLS.naukri },
  { name: 'Glassdoor', Logo: GlassdoorLogo, href: SOURCE_URLS.glassdoor },
  { name: 'Wellfound', Logo: WellfoundLogo, href: SOURCE_URLS.wellfound },
];

const steps = [
  { n: '01', icon: UserRound, title: 'Build your profile', text: 'Keep your experience, skills, location and target roles in one place.' },
  { n: '02', icon: Search, title: 'Find relevant openings', text: 'SLAM checks connected job feeds and keeps the original listing and application link.' },
  { n: '03', icon: Check, title: 'Decide and apply', text: 'See the important job details, what matches your profile, and prepare before opening the employer application.' },
];

export const LandingPage: React.FC<Props> = ({ onGetStarted, onSignIn }) => (
  <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black">
    <section className="relative overflow-hidden border-b border-zinc-900">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[520px] rounded-full bg-yellow-400/[0.055] blur-[130px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28 relative">
        <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-12 lg:gap-20 items-center">
          <div>
            <div className="flex items-center h-[76px] sm:h-[92px] select-none mb-8">
              <img src="/slam-logo.svg" alt="SLAM" className="h-[72px] sm:h-[88px] w-[72px] sm:w-[88px] shrink-0 -mr-2 sm:-mr-3" />
              <span className="font-display font-black text-6xl sm:text-8xl tracking-[-0.08em] leading-none">LAM</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Real openings. One profile.</div>
            <h1 className="mt-6 max-w-3xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-black tracking-[-0.045em] leading-[0.98]">Find work that actually fits.</h1>
            <p className="mt-6 max-w-2xl text-lg md:text-xl text-zinc-300 leading-relaxed">One career profile for discovering real jobs, comparing them with your experience, and getting ready to apply.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={onGetStarted} className="group px-7 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest rounded-xl inline-flex items-center gap-3 transition-all shadow-[0_0_35px_rgba(250,204,21,.08)]">BUILD MY PROFILE <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" /></button>
              <button onClick={onSignIn} className="px-7 py-4 border border-zinc-800 hover:border-zinc-600 bg-zinc-950/80 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition">SIGN IN</button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Profile facts stay yours</span>
              <span className="inline-flex items-center gap-2"><Lock className="w-4 h-4" /> No third-party passwords</span>
              <span className="inline-flex items-center gap-2"><ExternalLink className="w-4 h-4" /> Original application links</span>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <div className="rounded-3xl border border-zinc-800 bg-[#090909] shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between"><div><div className="text-[10px] font-mono tracking-[.2em] text-zinc-500">YOUR JOB SEARCH</div><div className="text-sm font-bold mt-1">Software Engineering</div></div><div className="px-2.5 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[9px] font-bold text-yellow-400">INDIA</div></div>
              <div className="p-4 space-y-3">
                {[
                  ['Senior Software Engineer', 'Example company', 'Bengaluru · Full-time', '91%'],
                  ['Backend Engineer', 'Example company', 'Hyderabad · Full-time', '87%'],
                  ['Platform Engineer', 'Example company', 'India · Remote', '82%'],
                ].map(([title, company, loc, match], i) => (
                  <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-black">{company.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="font-bold text-sm truncate">{title}</div><div className="text-[10px] text-zinc-500 mt-1">{company} · {loc}</div></div><div className="text-[10px] font-bold text-yellow-400">{match} fit</div></div>
                    <div className="mt-3 flex gap-1.5">{['Python','Docker',i === 1 ? 'PostgreSQL' : 'TypeScript'].map(s => <span key={s} className="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[8px] text-zinc-500">{s}</span>)}</div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-zinc-800 flex items-center gap-2 text-[10px] text-zinc-500"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Example interface — actual results come from connected live feeds.</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-b border-zinc-900 bg-[#080808]">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-zinc-500">Built around the things that matter when you are actually looking for work.</div>
        <div className="flex flex-wrap gap-5 text-[10px] font-mono uppercase tracking-widest text-zinc-600"><span>Profile</span><span>Location</span><span>Role</span><span>Source</span><span>Application</span></div>
      </div>
    </section>

    <section className="py-20 md:py-24 border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl"><div className="text-[10px] font-mono uppercase tracking-[.25em] text-yellow-400 font-bold">HOW IT WORKS</div><h2 className="mt-3 text-3xl md:text-5xl font-display font-black tracking-tight">Less noise. Better decisions.</h2><p className="mt-4 text-zinc-500 leading-relaxed">SLAM is designed around the actual job-search flow instead of making you jump between a dozen screens.</p></div>
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {steps.map((step) => <div key={step.n} className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 hover:border-zinc-700 hover:-translate-y-1 transition"><div className="flex items-center justify-between"><span className="text-[10px] font-mono text-zinc-600">{step.n}</span><step.icon className="w-5 h-5 text-yellow-400" /></div><h3 className="mt-10 text-lg font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-500">{step.text}</p></div>)}
        </div>
      </div>
    </section>

    <section className="py-20 md:py-24 border-b border-zinc-900 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[.9fr_1.1fr] gap-12 items-start">
        <div><div className="text-[10px] font-mono uppercase tracking-[.25em] text-yellow-400 font-bold">WHAT YOU SEE</div><h2 className="mt-3 text-3xl md:text-5xl font-display font-black tracking-tight">Useful information, not filler.</h2><p className="mt-4 text-zinc-500 leading-relaxed">Every listing keeps the information that helps you decide whether it is worth your time.</p></div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ['Real job source', 'Know where the opening came from and open the original listing.'],
            ['Location fit', 'Country is treated as a real boundary; city helps rank nearby matches.'],
            ['Profile fit', 'See skills, experience and role overlap instead of a mysterious number alone.'],
            ['Application prep', 'Review the job and prepare your materials before leaving SLAM to apply.'],
          ].map(([title,text]) => <div key={title} className="rounded-2xl border border-zinc-800 bg-[#050505] p-5"><div className="flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-yellow-400" /><h3 className="font-bold text-sm">{title}</h3></div><p className="mt-3 text-xs leading-5 text-zinc-500">{text}</p></div>)}
        </div>
      </div>
    </section>

    <section className="py-20 border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><div className="text-[10px] font-mono uppercase tracking-[.25em] text-yellow-400 font-bold">CONNECTED SOURCES</div><h2 className="mt-3 text-3xl md:text-4xl font-display font-black">Where SLAM gets jobs.</h2></div><p className="max-w-lg text-sm text-zinc-500">These feeds can be queried by SLAM. Other major job sites remain one click away without pretending they are direct integrations.</p></div>
        <div className="grid md:grid-cols-3 gap-4">
          {liveSources.map(source => <a key={source.name} href={source.href} target="_blank" rel="noreferrer" className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 hover:border-zinc-600 hover:-translate-y-1 transition"><div className="flex items-center justify-between"><source.Logo size={54}/><ExternalLink className="w-4 h-4 text-zinc-700 group-hover:text-yellow-400"/></div><div className="mt-8 text-lg font-bold">{source.name}</div><div className="mt-1 text-xs text-emerald-400">{source.text}</div></a>)}
        </div>
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"><div className="text-[10px] font-mono uppercase tracking-[.22em] text-zinc-600 mb-4">ALSO SEARCH DIRECTLY</div><div className="flex flex-wrap gap-2">{externalPlatforms.map(source => <a key={source.name} href={source.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-800 bg-[#050505] hover:border-zinc-600 transition"><source.Logo size={22}/><span className="text-xs font-semibold">{source.name}</span><ExternalLink className="w-3 h-3 text-zinc-600"/></a>)}</div></div>
      </div>
    </section>

    <section className="py-20 md:py-24 border-b border-zinc-900 bg-[#080808]">
      <div className="max-w-5xl mx-auto px-6 text-center"><div className="mx-auto w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center"><Sparkles className="w-5 h-5"/></div><h2 className="mt-6 text-3xl md:text-5xl font-display font-black tracking-tight">Your next search should start here.</h2><p className="mt-4 max-w-2xl mx-auto text-zinc-500 leading-relaxed">Build your profile once, then use it to search, compare and prepare for the opportunities that matter.</p><button onClick={onGetStarted} className="mt-8 px-8 py-4 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest inline-flex items-center gap-3">GET STARTED <ArrowRight className="w-4 h-4"/></button></div>
    </section>

    <footer className="py-8 border-b border-zinc-900"><div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600"><div className="font-mono">SLAM · © 2026</div><div className="flex items-center gap-5"><span className="inline-flex items-center gap-2"><MapPin className="w-3.5 h-3.5"/> Location-aware search</span><span className="inline-flex items-center gap-2"><Lock className="w-3.5 h-3.5"/> No third-party passwords</span></div></div></footer>
  </div>
);
