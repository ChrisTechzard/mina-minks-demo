import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, SearchX } from 'lucide-react';
import Alert from '../components/Alert';
import DemoBadge from '../components/DemoBadge';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import PageIntro from '../components/ui/PageIntro';
import { ApiError, api } from '../services/api';
import { formatDateTime, formatDuration } from '../services/format';
import { validateLookup } from '../services/validation';
import type { LookupErrors } from '../services/validation';
import type { LookupResult } from '../types';

export default function LookupPage() {
  const [reference, setReference] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [errors, setErrors] = useState<LookupErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [resultAnnouncement, setResultAnnouncement] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resultAnnouncement) resultsRef.current?.focus({ preventScroll: true });
  }, [resultAnnouncement]);

  const submit = async (): Promise<void> => {
    const nextErrors = validateLookup({ reference, email, phone });
    setErrors(nextErrors);
    setError(Object.keys(nextErrors).length > 0 ? 'Check the highlighted fields and try again.' : null);
    setResultAnnouncement(null);
    const firstInvalid = (['reference', 'email', 'phone', 'contact'] as const).find((key) => nextErrors[key]);
    if (firstInvalid) {
      const target = firstInvalid === 'contact' ? 'lookup-email' : `lookup-${firstInvalid}`;
      document.getElementById(target)?.focus();
      return;
    }

    setLoading(true);
    try {
      const booking = await api.lookupBooking(reference.trim().toUpperCase(), email.trim().toLowerCase(), phone.trim());
      setResult(booking);
      setResultAnnouncement(`Booking ${booking.reference} found.`);
    } catch (caught: unknown) {
      const message = caught instanceof ApiError && caught.status === 0
        ? 'Cannot reach the booking server right now.'
        : caught instanceof Error
          ? caught.message
          : 'Booking lookup failed.';
      setResult(null);
      setError(message);
      setResultAnnouncement(`Lookup failed. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearErrors = (key: keyof LookupErrors): void => {
    setErrors((previous: LookupErrors) => ({ ...previous, [key]: undefined }));
    setError(null);
  };

  return (
    <div className="page-shell py-14 sm:py-20">
      <PageIntro
        eyebrow="Returning clients"
        title="Find your booking."
        description="Enter your booking reference plus the email or phone used at booking. Public results show masked contact details only."
        actions={<Link to="/book" className="btn-primary">Book again <ArrowRight size={16} aria-hidden="true" /></Link>}
        aside={<DemoBadge />}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <form
          className="surface p-6 sm:p-8"
          onSubmit={(event) => { event.preventDefault(); void submit(); }}
          noValidate
        >
          <p className="eyebrow mb-6">Booking lookup</p>
          <div>
            <label className="field-label" htmlFor="lookup-reference">Booking reference</label>
            <input
              id="lookup-reference"
              className="field font-mono uppercase"
              value={reference}
              onChange={(event) => { setReference(event.target.value); clearErrors('reference'); }}
              placeholder="MM-20261127-ABC123"
              autoComplete="off"
              aria-invalid={Boolean(errors.reference)}
              aria-describedby={errors.reference ? 'lookup-reference-error' : 'lookup-reference-hint'}
            />
            {errors.reference ? (
              <p id="lookup-reference-error" className="mt-1.5 text-xs text-danger">{errors.reference}</p>
            ) : (
              <p id="lookup-reference-hint" className="mt-2 text-xs text-ink-faint">You received this on the confirmation screen.</p>
            )}
          </div>

          <div className="mt-6">
            <label className="field-label" htmlFor="lookup-email">Email used at booking</label>
            <input
              id="lookup-email"
              type="email"
              className="field"
              value={email}
              onChange={(event) => { setEmail(event.target.value); clearErrors('email'); clearErrors('contact'); }}
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email || errors.contact)}
              aria-describedby={
                [errors.email ? 'lookup-email-error' : null, errors.contact ? 'lookup-contact-error' : null]
                  .filter((id: string | null): id is string => id !== null)
                  .join(' ') || undefined
              }
            />
            {errors.email ? <p id="lookup-email-error" className="mt-1.5 text-xs text-danger">{errors.email}</p> : null}
          </div>
          <div className="mt-5">
            <label className="field-label" htmlFor="lookup-phone">Or phone used at booking</label>
            <input
              id="lookup-phone"
              type="tel"
              inputMode="tel"
              className="field"
              value={phone}
              onChange={(event) => { setPhone(event.target.value); clearErrors('phone'); clearErrors('contact'); }}
              placeholder="+233 ..."
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'lookup-phone-error' : undefined}
            />
            {errors.phone ? <p id="lookup-phone-error" className="mt-1.5 text-xs text-danger">{errors.phone}</p> : null}
            {errors.contact ? <p id="lookup-contact-error" className="mt-1.5 text-xs text-danger">{errors.contact}</p> : null}
          </div>
          <button type="submit" className="btn-primary mt-7 w-full" disabled={loading}>
            <Search size={16} aria-hidden="true" /> {loading ? 'Searching…' : 'Find booking'}
          </button>
          {error ? <Alert variant="error" className="mt-5">{error}</Alert> : null}
        </form>

        <div ref={resultsRef} tabIndex={-1} className="focus:outline-none">
          <p className="sr-only" role="status">{resultAnnouncement ?? ''}</p>
          {result ? (
            <div className="overflow-hidden rounded-5xl border border-ink/10 bg-ivory shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-blush/40 px-6 py-5 sm:px-8">
                <div>
                  <p className="eyebrow">Booking found</p>
                  <p className="mt-1 font-mono text-lg font-semibold">{result.reference}</p>
                </div>
                <StatusBadge status={result.status} />
              </div>
              <div className="p-6 sm:p-8">
                <h2 className="text-3xl leading-tight">{result.service_name}</h2>
                <p className="mt-2 text-sm text-ink-muted">{formatDateTime(result.start_at)} · {formatDuration(result.duration_minutes)}</p>
                <dl className="mt-6 divide-y divide-ink/10 border-t border-ink/10 text-sm">
                  <div className="flex justify-between gap-4 py-3"><dt className="text-ink-muted">Client</dt><dd className="font-semibold">{result.client_name}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-ink-muted">Email</dt><dd>{result.client_email_masked}</dd></div>
                  <div className="flex justify-between gap-4 py-3"><dt className="text-ink-muted">Phone</dt><dd>{result.client_phone_masked}</dd></div>
                </dl>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/book" className="btn-primary">Rebook <ArrowRight size={16} aria-hidden="true" /></Link>
                  <Link to="/aftercare" className="btn-outline">Sample aftercare</Link>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              className="min-h-[360px]"
              icon={<SearchX size={30} />}
              title="Your booking will appear here."
              description="Use the reference from a confirmation screen, then enter the email or phone used when booking."
            />
          )}
        </div>
      </div>
    </div>
  );
}
