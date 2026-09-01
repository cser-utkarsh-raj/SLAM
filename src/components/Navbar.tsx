import React from 'react';
import { UserProfile } from '../types';

export type ActiveTab = 'discover' | 'saved' | 'applications' | 'profile';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userProfile }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button type="button" className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('discover')} aria-label="SLAM home">
              <img src="/slam-logo.svg" alt="SLAM" className="w-8 h-8" />
              <span className="font-black text-white tracking-widest text-xl font-display">SLAM</span>
            </button>
            <nav className="hidden md:flex items-center space-x-1 pl-8 border-l border-zinc-800">
              <NavButton active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} label="Discover" />
              <NavButton active={activeTab === 'saved'} onClick={() => setActiveTab('saved')} label="Saved" />
              <NavButton active={activeTab === 'applications'} onClick={() => setActiveTab('applications')} label="Applications" />
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex md:hidden items-center space-x-1 mr-2">
              <NavButton active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} label="Jobs" />
              <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" />
            </nav>
            <button onClick={() => setActiveTab('profile')} className="flex items-center gap-3 pl-4 border-l border-zinc-800 hover:opacity-80 transition-opacity">
              <div className="hidden lg:block text-right"><div className="text-xs font-bold text-white truncate max-w-[140px] font-sans tracking-wide">{userProfile.name.split(' ')[0].toUpperCase()}</div></div>
              <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 font-mono">{userProfile.name.split(' ').map(n => n[0]).join('')}</div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

function NavButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button onClick={onClick} className={`px-4 py-2 rounded-md text-xs font-bold tracking-wide transition-all ${active ? 'text-white bg-zinc-900' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}>{label}</button>;
}
