import React from 'react';
import { 
  Briefcase, 
  User, 
  Search, 
  Layers, 
  FileText, 
  PlayCircle, 
  BarChart3, 
  CheckCircle2, 
  Sparkles,
  Code2
} from 'lucide-react';
import { UserProfile } from '../types';

export type ActiveTab = 'discovery' | 'profile' | 'compare' | 'prep' | 'automation' | 'tracker' | 'python';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  savedJobsCount: number;
  compareJobsCount: number;
  activeApplicationsCount: number;
  hasAiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  compareJobsCount,
  activeApplicationsCount,
  hasAiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black font-mono text-xl shadow-lg border-2 border-yellow-300">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-wider text-lg font-mono">SLAM</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-yellow-400 font-extrabold border border-yellow-400/40">
                  v1.0 Python Core
                </span>
                {hasAiKey && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded font-bold">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    AI Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Precision Discovery &amp; Assisted Automation Platform
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                activeTab === 'discovery'
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900 font-bold'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Jobs</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900 font-bold'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile &amp; CV</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap relative ${
                activeTab === 'compare'
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900 font-bold'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Compare</span>
              {compareJobsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'compare' ? 'bg-black text-yellow-400' : 'bg-yellow-400 text-black'
                }`}>
                  {compareJobsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('prep')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                activeTab === 'prep'
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900 font-bold'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Application Prep</span>
            </button>

            <button
              onClick={() => setActiveTab('automation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                activeTab === 'automation'
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900 font-bold'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Assisted Runner</span>
            </button>

            <button
              onClick={() => setActiveTab('tracker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap ${
                activeTab === 'tracker'
                  ? 'bg-yellow-400 text-black shadow-md font-black'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900 font-bold'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tracker</span>
              {activeApplicationsCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  activeTab === 'tracker' ? 'bg-black text-yellow-400' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {activeApplicationsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('python')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap border ${
                activeTab === 'python'
                  ? 'bg-yellow-400 text-black border-yellow-400 shadow-md font-black'
                  : 'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 font-bold'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python Core</span>
            </button>
          </nav>

          {/* User Quick Badge */}
          <div className="hidden lg:flex items-center gap-3 border-l border-zinc-800 pl-4">
            <div className="text-right">
              <div className="text-xs font-extrabold text-white truncate max-w-[140px] font-mono">{userProfile.name}</div>
              <div className="text-[10px] font-medium text-zinc-400 truncate max-w-[140px]">{userProfile.headline.split('(')[0]}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-yellow-400/60 flex items-center justify-center text-xs font-black text-yellow-400 font-mono">
              {userProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

