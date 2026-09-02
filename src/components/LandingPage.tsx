import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, FileText, Search, Sparkles, ShieldCheck, Linkedin, BriefcaseBusiness, Globe2 } from 'lucide-react';
import { ConnectionsPanel } from './ConnectionsPanel';

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const sources = [
  { name: 'LinkedIn', icon: Linkedin },
  { name: 'Indeed', icon: BriefcaseBusiness },
  { name: 'Glassdoor', icon: Globe2 },
  { name: 'Wellfound', icon: Sparkles },
  { name: 'WorkIndia', icon: BriefcaseBusiness },
  { name: 'Instahyre', icon: Search },
];

export const LandingPage: React.FC<Props> = ({ onGetStarted, onSignIn }) => (
  <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
    <section className="relative min-h-[78vh] flex items-center">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_15%,rgba(250,204,21,0.12),transparent_38%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-24 grid lg:grid-cols-[1.15fr_.85fr] gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7 }}>
          <div className="flex items-center gap-3 text-yellow-400 text-xs font-mono font-bold tracking-[.28em] uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /> JOB SEARCH, REBUILT
          </div>
          <h1 className="font-display font-black text-7xl sm:text-8xl lg:text-[9rem] leading-[.78] tracking-[-.07em]">SLAM<span className="text-yellow-400">.</span></h1>
          <p className="mt-8 max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed">One verified career profile. Real listings. Explainable matches. Application preparation that never invents your experience.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={onGetStarted} className="px-7 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider rounded-xl flex items-center gap-2 transition shadow-xl">
              Build my profile <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={onSignIn} className="px-7 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-sm rounded-xl transition">Sign in</button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .15 }} className="relative">
          <div className="border border-zinc-800 bg-[#090909] rounded-3xl p-5 shadow-2xl rotate-[1deg]">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
              <span className="font-display font-black tracking-widest">MATCH ENGINE</span>
              <span className="text-[10px] font-mono text-emerald-400">LIVE DATA</span>
            </div>
            {[['Senior Python Engineer','92%'],['Full Stack Developer','87%'],['Backend Engineer','81%']].map(([title, score], i) => (
              <motion.div key={title} animate={{ x: [0, i % 2 ? 3 : -2, 0] }} transition={{ duration: 4 + i, repeat: Infinity }} className="p-4 border border-zinc-900 bg-zinc-950 mb-2 rounded-xl flex items-center justify-between">
                <div><div className="font-bold text-sm">{title}</div><div className="text-[10px] text-zinc-600 mt-1">Verified listing · source tracked</div></div>
                <div className="text-2xl font-display font-black text-yellow-400">{score}</div>
              </motion.div>
            ))}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-zinc-500 uppercase">
              <div className="p-3 border border-zinc-900">Skills<br/><b className="text-white text-base">50%</b></div>
              <div className="p-3 border border-zinc-900">Experience<br/><b className="text-white text-base">20%</b></div>
              <div className="p-3 border border-zinc-900">Location<br/><b className="text-white text-base">10%</b></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>

    <section className="border-y border-zinc-900 bg-[#070707] py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-[10px] font-mono tracking-[.25em] uppercase text-zinc-600 mb-5">Connect your job sources</div>
        <div className="flex gap-3 flex-wrap">
          {sources.map(({ name, icon: Icon }) => <div key={name} className="px-5 py-3 border border-zinc-800 bg-zinc-950 rounded-xl flex items-center gap-2 text-sm font-bold text-zinc-300"><Icon className="w-4 h-4 text-yellow-400" />{name}</div>)}
        </div>
      </div>
    </section>

    <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-4">
      {[['01','RESUME','Upload once. SLAM extracts only facts actually present.'],['02','MATCH','Compare real listings against your verified profile.'],['03','PREPARE','Generate factual application material and keep final control.']].map(([n,t,d]) => (
        <div key={n} className="border border-zinc-900 bg-[#090909] rounded-2xl p-7"><div className="text-yellow-400 font-mono text-xs">{n}</div><h2 className="font-display font-black text-3xl mt-5">{t}</h2><p className="text-sm text-zinc-500 mt-3 leading-relaxed">{d}</p></div>
      ))}
    </section>

    <section className="max-w-7xl mx-auto px-6 pb-24">
      <div className="border border-yellow-400/20 bg-yellow-400/[.03] rounded-3xl p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div><div className="text-yellow-400 text-xs font-mono font-bold tracking-widest">SLAM+ / ₹49 MONTH</div><h2 className="font-display font-black text-4xl mt-2">BACKGROUND MONITORING.</h2><p className="text-zinc-500 mt-2 max-w-xl">Only real listings and supported workflows. Authentication, CAPTCHA and other human checkpoints remain yours.</p></div>
        <button onClick={onGetStarted} className="shrink-0 px-6 py-3 bg-yellow-400 text-black font-black text-xs uppercase tracking-wider rounded-xl">Get started</button>
      </div>
    </section>

    <div className="max-w-7xl mx-auto px-6 pb-24"><ConnectionsPanel /></div>
  </div>
);
