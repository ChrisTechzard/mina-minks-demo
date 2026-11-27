import { useState } from 'react';
import type { FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import Alert from '../Alert';
import DemoBadge from '../DemoBadge';

interface AdminLoginProps {
  onSignIn: (email: string, password: string) => Promise<void>;
}

export default function AdminLogin({ onSignIn }: AdminLoginProps) {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSignIn(email, password);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5 py-14 text-cream">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full border border-cream/50 text-xs font-bold tracking-widest">MM</span>
          <div>
            <p className="font-display text-2xl">Mina Minks</p>
            <p className="text-[11px] uppercase tracking-editorial text-cream/50">Staff access</p>
          </div>
        </div>

        <form onSubmit={(event) => void submit(event)} className="rounded-3xl border border-cream/15 bg-white/5 p-7 sm:p-9">
          <LockKeyhole size={22} className="text-accent" />
          <h1 className="mt-5 text-4xl">Sign in as Mina.</h1>
          <p className="mt-2 text-sm text-cream/55">Demo credentials come from the backend environment, never from frontend code.</p>
          <div className="mt-6 flex justify-start"><DemoBadge /></div>

          <div className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cream/55" htmlFor="admin-email">Admin email</label>
              <input
                id="admin-email"
                type="email"
                className="w-full rounded-2xl border border-cream/20 bg-ink/60 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-accent focus:outline-none"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="mina@example.com"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cream/55" htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                className="w-full rounded-2xl border border-cream/20 bg-ink/60 px-4 py-3 text-sm text-cream placeholder:text-cream/30 focus:border-accent focus:outline-none"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error ? <Alert variant="error" className="mt-6">{error}</Alert> : null}

          <button type="submit" className="btn-accent mt-7 w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Enter dashboard'}
          </button>
          <p className="mt-5 text-xs leading-relaxed text-cream/40">
            Prototype limitation: the bearer token is kept in session storage. Use HTTPS and a
            secure cookie-based session before any production deployment.
          </p>
        </form>
      </div>
    </div>
  );
}
