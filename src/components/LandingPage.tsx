import React from 'react';
import { ArrowRight, Check, ExternalLink, MapPin, Search, UserRound } from 'lucide-react';
import { AdzunaLogo, JobicyLogo, RemoteOKLogo, LinkedInLogo, IndeedLogo, InstahyreLogo, NaukriLogo, GlassdoorLogo, WellfoundLogo, SOURCE_URLS } from './SourceLogos';

interface Props { onGetStarted: () => void; onSignIn: () => void; }

const liveSources = [
  { name: 'Adzuna', Logo: AdzunaLogo, href: SOURCE_URLS.adzuna, text: 'Connected feed' },
  { name: 'Jobicy', Logo: JobicyLogo, href: SOURCE_URLS.jobicy, text: 'Remote jobs' },
  { name: 'Remote OK', Logo: RemoteOKLogo, href: SOURCE_URLS.remoteok, text: 'Remote jobs' },
];

const externalPlatforms = [
  { name: 'LinkedIn', Logo: LinkedInLogo, href: SOURCE_URLS.linkedin },
  { name: 'Indeed', Logo: IndeedLogo, href: SOURCE_URLS.indeed },
  { name: 'Instahyre', Logo: InstahyreLogo, href: SOURCE_URLS.instahyre },
  { name: 'Naukri', Logo: NaukriLogo, href: SOURCE_URLS.naukri },
  { name: 'Glassdoor', Logo: GlassdoorLogo, href: SOURCE_URLS.glassdoor },
  { name: 'Wellfound', Logo: WellfoundLogo, href: SOURCE_URLS.wellfound },
];

const features = [
  ['01', 'One profile', 'Keep your roles, experience, skills and location together instead of repeating them on every site.'],
  ['02', 'Real openings', 'Results keep the original job, company, location and application link from the connected source.'],
  ['03', 'Country first', 'Choose a country as the hard boundary. Your city can still guide which results appear first.'],
  ['04', 'Auto Apply', 'Prepare the application in SLAM, then continue through the employer’s application flow.'],
];

