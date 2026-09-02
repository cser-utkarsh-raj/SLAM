import React, { useState } from 'react';
import { Crown, Check, ShieldAlert, Sparkles, Zap, X, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSubscribed: boolean;
  onToggleSubscription: () => void;
}

export const SlamPlusModal: React.FC<Props> = ({
  isOpen,
  onClose,
  isSubscribed,
  onToggleSubscription,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = () => {
    onToggleSubscription();
    setSuccessMessage(isSubscribed ? 'SLAM+ membership paused.' : 'SLAM+ activated for your account!');
    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-yellow-400/40 w-full max-w-lg p-8 relative rounded-2xl shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white p-1 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-yellow-400">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-yellow-400 uppercase">
              Subscription Plan
            </span>
            <h2 className="text-2xl font-display font-black text-white">SLAM+ PRO</h2>
          </div>
        </div>

        <p className="text-xs text-zinc-400 mt-2">
          High-performance job search infrastructure for active candidates in India and global markets.
        </p>

        <div className="my-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-black text-white font-display">₹49</div>
            <div className="text-[11px] font-mono text-zinc-500">per month (cancel anytime)</div>
          </div>
          <span className="px-2.5 py-1 bg-yellow-400 text-black text-[10px] font-extrabold uppercase tracking-wider rounded-md">
            Best Value
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
            Included in SLAM+
          </h4>
          <ul className="space-y-2 text-xs text-zinc-300">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Continuous Job Monitoring:</b> Automatic periodic checks across verified job boards.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Pre-Generated Application Packages:</b> Tailored resumes &amp; cover letters ready when listings go live.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><b>Priority AI Match Analysis:</b> In-depth compatibility breakdown and keyword alignment.</span>
            </li>
          </ul>
        </div>

        <div className="p-3.5 bg-zinc-950/80 border border-zinc-900 rounded-lg text-[11px] text-zinc-500 mb-6 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <span>
            <b>Zero-Violation Guarantee:</b> SLAM never bypasses CAPTCHAs, never requests third-party passwords, and never submits applications without your explicit review.
          </span>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-emerald-300 text-xs font-semibold text-center">
            {successMessage}
          </div>
        )}

        <button
          onClick={handleAction}
          className={`w-full py-3 text-xs font-black uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            isSubscribed
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
              : 'bg-yellow-400 hover:bg-yellow-300 text-black font-display font-black'
          }`}
        >
          {isSubscribed ? (
            <span>Pause / Manage SLAM+ (Active)</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Activate SLAM+ (₹49/month)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
