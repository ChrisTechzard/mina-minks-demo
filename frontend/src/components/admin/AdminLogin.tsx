import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import Alert from '../Alert';
import BrandMark from '../BrandMark';
import DemoBadge from '../DemoBadge';

interface AdminLoginProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  sessionExpired?: boolean;
  onAcknowledgeExpiry?: () => void;
}

export default function AdminLogin({ onSignIn, sessionExpired = false, onAcknowledgeExpiry }: AdminLoginProps) {
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
    <div className="min-h-screen bg-cream">
      <div className="mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[0.85fr_1.15fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 text-cream lg:flex">
          <div aria-hidden="true" className="absolute -right-24 top-24 h-80 w-80 rounded-full border border-cream/10" />
          <div aria-hidden="true" className="absolute -right-10 top-40 h-80 w-80 rounded-full border border-cream/5" />
          <div className="relative flex items-center gap-3">
            <BrandMark light />
            <span className="font-display text-2xl">Mina Minks</span>
          </div>
          <div className="relative max-w-lg">
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-accent">Staff workspace</p>
            <h1 className="mt-6 text-6xl leading-[0.98]">The calendar,<br />beautifully ordered.</h1>
            <p className="mt-6 text-sm leading-relaxed text-cream/60">
              Review appointments, adjust demo hours and manage the sample service menu from one
              considered workspace.
            </p>
          </div>
          <div className="relative border-t border-cream/15 pt-6 text-[11px] uppercase tracking-editorial text-cream/45">
            Prototype session · Sample data only
          </div>
        </div>

        <div className="flex items-center justify-center px-5 py-14 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <div className="flex items-center gap-3">
                <BrandMark compact />
                <span className="font-display text-xl">Mina Minks</span>
              </div>
              <DemoBadge />
            </div>

            <div className="surface p-7 sm:p-9">
              {sessionExpired ? (
                <div className="mb-6" role="alert">
                  <Alert variant="info" title="Session expired">
                    Your admin session ended. Sign in again to return to the workspace.
                  </Alert>
                  <button type="button" className="btn-quiet -ml-4 mt-3" onClick={onAcknowledgeExpiry}>
                    Sign in again
                  </button>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-accent">
                  <LockKeyhole size={19} aria-hidden="true" />
                </span>
                <DemoBadge />
              </div>
              <h2 className="mt-6 text-4xl leading-tight">Staff sign-in.</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Demo credentials come from the backend environment, never from frontend code.
              </p>

              <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-5">
                <div>
                  <label className="field-label" htmlFor="admin-email">Admin email</label>
                  <input
                    id="admin-email"
                    type="email"
                    className="field"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="mina@example.com"
                    autoComplete="username"
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    className="field"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
                {error ? <Alert variant="error">{error}</Alert> : null}
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Enter workspace'}
                </button>
              </form>
              <p className="mt-6 text-xs leading-relaxed text-ink-faint">
                Prototype limitation: the bearer token is kept in session storage. Use HTTPS and a
                secure cookie-based session before any production deployment.
              </p>
            </div>

            <Link to="/" className="btn-quiet mt-6 -ml-4">
              <ArrowLeft size={15} aria-hidden="true" /> Back to public site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