export const LandingPage: React.FC<Props> = ({ onGetStarted, onSignIn }) => (
  <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-yellow-400 selection:text-black">
    <header className="border-b border-zinc-900 bg-[#050505]/95">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        <button onClick={onGetStarted} className="flex items-center gap-2.5" aria-label="SLAM home">
          <img src="/slam-logo.svg" alt="SLAM" className="w-8 h-8" />
          <span className="font-display font-black text-2xl tracking-[-0.07em]">SLAM</span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onSignIn} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition">Sign in</button>
          <button onClick={onGetStarted} className="px-4 py-2.5 rounded-lg bg-yellow-400 text-black text-sm font-bold hover:bg-yellow-300 transition">Create profile</button>
        </div>
      </div>
    </header>

    <main>
      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 md:py-24 grid lg:grid-cols-[1.1fr_.9fr] gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-sm text-yellow-400 font-semibold mb-5">Job search, without starting over every time.</p>
            <h1 className="max-w-3xl text-5xl sm:text-6xl md:text-7xl font-display font-black tracking-[-0.055em] leading-[0.95]">Find the right work. <span className="text-zinc-500">Then apply.</span></h1>
            <p className="mt-7 max-w-2xl text-lg text-zinc-400 leading-8">SLAM keeps your career profile in one place, finds openings across connected sources, and gives you a clean path from search to application.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={onGetStarted} className="px-6 py-3.5 rounded-lg bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition inline-flex items-center gap-2">Build my profile <ArrowRight className="w-4 h-4" /></button>
              <button onClick={onSignIn} className="px-6 py-3.5 rounded-lg border border-zinc-800 text-zinc-300 font-semibold text-sm hover:border-zinc-600 hover:text-white transition">Sign in</button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-sm text-zinc-600">
              <span>Real job sources</span><span>Country-aware search</span><span>Original application links</span>
            </div>
          </div>

          <div className="border border-zinc-800 bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div><div className="text-xs text-zinc-500">JOB SEARCH</div><div className="mt-1 font-semibold">Start with what you want</div></div>
              <div className="text-xs text-zinc-500">India</div>
            </div>
            <div className="p-5 space-y-3">
              <div className="border border-zinc-800 bg-[#050505] rounded-xl p-3.5 flex items-center gap-3"><Search className="w-4 h-4 text-zinc-600" /><div><div className="text-xs text-zinc-500">Role</div><div className="text-sm text-zinc-200 mt-0.5">Software Engineer</div></div></div>
              <div className="border border-zinc-800 bg-[#050505] rounded-xl p-3.5 flex items-center gap-3"><MapPin className="w-4 h-4 text-zinc-600" /><div><div className="text-xs text-zinc-500">Country</div><div className="text-sm text-zinc-200 mt-0.5">India</div></div></div>
              <div className="border border-zinc-800 bg-[#050505] rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-3">CONNECTED SOURCES</div>
                <div className="flex gap-2">
                  {liveSources.map(({ name, Logo }) => <div key={name} className="flex-1 min-w-0 border border-zinc-800 rounded-lg bg-white p-2 flex items-center justify-center"><Logo size={34} /></div>)}
                </div>
              </div>
              <button onClick={onGetStarted} className="w-full py-3 rounded-lg bg-yellow-400 text-black text-sm font-bold">Search jobs</button>
            </div>
            <div className="px-5 py-3 border-t border-zinc-800 text-xs text-zinc-600">Your results come from the connected feeds shown here.</div>
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-8 grid md:grid-cols-4 gap-6">
          {features.map(([n, title, text]) => <div key={n} className="md:border-l md:border-zinc-800 md:pl-5 first:border-0 first:pl-0"><div className="text-xs text-zinc-600 font-mono">{n}</div><h2 className="mt-3 font-bold text-lg">{title}</h2><p className="mt-2 text-sm text-zinc-500 leading-6">{text}</p></div>)}
        </div>
      </section>

      <section className="border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16 md:py-20 grid lg:grid-cols-[.7fr_1.3fr] gap-12">
          <div><p className="text-sm text-yellow-400 font-semibold">Built for the actual search</p><h2 className="mt-3 text-3xl md:text-4xl font-display font-black tracking-tight">Less tab switching. More useful work.</h2><p className="mt-4 text-zinc-500 leading-7">Search once, inspect the important details, save what matters, and move into the application with your information already prepared.</p></div>
          <div className="grid sm:grid-cols-2 border-t border-l border-zinc-800">
            {[
              ['Profile', 'Your experience and skills stay in one place.'],
              ['Search', 'Choose a role and country without turning every skill into a giant query.'],
              ['Results', 'See the company, location, source, posting date and original listing.'],
              ['Application', 'Use Auto Apply to prepare the application and continue to the employer flow.'],
            ].map(([title, text]) => <div key={title} className="p-6 border-r border-b border-zinc-800"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm text-zinc-500 leading-6">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-900 bg-[#080808]">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"><div><p className="text-sm text-yellow-400 font-semibold">Connected sources</p><h2 className="mt-2 text-3xl md:text-4xl font-display font-black">Where jobs come from</h2></div><p className="max-w-xl text-sm text-zinc-500 leading-6">SLAM queries the sources below. Other job sites are listed separately as direct destinations, not presented as SLAM feeds.</p></div>
          <div className="grid md:grid-cols-3 gap-3">
            {liveSources.map(({ name, Logo, href, text }) => <a key={name} href={href} target="_blank" rel="noreferrer" className="group border border-zinc-800 bg-[#050505] rounded-xl p-5 hover:border-zinc-600 transition"><div className="flex items-center justify-between"><Logo size={48} /><ExternalLink className="w-4 h-4 text-zinc-700 group-hover:text-yellow-400" /></div><div className="mt-5 font-bold">{name}</div><div className="mt-1 text-xs text-zinc-500">{text}</div></a>)}
          </div>
          <div className="mt-4 border border-zinc-800 rounded-xl p-5"><div className="text-xs text-zinc-600 mb-4">SEARCH DIRECTLY</div><div className="flex flex-wrap gap-2">{externalPlatforms.map(({ name, Logo, href }) => <a key={name} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-zinc-800 rounded-lg bg-[#050505] px-3 py-2 hover:border-zinc-600 transition"><Logo size={22} /><span className="text-xs font-semibold">{name}</span><ExternalLink className="w-3 h-3 text-zinc-700" /></a>)}</div></div>
        </div>
      </section>

      <section>
        <div className="max-w-5xl mx-auto px-5 sm:px-6 py-16 md:py-20 text-center"><div className="mx-auto w-10 h-10 rounded-lg bg-yellow-400 text-black flex items-center justify-center"><Check className="w-5 h-5" /></div><h2 className="mt-6 text-3xl md:text-5xl font-display font-black tracking-tight">Start with your profile.</h2><p className="mt-4 max-w-2xl mx-auto text-zinc-500 leading-7">Set it up once. Search jobs by role and country. Keep the application step close.</p><button onClick={onGetStarted} className="mt-7 px-7 py-3.5 rounded-lg bg-yellow-400 text-black font-bold text-sm inline-flex items-center gap-2 hover:bg-yellow-300 transition">Create my profile <ArrowRight className="w-4 h-4" /></button></div>
      </section>
    </main>

    <footer className="border-t border-zinc-900">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600"><div className="flex items-center gap-2"><img src="/slam-logo.svg" alt="" className="w-5 h-5" /> <span>SLAM · 2026</span></div><div className="flex items-center gap-5"><span>Real job sources</span><span>Original application links</span></div></div>
    </footer>
  </div>
);
