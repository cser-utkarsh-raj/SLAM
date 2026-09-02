import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Crown, ExternalLink, Radio, CircleSlash2 } from 'lucide-react';
import { LinkedInLogo, IndeedLogo, GlassdoorLogo, WellfoundLogo, WorkIndiaLogo, InstahyreLogo, ArbeitnowLogo, SOURCE_URLS } from './SourceLogos';

const API = import.meta.env.VITE_API_URL || '';

const PLATFORMS = [
  { id: 'arbeitnow', name: 'Arbeitnow', Logo: ArbeitnowLogo, href: SOURCE_URLS.arbeitnow, kind: 'live', desc: 'Live public job feed currently used by SLAM' },
  { id: 'linkedin', name: 'LinkedIn', Logo: LinkedInLogo, href: SOURCE_URLS.linkedin, kind: 'site', desc: 'Official jobs site • no SLAM job-search connector enabled' },
  { id: 'indeed', name: 'Indeed', Logo: IndeedLogo, href: SOURCE_URLS.indeed, kind: 'site', desc: 'Official jobs site • publisher access requires partner approval' },
  { id: 'glassdoor', name: 'Glassdoor', Logo: GlassdoorLogo, href: SOURCE_URLS.glassdoor, kind: 'site', desc: 'Official jobs site • no SLAM connector enabled' },
  { id: 'wellfound', name: 'Wellfound', Logo: WellfoundLogo, href: SOURCE_URLS.wellfound, kind: 'site', desc: 'Official startup jobs site • no SLAM connector enabled' },
  { id: 'workindia', name: 'WorkIndia', Logo: WorkIndiaLogo, href: SOURCE_URLS.workindia, kind: 'site', desc: 'Official jobs site • no SLAM connector enabled' },
  { id: 'instahyre', name: 'Instahyre', Logo: InstahyreLogo, href: SOURCE_URLS.instahyre, kind: 'site', desc: 'Official hiring site • no SLAM connector enabled' },
];

export function ConnectionsPanel() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/connections`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('source status failed')))
      .then((d) => setConnections(d.connections || []))
      .catch(() => setConnections([]));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900 mb-10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-yellow-400 font-bold">SOURCE DIRECTORY</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white mt-2 tracking-tight">REAL SOURCES. NO PRETEND INTEGRATIONS.</h2>
        </div>
        <p className="text-zinc-400 max-w-md text-xs sm:text-sm leading-relaxed">Every logo and destination below points to the real platform. SLAM only labels a source as live when a verified connector is actually configured.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(({ id, name, Logo, href, kind, desc }) => {
          const state = connections.find((c) => c.provider === id);
          const live = kind === 'live';
          return (
            <div key={id} className="border border-zinc-800 bg-[#090909] p-5 rounded-xl hover:border-zinc-700 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0"><Logo className="w-5 h-5" /></div>
                  <div className="min-w-0"><div className="text-sm font-bold text-white font-display">{name}</div><div className="text-[10px] text-zinc-400 font-mono leading-snug mt-0.5">{desc}</div></div>
                </div>
                {live ? <Radio className="w-4 h-4 text-emerald-400 shrink-0" /> : <CircleSlash2 className="w-4 h-4 text-zinc-700 shrink-0" />}
              </div>
              <div className="mt-5 pt-3 border-t border-zinc-900 flex items-center justify-between gap-3">
                <span className={`text-[10px] font-mono uppercase tracking-wider ${live ? 'text-emerald-400' : 'text-zinc-500'}`}>{live ? 'LIVE SOURCE' : 'OFFICIAL SITE'}</span>
                <a href={href} target="_blank" rel="noreferrer" className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5"><span>Visit site</span><ExternalLink className="w-3 h-3 text-zinc-500" /></a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-900 grid md:grid-cols-3 gap-6 text-xs text-zinc-400 font-mono">
        <div className="flex items-start gap-3"><ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" /><div><div className="text-white font-bold font-display">No passwords stored</div><div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">Third-party credentials never belong in SLAM.</div></div></div>
        <div className="flex items-start gap-3"><Lock className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" /><div><div className="text-white font-bold font-display">Official access only</div><div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">OAuth, partner APIs, and human verification stay with the platform.</div></div></div>
        <div className="flex items-start gap-3"><Crown className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" /><div><div className="text-white font-bold font-display">SLAM+ ₹49/month</div><div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">Background discovery activates only after a real subscription is verified.</div></div></div>
      </div>
    </div>
  );
}
