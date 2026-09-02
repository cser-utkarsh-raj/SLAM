import React, { useState, useEffect } from 'react';
import { AuthService, AuthUser } from '../services/firebaseAuth';
import { Lock, Mail, User, AlertCircle, ArrowRight, X, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await AuthService.signInWithGoogle();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Email and password are required.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (mode === 'signup' && !name.trim()) return setError('Full name is required when creating an account.');

    setLoading(true);
    try {
      const user = mode === 'signup'
        ? await AuthService.signUp(email.trim(), password, name.trim())
        : await AuthService.signIn(email.trim(), password);
      onSuccess(user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-md p-6 sm:p-8 relative shadow-2xl rounded-2xl">
        <button onClick={onClose} className="absolute top-5 right-5 text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition" aria-label="Close modal">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="text-xs font-mono font-bold tracking-widest text-yellow-400 uppercase">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white mt-1">{mode === 'signup' ? 'JOIN SLAM' : 'SIGN IN TO SLAM'}</h2>
          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">Your career profile, verified skills, and application pipeline are saved to your account.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading || loading} className="w-full py-3 px-4 bg-white hover:bg-zinc-100 disabled:opacity-60 text-zinc-900 font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-3 border border-zinc-200 shadow-sm cursor-pointer">
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-800" /> : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          )}
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="relative my-5"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800" /></div><div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest text-zinc-500"><span className="bg-[#0a0a0a] px-3">or continue with email</span></div></div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Full name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition" placeholder="Your full name" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Email address</label>
            <div className="relative"><Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" /><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition" placeholder="name@example.com" /></div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
            <div className="relative"><Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" /><input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400 transition" placeholder="At least 6 characters" /></div>
          </div>

          <button type="submit" disabled={loading || googleLoading} className="w-full mt-2 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>AUTHENTICATING...</span></> : <><span>{mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN WITH EMAIL'}</span><ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-zinc-900 text-center">
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }} className="text-xs text-zinc-400 hover:text-white transition cursor-pointer">
            {mode === 'signup' ? <>Already have an account? <span className="text-yellow-400 font-bold ml-1">Sign in</span></> : <>Don't have an account? <span className="text-yellow-400 font-bold ml-1">Create one</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};
