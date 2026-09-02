import React, { useState } from 'react';
import { AuthService, AuthUser } from '../services/firebaseAuth';
import { Lock, Mail, User, AlertCircle, ArrowRight, X, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      let user: AuthUser;
      if (mode === 'signup') {
        user = await AuthService.signUp(email, password, name.trim());
      } else {
        user = await AuthService.signIn(email, password);
      }
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await AuthService.anonymousSignIn();
      onSuccess(user);
      onClose();
    } catch (err: any) {
      setError('Could not start guest session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-zinc-800 w-full max-w-md p-8 relative shadow-2xl rounded-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-500 hover:text-white p-1 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="text-xs font-mono font-bold tracking-widest text-zinc-400 uppercase">
              {mode === 'signup' ? 'Create Your Account' : 'Account Sign In'}
            </span>
          </div>
          <h2 className="text-3xl font-display font-black text-white">
            {mode === 'signup' ? 'JOIN SLAM' : 'WELCOME BACK'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'signup'
              ? 'Save your master career profile and sync tailored applications across devices.'
              : 'Sign in to access your saved jobs, master profile, and application pipeline.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-900 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signup' ? 'signin' : 'signup');
              setError(null);
            }}
            className="text-xs text-zinc-400 hover:text-white transition text-center"
          >
            {mode === 'signup' ? (
              <>Already have an account? <b className="text-yellow-400">Sign in</b></>
            ) : (
              <>New to SLAM? <b className="text-yellow-400">Create an account</b></>
            )}
          </button>

          <button
            type="button"
            onClick={handleGuest}
            disabled={loading}
            className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Continue in Guest / Demo Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
