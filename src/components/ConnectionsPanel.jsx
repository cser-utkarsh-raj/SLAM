import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Crown, ExternalLink } from 'lucide-react';
import {
  LinkedInLogo,
  IndeedLogo,
  GlassdoorLogo,
  WellfoundLogo,
  WorkIndiaLogo,
  InstahyreLogo,
} from './SourceLogos';

const API = import.meta.env.VITE_API_URL || '';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', Logo: LinkedInLogo, desc: 'Official OAuth 2.0 & Job Feed' },
  { id: 'indeed', name: 'Indeed', Logo: IndeedLogo, desc: 'Direct Employer Postings API' },
  { id: 'glassdoor', name: 'Glassdoor', Logo: GlassdoorLogo, desc: 'Verified Salary & Company Feed' },
  { id: 'wellfound', name: 'Wellfound', Logo: WellfoundLogo, desc: 'Startup & AngelList Ecosystem' },
  { id: 'workindia', name: 'WorkIndia', Logo: WorkIndiaLogo, desc: 'Regional & Pan-India Network' },
  { id: 'instahyre', name: 'Instahyre', Logo: InstahyreLogo, desc: 'Curated Tech Talent Index' },
];

export function ConnectionsPanel() {
  const [connections, setConnections] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API}/api/connections`)
      .then((r) => r.json())
      .then((d) => setConnections(d.connections || []))
      .catch(() => {});
  }, []);

  const connect = async (provider) => {
    setMessage('');
    try {
      const r = await fetch(`${API}/api/connections/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const d = await r.json();
      setMessage(d.message || 'This source connection setup is initialized.');
    } catch {
      setMessage('Connection service is temporarily unavailable.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-900 mb-10">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-yellow-400 font-bold">
            AUTHORIZED GATEWAYS
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-white mt-2 tracking-tight">
            CONNECT YOUR SOURCES.
          </h2>
        </div>
        <p className="text-zinc-400 max-w-md text-xs sm:text-sm leading-relaxed">
          Authenticate only via authorized developer APIs and OAuth 2.0. SLAM never asks for or stores third-party passwords.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(({ id, name, Logo, desc }) => {
          const state = connections.find((c) => c.provider === id);
          const isConnected = state?.status === 'connected';
          return (
            <div
              key={id}
              className="border border-zinc-800 bg-[#090909] p-5 rounded-xl hover:border-zinc-700 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                    <Logo className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white font-display">{name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{desc}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-zinc-900 flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {isConnected ? '✓ Active' : 'Setup Required'}
                </span>
                <button
                  onClick={() => connect(id)}
                  className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-600 rounded-lg text-xs font-mono text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isConnected ? 'Manage' : 'Connect'}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-zinc-900 grid md:grid-cols-3 gap-6 text-xs text-zinc-400 font-mono">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-bold font-display">No passwords stored</div>
            <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">Credentials stay with official platform OAuth dialogs.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Lock className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-bold font-display">Human checkpoints</div>
            <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">2FA, OTPs, and verification steps remain with you.</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Crown className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-white font-bold font-display">SLAM+ ₹49/month</div>
            <div className="text-[11px] text-zinc-500 mt-0.5 leading-snug">Continuous background discovery for active subscribers.</div>
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-6 border border-zinc-800 bg-zinc-950 p-4 rounded-xl text-xs font-mono text-zinc-300">
          {message}
        </div>
      )}
    </div>
  );
}
