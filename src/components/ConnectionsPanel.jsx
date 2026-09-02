import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Lock, Crown, ExternalLink, Radio, CircleSlash2, RefreshCw, Search, MapPin, CheckCircle2 } from 'lucide-react';
import { LinkedInLogo, IndeedLogo, GlassdoorLogo, WellfoundLogo, WorkIndiaLogo, InstahyreLogo, ArbeitnowLogo, SOURCE_URLS } from './SourceLogos';

const API = import.meta.env.VITE_API_URL || '';

const PLATFORMS = [
  { id: 'arbeitnow', name: 'Arbeitnow', Logo: ArbeitnowLogo, href: SOURCE_URLS.arbeitnow, kind: 'live', desc: 'Live public job feed currently queried by SLAM' },
  { id: 'linkedin', name: 'LinkedIn', Logo: LinkedInLogo, href: SOURCE_URLS.linkedin, kind: 'site', desc: 'Official jobs site • no SLAM job-search connector enabled' },
  { id: 'indeed', name: 'Indeed', Logo: IndeedLogo, href: SOURCE_URLS.indeed, kind: 'site', desc: 'Official jobs site • publisher access requires partner approval' },
  { id: 'glassdoor', name: 'Glassdoor', Logo: GlassdoorLogo, href: SOURCE_URLS.glassdoor, kind: 'site', desc: 'Official jobs site • no SLAM connector enabled' },
  { id: 'wellfound', name: 'Wellfound', Logo: WellfoundLogo, href: SOURCE_URLS.wellfound, kind: 'site', desc: 'Official startup jobs site • no SLAM connector enabled' },
  { id: 'workindia', name: 'WorkIndia', Logo: WorkIndiaLogo, href: SOURCE_URLS.workindia, kind: 'site', desc: 'Official jobs site • no SLAM connector enabled' },
  { id: 'instahyre', name: 'Instahyre', Logo: InstahyreLogo, href: SOURCE_URLS.instahyre, kind: 'site', desc: 'Official hiring site • no SLAM connector enabled' },
];

function readProfile() {
  try {
    const raw = localStorage.getItem('slam_user_profile');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildIntelligentProfileQuery(p) {
  if (!p) return '';
  const role = p.targetRoles?.[0] || p.currentRole || '';
  const roleLower = role.toLowerCase();
  
  const allSkills = [
    ...(Array.isArray(p.skills) ? p.skills : []),
    ...(Array.isArray(p.technologies) ? p.technologies : [])
  ].filter(Boolean);

  const uniqueSkills = Array.from(new Set(allSkills))
    .filter((s) => s && !roleLower.includes(s.toLowerCase()))
    .slice(0, 4);

  const parts = [];
  if (role) parts.push(role);
  if (uniqueSkills.length > 0) parts.push(...uniqueSkills);

  return parts.join(' + ').slice(0, 120);
}

export function ConnectionsPanel() {
  const [connections, setConnections] = useState([]);
  const [liveJobs, setLiveJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState('');

  const loadLiveMatches = async (currentProfile = profile) => {
    if (!currentProfile || (!currentProfile.targetRoles?.length && !currentProfile.currentRole && !currentProfile.skills?.length && !currentProfile.technologies?.length)) {
      setJobError('Build your career profile first so SLAM can search using your real skills and target roles.');
      setLiveJobs([]);
      setActiveQuery('');
      return;
    }

    const query = buildIntelligentProfileQuery(currentProfile);
    if (!query.trim()) {
      setJobError('Please add a target role or skills to your career profile to discover matching jobs.');
      setLiveJobs([]);
      setActiveQuery('');
      return;
    }

    setActiveQuery(query);
    setLoadingJobs(true);
    setJobError('');
    try {
      const response = await fetch(`${API}/api/jobs/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          location: currentProfile.location || '',
          country: currentProfile.country || '',
          remote: currentProfile.relocationPreference === 'Remote Only' || currentProfile.relocationPreference === 'Remote',
          limit: 6,
          profile: currentProfile,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || data.error || `Live discovery failed (${response.status}).`);
      setLiveJobs(Array.isArray(data.jobs) ? data.jobs : []);
      if (!data.jobs?.length) setJobError(data.warning || 'No verified live listings matched this profile right now.');
    } catch (error) {
      setLiveJobs([]);
      setJobError(error instanceof Error ? error.message : 'Live discovery is temporarily unavailable.');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    const currentProfile = readProfile();
    setProfile(currentProfile);
    fetch(`${API}/api/connections`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('source status failed')))
      .then((d) => setConnections(d.connections || []))
      .catch(() => setConnections([]));
    void loadLiveMatches(currentProfile);
  }, []);

  const liveConnection = useMemo(() => connections.find((c) => c.provider === 'arbeitnow'), [connections]);

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900 mb-10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-yellow-400 font-bold">SOURCE DIRECTORY</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white mt-2 tracking-tight">REAL SOURCES. LIVE DATA.</h2>
        </div>
        <p className="text-zinc-400 max-w-md text-xs sm:text-sm leading-relaxed">SLAM never invents a job to make this section look populated. The live panel below queries the configured public feed using your saved career profile and ranks the returned listings against it.</p>
      </div>

      <div className="mb-10 border border-zinc-800 bg-[#090909] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">LIVE PROFILE MATCHING</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-display font-black text-white mt-1">Real jobs matched to your profile.</h3>
            <p className="text-[11px] text-zinc-500 font-mono mt-1">
              {profile?.country ? `Market: ${profile.country}` : 'Market: profile country required'}
              {activeQuery ? ` · Query: ${activeQuery}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadLiveMatches(readProfile())}
            disabled={loadingJobs}
            className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingJobs ? 'animate-spin' : ''}`} />
            {loadingJobs ? 'FETCHING LIVE DATA' : 'REFRESH LIVE MATCHES'}
          </button>
        </div>

        {loadingJobs && (
          <div className="py-8 text-center text-xs font-mono text-zinc-500">Querying the live source and calculating compatibility...</div>
        )}

        {!loadingJobs && liveJobs.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveJobs.map((job) => {
              const score = job.match?.compatibilityScore;
              return (
                <a key={job.id} href={job.applicationUrl} target="_blank" rel="noreferrer" className="block border border-zinc-800 bg-zinc-950 rounded-xl p-4 hover:border-yellow-400/60 hover:bg-zinc-900 transition group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white group-hover:text-yellow-300 truncate">{job.title}</div>
                      <div className="text-xs text-zinc-400 mt-0.5 truncate">{job.company}</div>
                    </div>
                    {typeof score === 'number' && (
                      <div className="text-lg font-black font-display text-yellow-400 shrink-0">{score}%</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-zinc-500">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{job.location || 'Location not specified'}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-400">{job.primarySource}</span>
                    <span className="text-zinc-600 group-hover:text-zinc-300 flex items-center gap-1">OPEN LISTING <ExternalLink className="w-3 h-3" /></span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {!loadingJobs && liveJobs.length === 0 && (
          <div className="py-6 px-4 border border-zinc-900 rounded-xl bg-zinc-950 text-center">
            <Search className="w-5 h-5 text-zinc-600 mx-auto mb-2" />
            <div className="text-xs text-zinc-400">{jobError || 'No live matches returned.'}</div>
          </div>
        )}

        <div className="mt-4 text-[10px] font-mono text-zinc-600 flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          <span>Only jobs returned by the live backend feed are shown here. No demo listings or fabricated scores.</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(({ id, name, Logo, href, kind, desc }) => {
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
