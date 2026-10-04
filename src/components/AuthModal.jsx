import { useState } from 'react';
import { Loader2, Lock, Mail, X } from 'lucide-react';
import { login, register } from '../services/authApi';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // login | register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data =
        mode === 'login'
          ? await login(email.trim(), password)
          : await register(email.trim(), password);
      onSuccess?.(data);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 rounded-lg text-steel hover:text-pearl"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-pearl mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className="text-sm text-steel mb-5">
          {mode === 'login'
            ? 'Sign in to sync your portfolio to the cloud.'
            : 'Save holdings, cash, and watchlist across devices.'}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-steel">Email</span>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full pl-9"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wide text-steel">Password</span>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-steel" />
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full pl-9"
                placeholder="At least 8 characters"
              />
            </div>
          </label>

          {error && <p className="text-sm text-ruby-bright">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Please wait…
              </>
            ) : mode === 'login' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="text-sm text-steel mt-4 text-center">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button
                type="button"
                className="text-emerald-bright hover:underline"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="text-emerald-bright hover:underline"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
