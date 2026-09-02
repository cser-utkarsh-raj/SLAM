import React, { useState } from 'react';
import { UserProfile } from '../types';
import { AuthUser } from '../services/firebaseAuth';
import { Crown, User, LogOut, LogIn, Bookmark, Briefcase, Compass, ChevronDown } from 'lucide-react';

export type ActiveTab = 'discover' | 'saved' | 'applications' | 'profile' | 'onboarding';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  userProfile: UserProfile;
  authUser: AuthUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenSlamPlus: () => void;
  isSubscribed: boolean;
}

const tabs: { id: Exclude<ActiveTab, 'onboarding'>; label: string; icon: React.ReactNode }[] = [
  { id: 'discover', label: 'Discover', icon: <Compass className="w-3.5 h-3.5" /> },
  { id: 'saved', label: 'Saved', icon: <Bookmark className="w-3.5 h-3.5" /> },
  { id: 'applications', label: 'Applications', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'profile', label: 'Profile & CV', icon: <User className="w-3.5 h-3.5" /> },
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, userProfile, authUser, onOpenAuth, onSignOut, onOpenSlamPlus, isSubscribed }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const displayName = userProfile.name || authUser?.displayName || (authUser?.email ? authUser.email.split('@')[0] : 'Profile');
  const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/88 backdrop-blur-xl border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <button type="button" className="flex items-center gap-2.5 cursor-pointer focus:outline-none shrink-0" onClick={() => setActiveTab('discover')} aria-label="SLAM Home">
              <img src="/slam-logo.svg" alt="SLAM" className="w-8 h-8 rounded-lg" />
              <span className="font-black text-white tracking-widest text-lg font-display">SLAM</span>
            </button>
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-zinc-800">
              {tabs.map(tab => <React.Fragment key={tab.id}><NavButton active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} label={tab.label} icon={tab.icon} /></React.Fragment>)}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button onClick={onOpenSlamPlus} className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${isSubscribed ? 'bg-yellow-400/10 border-yellow-400/50 text-yellow-400' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'}`}>
              <Crown className="w-3.5 h-3.5 text-yellow-400" /><span>{isSubscribed ? 'SLAM+ Active' : 'SLAM+ ₹49'}</span>
            </button>

            {authUser ? <div className="relative">
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-zinc-800 cursor-pointer focus:outline-none">
                <div className="hidden sm:block text-right"><div className="text-xs font-bold text-white truncate max-w-[120px]">{displayName}</div><div className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px]">{authUser.email}</div></div>
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-yellow-400 font-mono">{initials}</div>
                <ChevronDown className="w-3 h-3 text-zinc-500 hidden sm:block" />
              </button>
              {dropdownOpen && <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1.5 z-50">
                <button onClick={() => { setActiveTab('profile'); setDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"><User className="w-3.5 h-3.5 text-zinc-400" /><span>Career Profile</span></button>
                <button onClick={() => { onOpenSlamPlus(); setDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-900 flex items-center gap-2"><Crown className="w-3.5 h-3.5 text-yellow-400" /><span>Subscription</span></button>
                <div className="border-t border-zinc-900 my-1" />
                <button onClick={() => { onSignOut(); setDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-xs text-red-400 hover:bg-zinc-900 flex items-center gap-2"><LogOut className="w-3.5 h-3.5" /><span>Sign Out</span></button>
              </div>}
            </div> : <button onClick={onOpenAuth} className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow"><LogIn className="w-3.5 h-3.5" /><span>Sign In</span></button>}
          </div>
        </div>

        <nav className="md:hidden -mx-4 px-4 pb-2.5 flex gap-1.5 overflow-x-auto no-scrollbar border-t border-zinc-900/80 pt-2">
          {tabs.map(tab => <React.Fragment key={tab.id}><NavButton active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} label={tab.label} icon={tab.icon} compact /></React.Fragment>)}
        </nav>
      </div>
    </header>
  );
};

function NavButton({ active, onClick, label, icon, compact = false }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode; compact?: boolean }) {
  return <button onClick={onClick} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${compact ? 'border' : ''} ${active ? 'text-white bg-zinc-900 border-zinc-800 shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50 border-transparent'}`}>{icon}<span>{label}</span></button>;
}
