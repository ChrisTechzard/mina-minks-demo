import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import Alert from '../components/Alert';
import DemoBadge from '../components/DemoBadge';
import { ApiError, api } from '../services/api';
import { formatDateTime, formatDuration } from '../services/format';
import type { LookupResult } from '../types';

const REFERENCE_PATTERN = /^MM-[0-9]{8}-[A-Z0-9]{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LookupPage() {
  const [reference, setReference] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LookupResult | null>(null);

  const submit = async (): Promise<void> => {
    setError(null);
    const normalisedReference = reference.trim().toUpperCase();
    if (!REFERENCE_PATTERN.test(normalisedReference)) {
      setError('Enter a reference in the format MM-YYYYMMDD-XXXXXX.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    if (!cleanEmail && !cleanPhone) {
      setError('Enter the email or phone number used when booking.');
      return;
    }
    if (cleanEmail && !EMAIL_PATTERN.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      setResult(await api.lookupBooking(normalisedReference, cleanEmail, cleanPhone));
    } catch (caught: unknown) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : 'Booking lookup failed.');
      if (caught instanceof ApiError && caught.status === 0) setError('Cannot reach the booking server right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="eyebrow">Returning clients</p>
            <DemoBadge />
          </div>
          <h1 className="text-5xl leading-tight sm:text-6xl">Find your booking.</h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/60">
            Enter your booking reference plus the email or phone used at booking. We only show
            masked contact details in the result.
          </p>
        </div>
        <Link to="/book" className="btn-primary">Book again <ArrowRight size={16} /></Link>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form
          className="card p-6 sm:p-8"
          onSubmit={(event) => { event.preventDefault(); void submit(); }}
        >
          <label className="field-label" htmlFor="lookup-reference">Booking reference</label>
          <input
            id="lookup-reference"
            className="field font-mono uppercase"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="MM-20261208-ABC123"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-ink/45">You received this on the confirmation screen.</p>

          <div className="mt-6">
            <label className="field-label" htmlFor="lookup-email">Email used at booking</label>
            <input
              id="lookup-email"
              type="email"
              className="field"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div className="mt-5">
            <label className="field-label" htmlFor="lookup-phone">Or phone used at booking</label>
            <input
              id="lookup-phone"
              type="tel"
              className="field"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+233 ..."
            />
          </div>
          <button type="submit" className="btn-primary mt-7 w-full" disabled={loading}>
            <Search size={16} /> {loading ? 'Searching…' : 'Find booking'}
          </button>
          {error ? <Alert variant="error" className="mt-5">{error}</Alert> : null}
        </form>

        <div>
          {result ? (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-accent/20 px-6 py-5">
                <div>
                  <p className="eyebrow">Booking found</p>
                  <p className="mt-1 font-mono text-lg font-bold">{result.reference}</p>
                </div>
                <span className="rounded-full border border-ink/20 bg-cream px-4 py-2 text-xs font-semibold uppercase tracking-wider">{result.status}</span>
              </div>
              <div className="p-6 sm:p-8">
                <h2 className="text-3xl">{result.service_name}</h2>
                <p className="mt-2 text-sm text-ink/60">{formatDateTime(result.start_at)} · {formatDuration(result.duration_minutes)}</p>
                <dl className="mt-6 divide-y divide-ink/10 border-t border-ink/10 text-sm">
                  <div className="flex justify-between gap-4 py-3"><dt className="text-ink/50">Client</dt><dd className="font-semibold">{result.client_name}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-ink/50">Email</dt><dd>{result.client_email_masked}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-ink/50">Phone</dt><dd>{result.client_phone_masked}</dd></div>
                </dl>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/book" className="btn-primary">Rebook <ArrowRight size={16} /></Link>
                  <Link to="/aftercare" className="btn-outline">Sample aftercare</Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-ink/20 p-8 text-center">
              <Search size={30} className="text-ink/30" />
              <p className="mt-4 font-display text-2xl">Your booking will appear here.</p>
              <p className="mt-2 text-sm text-ink/55">Use the demo reference from a confirmation screen to try it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
