import React, { useRef, useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { UserProfile } from '../types';

const API = import.meta.env.VITE_API_URL || '';

async function readResponse(response: Response) {
  const raw = await response.text();
  try { return raw ? JSON.parse(raw) : {}; }
  catch { throw new Error(raw.slice(0, 240) || `Server returned HTTP ${response.status}`); }
}

export const ResumeImporter: React.FC<{ onProfile: (profile: UserProfile) => void }> = ({ onProfile }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Upload a PDF, DOCX or TXT resume.');
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [suggesting, setSuggesting] = useState(false);

  const loadSuggestions = async (country: string, roles: string[]) => {
    if (!country.trim()) return;
    setSuggesting(true);
    try {
      const response = await fetch(`${API}/api/jobs/country-suggestions`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({country, roles, limit:8}) });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.detail || data.error || 'Could not load country suggestions.');
      setSuggestions(data);
    } catch { setSuggestions(null); }
    finally { setSuggesting(false); }
  };

  const parse = async (file: File) => {
    const allowed = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain'];
    if (!allowed.includes(file.type) && !/\.(pdf|docx|txt)$/i.test(file.name)) { setError('Please choose a PDF, DOCX or TXT resume.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('Resume is larger than 10 MB.'); return; }
    setBusy(true); setError(''); setStatus('Extracting real resume text…');
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch(`${API}/api/ai/parse-resume`, { method:'POST', body:form });
      const data = await readResponse(response);
      if (!response.ok) throw new Error(data.detail || data.error || `Resume extraction failed (HTTP ${response.status}).`);
      if (!data.profile) throw new Error('The extractor returned no profile.');
      const imported = data.profile as UserProfile;
      setProfile(imported);
      onProfile(imported);
      setStatus(`Imported successfully • ${data.engine || 'SLAM extractor'}`);
      if (imported.country) void loadSuggestions(imported.country, imported.targetRoles || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resume processing failed.');
      setStatus('Nothing was changed.');
    } finally { setBusy(false); }
  };

  return <section className="max-w-5xl mx-auto px-6 py-12">
    <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-8 md:p-12">
      <div className="flex items-start gap-5 mb-8">
        <div className="p-3 rounded-2xl bg-white text-black"><FileText size={28}/></div>
        <div><p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Profile intake</p><h1 className="text-4xl md:text-6xl font-black tracking-tight mt-2">YOUR DATA.<br/>NOT A TEMPLATE.</h1><p className="text-zinc-400 mt-4 max-w-xl">SLAM extracts facts from your actual resume. Missing information stays missing.</p></div>
      </div>
      <button disabled={busy} onClick={() => inputRef.current?.click()} className="w-full min-h-40 border border-dashed border-zinc-700 rounded-2xl hover:border-zinc-400 transition flex flex-col items-center justify-center gap-3 disabled:opacity-50">
        {busy ? <Loader2 className="animate-spin"/> : <Upload/>}<span className="font-bold">{busy ? 'PROCESSING' : 'CHOOSE RESUME'}</span><span className="text-xs text-zinc-500">PDF · DOCX · TXT · max 10 MB</span>
      </button>
      <input ref={inputRef} hidden type="file" accept=".pdf,.docx,.txt" onChange={e => { const f=e.target.files?.[0]; if(f) void parse(f); e.currentTarget.value=''; }}/>
      <div className={`mt-5 text-sm flex items-center gap-2 ${error ? 'text-red-300' : 'text-zinc-400'}`}>{error ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {error || status}</div>

      {profile?.country && <div className="mt-8 border-t border-zinc-900 pt-7">
        <div className="flex items-center justify-between gap-4 mb-4"><div><div className="flex items-center gap-2 text-white font-bold"><MapPin size={16}/> Country-aware search</div><p className="text-xs text-zinc-500 mt-1">Suggestions use the country extracted from your resume: <b className="text-zinc-300">{profile.country}</b></p></div><button disabled={suggesting} onClick={() => void loadSuggestions(profile.country, profile.targetRoles || [])} className="text-xs font-bold px-3 py-2 border border-zinc-700 hover:border-zinc-500">{suggesting ? 'LOADING' : 'REFRESH'}</button></div>
        {suggestions && <div className="grid md:grid-cols-2 gap-3">{(suggestions.suggestions || []).map((s:any) => <div key={s.id || s.title} className="p-4 bg-zinc-900/60 border border-zinc-800"><div className="text-sm font-bold text-white">{s.title}</div><div className="text-xs text-zinc-400 mt-1">{s.reason}</div><div className="text-[11px] text-zinc-600 mt-2">{s.searchQuery}</div></div>)}</div>}
      </div>}
    </div>
  </section>;
};
