import React, { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, LockKeyhole, Crown } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';
const PLATFORMS = [
  ['linkedin','LinkedIn'], ['indeed','Indeed'], ['glassdoor','Glassdoor'],
  ['workindia','WorkIndia'], ['wellfound','Wellfound'], ['instahyre','Instahyre']
];

export function ConnectionsPanel() {
  const [connections, setConnections] = useState([]);
  const [message, setMessage] = useState('');
  const [capabilities, setCapabilities] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/connections`).then(r => r.json()),
      fetch(`${API}/api/automation/capabilities`).then(r => r.json())
    ]).then(([c, a]) => { setConnections(c.connections || []); setCapabilities(a); }).catch(() => {});
  }, []);

  const connect = async (provider) => {
    setMessage('');
    try {
      const r = await fetch(`${API}/api/connections/start`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({provider}) });
      const data = await r.json();
      setMessage(data.message || 'Connection setup is not available yet.');
    } catch { setMessage('Connection service is unavailable.'); }
  };

  return <section className="max-w-6xl mx-auto px-6 py-12">
    <div className="mb-10">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold">Job sources</p>
      <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mt-2">CONNECT<br/>YOUR SOURCES.</h1>
      <p className="text-zinc-400 mt-5 max-w-2xl">Connect supported job platforms through their official authorization methods. SLAM never asks for or stores your platform passwords.</p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {PLATFORMS.map(([id,name]) => {
        const state = connections.find(c => c.provider === id);
        return <div key={id} className="border border-zinc-900 bg-[#090909] p-6 hover:border-zinc-700 transition-colors">
          <div className="flex items-start justify-between"><div><div className="text-lg font-black text-white">{name}</div><div className="text-xs text-zinc-600 mt-1 uppercase tracking-widest">{state?.status || 'not connected'}</div></div><ExternalLink className="w-4 h-4 text-zinc-600"/></div>
          <button onClick={() => connect(id)} className="mt-7 w-full py-3 border border-zinc-700 text-xs font-black uppercase tracking-widest text-zinc-300 hover:bg-white hover:text-black transition-colors">Connect</button>
        </div>;
      })}
    </div>

    <div className="mt-8 grid md:grid-cols-3 gap-3">
      <div className="border border-zinc-900 p-5"><ShieldCheck className="w-5 h-5 text-yellow-400"/><div className="font-bold text-white mt-4">No passwords</div><p className="text-xs text-zinc-500 mt-1">Use official authorization. Credentials stay with the platform.</p></div>
      <div className="border border-zinc-900 p-5"><LockKeyhole className="w-5 h-5 text-yellow-400"/><div className="font-bold text-white mt-4">Human checkpoints</div><p className="text-xs text-zinc-500 mt-1">2FA, CAPTCHA and unexpected authentication stay with you.</p></div>
      <div className="border border-yellow-400/30 bg-yellow-400/[0.03] p-5"><Crown className="w-5 h-5 text-yellow-400"/><div className="font-bold text-white mt-4">SLAM+ ₹49/month</div><p className="text-xs text-zinc-500 mt-1">Background job monitoring and application preparation for supported workflows.</p></div>
    </div>
    {message && <div className="mt-6 border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">{message}</div>}
    {capabilities && <div className="mt-4 text-[11px] text-zinc-600">Background submission remains subject to platform authorization and supported integrations.</div>}
  </section>;
}
