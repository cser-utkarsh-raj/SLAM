import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { ConnectionsPanel } from './ConnectionsPanel';
import {
  LinkedInLogo,
  IndeedLogo,
  GlassdoorLogo,
  WellfoundLogo,
  WorkIndiaLogo,
  InstahyreLogo,
} from './SourceLogos';

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const sourcePlatforms = [
  { name: 'LinkedIn', Logo: LinkedInLogo, status: 'OAuth 2.0' },
  { name: 'Indeed', Logo: IndeedLogo, status: 'Direct Feed' },
  { name: 'Glassdoor', Logo: GlassdoorLogo, status: 'Verified Index' },
  { name: 'Wellfound', Logo: WellfoundLogo, status: 'Startup Network' },
  { name: 'WorkIndia', Logo: WorkIndiaLogo, status: 'Pan-India Gateway' },
  { name: 'Instahyre', Logo: InstahyreLogo, status: 'Curated Pipeline' },
];

export const LandingPage: React.FC<Props> = ({ onGetStarted, onSignIn }) => {
  const shouldReduceMotion = useReducedMotion();
  const [animatedScore, setAnimatedScore] = useState(shouldReduceMotion ? 92 : 0);

  // Smooth single-pass score counter from 0 to 92 on first mount
  useEffect(() => {
    if (shouldReduceMotion) return;
    const duration = 1200;
    const start = performance.now();
    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(ease * 92));
      if (progress < 1) requestAnimationFrame(frame);
    };
    const timer = setTimeout(() => requestAnimationFrame(frame), 400);
    return () => clearTimeout(timer);
  }, [shouldReduceMotion]);

  // Restrained, staggered animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.1 : 0.6,
        delay: shouldReduceMotion ? 0 : custom,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-yellow-400 selection:text-black">
      {/* ============================================================ */}
      {/* 1. HERO SECTION — EDITORIAL, CONFIDENT, SPACIOUS */}
      {/* ============================================================ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 border-b border-zinc-900">
        {/* Extremely subtle ambient lighting (non-distracting) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] pointer-events-none opacity-40 blur-[120px] -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(250, 204, 21, 0.08) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Massive Confident Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Integrated Logo-S + LAM Headline */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0.15}
              className="flex items-center -space-x-2 sm:-space-x-3 md:-space-x-4 select-none"
            >
              {/* Custom SVG 'S' glyph matching the logo's yellow rounded stroke & terminal dot */}
              <svg
                viewBox="0 0 120 128"
                className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 shrink-0 drop-shadow-md"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 28H42C31.507 28 23 36.507 23 47s8.507 19 19 19h42c10.493 0 19 8.507 19 19s-8.507 19-19 19H35"
                  stroke="#FACC15"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <circle cx="104" cy="29" r="6" fill="#F4F4F5" />
              </svg>

              <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] tracking-[-0.07em] leading-none text-white">
                LAM
              </h1>
            </motion.div>

            {/* Supporting Editorial Statement */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0.25}
              className="mt-8 max-w-xl text-lg sm:text-xl text-zinc-300 font-light leading-relaxed"
            >
              <p>
                One authoritative career profile. Real multi-source listings. Mathematical compatibility scores.
              </p>
              <p className="text-sm text-zinc-500 mt-2 font-normal">
                Job discovery, explainable matching, and application preparation that never invents qualifications.
              </p>
            </motion.div>

            {/* Primary & Secondary Action CTAs */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0.38}
              className="mt-10 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={onGetStarted}
                className="group px-8 py-4 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-black font-black text-xs uppercase tracking-widest rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer shadow-sm hover:translate-y-[-1px]"
              >
                <span>BUILD MY PROFILE</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={onSignIn}
                className="px-7 py-4 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider rounded-xl transition duration-200 cursor-pointer"
              >
                SIGN IN
              </button>
            </motion.div>

            {/* Credibility Micro-Bar */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0.48}
              className="mt-12 pt-6 border-t border-zinc-900 flex flex-wrap items-center gap-6 text-xs text-zinc-500 font-mono"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
                <span>Source-of-truth profile</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-400" />
                <span>No third-party passwords</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Monolithic Match Engine Interface */}
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0.3}
            className="lg:col-span-5"
          >
            <div className="relative border border-zinc-800 bg-[#090909] rounded-2xl p-6 shadow-2xl">
              {/* Interface Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="font-mono text-xs font-bold tracking-widest text-zinc-200 uppercase">
                    REAL MATCH ENGINE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 bg-emerald-950/40 border border-emerald-800/50 rounded font-semibold tracking-wider uppercase">
                  LIVE SCORING
                </span>
              </div>

              {/* Primary Evaluated Role */}
              <div className="p-5 border border-zinc-800/90 bg-zinc-950 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                      <LinkedInLogo className="w-3.5 h-3.5" />
                      <span>LinkedIn &middot; Stripe</span>
                    </div>
                    <div className="font-bold text-base text-white mt-1">
                      Senior Python & Distributed Systems
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      Worldwide Remote &middot; Verified Feed
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-3xl font-display font-black text-yellow-400 tabular-nums">
                      {animatedScore}%
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                      MATCH
                    </div>
                  </div>
                </div>

                {/* Overlap Breakdown */}
                <div className="mt-4 pt-3 border-t border-zinc-900">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    Verified Skill Overlap
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['FastAPI', 'PostgreSQL', 'Redis', 'Distributed Systems'].map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-1"
                      >
                        <span className="text-yellow-400 text-[10px]">&check;</span> {skill}
                      </span>
                    ))}
                  </div>

                  {/* Identified Gap */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-900/60">
                    <span className="text-zinc-500">Identified Qualification Gap</span>
                    <span className="text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      Kubernetes (3+ yrs)
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Role (Subordinate Depth Preview) */}
              <div className="mt-3 p-3.5 border border-zinc-900 bg-zinc-950/60 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <WellfoundLogo className="w-4 h-4 shrink-0" />
                  <div className="truncate">
                    <span className="text-zinc-300 font-medium">Full Stack Engineer</span>
                    <span className="text-zinc-500 text-[11px] ml-1.5">&middot; Scale AI</span>
                  </div>
                </div>
                <div className="font-display font-bold text-zinc-300 text-sm pl-2 shrink-0">
                  87% <span className="text-[9px] font-mono text-zinc-600 font-normal">MATCH</span>
                </div>
              </div>

              {/* System Note */}
              <div className="mt-4 text-[10px] font-mono text-zinc-500 text-center">
                *Visual representation of scoring algorithm. Real jobs evaluate against your verified resume.
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. ONE PLACE. MULTIPLE JOB SOURCES — SLOW RESTRAINED MARQUEE */}
      {/* ============================================================ */}
      <section className="py-8 border-b border-zinc-900 bg-[#070707]">
        <div className="max-w-7xl mx-auto px-6 mb-4 flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-zinc-400 font-bold">
            ONE PLACE &middot; MULTIPLE LEGITIMATE SOURCES
          </span>
          <span className="text-[11px] font-mono text-zinc-600 hidden sm:inline-block">
            AUTHORIZED APIS &middot; OFFICIAL GATEWAYS
          </span>
        </div>

        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex gap-4 w-max animate-[marquee_38s_linear_infinite] hover:[animation-play-state:paused]">
            {[...sourcePlatforms, ...sourcePlatforms, ...sourcePlatforms].map((source, idx) => (
              <div
                key={`${source.name}-${idx}`}
                className="px-4 py-2.5 border border-zinc-800/80 bg-zinc-950 rounded-lg flex items-center gap-3 shrink-0"
              >
                <source.Logo className="w-4 h-4" />
                <span className="text-xs font-bold text-white tracking-wide font-display">{source.name}</span>
                <span className="text-[10px] font-mono text-zinc-500 border-l border-zinc-800 pl-2">
                  {source.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. EDITORIAL MANIFESTO SECTION — BOLD TYPOGRAPHY & RATIOS */}
      {/* ============================================================ */}
      <section className="py-24 max-w-7xl mx-auto px-6 border-b border-zinc-900">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Editorial Headline & High-Contrast Highlight Block */}
          <div className="lg:col-span-5">
            <span className="text-[11px] font-mono font-bold tracking-[0.25em] text-yellow-400 uppercase">
              THE SLAM METHOD
            </span>
            <h2 className="text-4xl sm:text-5xl font-display font-black text-white mt-3 leading-[0.95] tracking-tight">
              HOW CAREER<br />AUTOMATION<br />SHOULD WORK.
            </h2>
            <p className="mt-5 text-sm text-zinc-400 leading-relaxed max-w-md">
              Most job boards spam you with unrelated postings and generic percentages. SLAM replaces guesswork with deterministic skill matching and factual document preparation.
            </p>

            {/* Editorial Highlight Poster Box (Inspired by Reference Direction) */}
            <div className="mt-8 p-6 bg-yellow-400 text-black rounded-2xl">
              <div className="text-xs font-mono font-black tracking-widest uppercase">
                ZERO COMPROMISE
              </div>
              <div className="text-2xl font-display font-black leading-tight mt-2">
                Less noise, more signal &mdash; that's the formula.
              </div>
              <div className="text-xs font-medium text-black/80 mt-3 leading-relaxed">
                Where your verified career profile meets real employer listings without invented facts or fake applications.
              </div>
            </div>
          </div>

          {/* Right Column: 01 / 02 / 03 Numbered Editorial Rows */}
          <div className="lg:col-span-7 space-y-8">
            {[
              {
                num: '01',
                title: 'DISCOVER',
                subtitle: 'Real listings from multiple authorized sources.',
                body: 'Aggregates fresh opportunities across LinkedIn, Indeed, Glassdoor, WorkIndia, Wellfound, and Instahyre with smart deduplication and country-aware filtering.',
              },
              {
                num: '02',
                title: 'MATCH',
                subtitle: 'Understand exactly why a job fits you.',
                body: 'Mathematical overlap analysis evaluates required skills, seniority, and location preferences with explainable breakdown chips rather than fabricated 99% scores.',
              },
              {
                num: '03',
                title: 'PREPARE',
                subtitle: 'Grounded in your actual resume and background.',
                body: 'Generates tailored summaries, cover letters, and interview talking points strictly from facts in your profile. Unsubstantiated questions are marked for human confirmation.',
              },
            ].map((item) => (
              <div key={item.num} className="pb-8 border-b border-zinc-900 last:border-0 last:pb-0">
                <div className="flex items-baseline gap-4">
                  <span className="font-display font-black text-3xl sm:text-4xl text-yellow-400 tabular-nums">
                    {item.num}
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-black text-white tracking-tight">
                      {item.title}
                    </h3>
                    <div className="text-xs font-mono text-zinc-400 mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed pl-12 sm:pl-14">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SLAM+ SECTION — EDITORIAL & RESTRAINED (₹49/month) */}
      {/* ============================================================ */}
      <section className="py-20 max-w-7xl mx-auto px-6 border-b border-zinc-900">
        <div className="p-8 sm:p-12 border border-zinc-800 bg-[#080808] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-block text-xs font-mono font-bold tracking-widest text-yellow-400 uppercase bg-yellow-400/10 px-2.5 py-1 rounded border border-yellow-400/20 mb-3">
              SLAM+ ₹49/month
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight leading-tight">
              AUTOMATED BACKGROUND MONITORING.
            </h2>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
              Discovers fresh listings across supported job sources in the background, calculates compatibility, and prepares tailored application drafts with Razorpay verification.
            </p>
          </div>

          <button
            onClick={onGetStarted}
            className="shrink-0 px-8 py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer shadow-sm hover:translate-y-[-1px]"
          >
            GET STARTED
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. JOB SOURCES & OFFICIAL CONNECTIONS */}
      {/* ============================================================ */}
      <section className="py-16">
        <ConnectionsPanel />
      </section>
    </div>
  );
};
