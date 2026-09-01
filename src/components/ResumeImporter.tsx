import React, { useRef, useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

const API = import.meta.env.VITE_API_URL || '';

export const ResumeImporter: React.FC<{ onProfile: (profile: UserProfile) => void }> = ({ onProfile }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>('Upload a PDF, DOCX or TXT resume.');
  const [error, setError] = useState('');

  const parse = async (file: File) => {
    setBusy(true); setError(''); setStatus('Reading resume…');
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch(`${API}/api/ai/parse-resume`, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || 'Resume could not be processed.');
      if (!data.profile) throw new Error('No profile was returned.');
      onProfile(data.profile as UserProfile);
      setStatus(`Imported successfully • ${data.engine || 'SLAM extractor'}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Resume processing failed.');
      setStatus('Nothing was changed.');
    } finally { setBusy(false); }
  };

  return <section className="max-w-4xl mx-auto px-6 py-12">
    <div className="border border-zinc-800 bg-zinc-950 rounded-3xl p-8 md:p-12">
      <div className="flex items-start gap-5 mb-8">
        <div className="p-3 rounded-2xl bg-white text-black"><FileText size={28}/></div>
        <div><p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Profile intake</p><h1 className="text-4xl md:text-6xl font-black tracking-tight mt-2">YOUR DATA.<br/>NOT A TEMPLATE.</h1><p className="text-zinc-400 mt-4 max-w-xl">SLAM extracts only information that actually exists in your resume. Missing information stays missing.</p></div>
      </div>
      <button disabled={busy} onClick={() => inputRef.current?.click()} className="w-full min-h-40 border border-dashed border-zinc-700 rounded-2xl hover:border-zinc-400 transition flex flex-col items-center justify-center gap-3 disabled:opacity-50">
        {busy ? <Loader2 className="animate-spin"/> : <Upload/>}<span className="font-bold">{busy ? 'PROCESSING' : 'CHOOSE RESUME'}</span><span className="text-xs text-zinc-500">PDF · DOCX · TXT · max 10 MB</span>
      </button>
      <input ref={inputRef} hidden type="file" accept=".pdf,.docx,.txt" onChange={e => { const f=e.target.files?.[0]; if(f) parse(f); e.currentTarget.value=''; }}/>
      <div className="mt-5 text-sm flex items-center gap-2 text-zinc-400">{error ? <AlertCircle size={16}/> : <CheckCircle2 size={16}/>} {error || status}</div>
    </div>
  </section>;
};
