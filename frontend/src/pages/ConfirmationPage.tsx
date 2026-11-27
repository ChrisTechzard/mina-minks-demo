import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Check, CheckCircle2, Clock3, Copy, Mail, Phone } from 'lucide-react';
import DemoBadge from '../components/DemoBadge';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { formatDate, formatPrice, formatTime } from '../services/format';
import type { BookingConfirmation } from '../types';

type CopyState = 'idle' | 'copied' | 'failed';

function readStoredConfirmation(reference: string | undefined): BookingConfirmation | null {
  if (!reference) return null;
  try {
    const raw = sessionStorage.getItem(`mina_minks_booking_${reference}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingConfirmation;
    return typeof parsed.reference === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export default function ConfirmationPage() {
  const { reference } = useParams<{ reference: string }>();
  const [confirmation] = useState<BookingConfirmation | null>(() => readStoredConfirmation(reference));
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (confirmation) headingRef.current?.focus({ preventScroll: true });
  }, [confirmation]);

  if (!confirmation) {
    return (
      <div className="page-shell py-16 sm:py-24">
        <EmptyState
          className="mx-auto max-w-2xl"
          icon={<Clock3 size={30} />}
          title="Find your booking details."
          description="Confirmation details are kept in this browser session. Use your booking reference and the email or phone you booked with to retrieve them again."
          action={<Link to="/lookup" className="btn-primary">Look up a booking <ArrowRight size={16} aria-hidden="true" /></Link>}
        />
        <div className="mt-6 flex justify-center"><DemoBadge /></div>
      </div>
    );
  }

  const copyReference = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(confirmation.reference);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className="page-shell py-14 sm:py-20">
      <div className="mx-auto max-w-3xl text-center animate-fade-up">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent">
          <CheckCircle2 size={30} aria-hidden="true" />
        </span>
        <div className="mt-6 flex justify-center"><DemoBadge /></div>
        <p className="sr-only" role="status">Booking confirmed. Reference {confirmation.reference}.</p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-5xl leading-tight focus:outline-none sm:text-6xl">You're on the calendar.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">
          Your demo appointment request is recorded with a pending status. Keep the reference below
          — it is how you can find the booking again in this demo.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-5xl border border-ink/10 bg-ivory shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-blush/40 px-6 py-6 sm:px-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-ink-muted">Booking reference</p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-wide sm:text-3xl">{confirmation.reference}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={confirmation.status} />
            <button type="button" className="btn-outline min-h-[40px] px-4 py-2 text-xs" onClick={() => void copyReference()}>
              {copyState === 'copied' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copyState === 'copied' ? 'Copied' : 'Copy'}
            </button>
            {copyState === 'failed' ? (
              <p className="w-full text-xs text-danger">Copy failed — select the reference manually.</p>
            ) : null}
            <span className="sr-only" role="status">
              {copyState === 'copied' ? 'Booking reference copied.' : copyState === 'failed' ? 'Copy failed. Select the reference manually.' : ''}
            </span>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-9">
          <div>
            <p className="eyebrow">Appointment</p>
            <h2 className="mt-3 text-3xl leading-tight">{confirmation.service_name}</h2>
            <p className="mt-2 text-sm text-ink-muted">
              {confirmation.service_category} · {formatPrice(confirmation.price_ghs)} sample price
            </p>
            <div className="mt-6 space-y-3 text-sm text-ink-soft">
              <p className="flex items-start gap-2.5">
                <Clock3 size={16} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
                <span>{formatDate(confirmation.start_at)} · {formatTime(confirmation.start_at)}–{formatTime(confirmation.end_at)} (Africa/Accra)</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
                {confirmation.client_email_masked}
              </p>
              <p className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-ink-faint" aria-hidden="true" />
                {confirmation.client_phone_masked}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-cream p-6">
            <p className="eyebrow mb-5">What happens next</p>
            <ol className="space-y-4 text-sm leading-relaxed text-ink-soft">
              <li className="flex gap-3"><span className="font-mono text-xs text-accent-deep">01</span> Save your booking reference.</li>
              <li className="flex gap-3"><span className="font-mono text-xs text-accent-deep">02</span> Read the clearly labelled sample aftercare guidance.</li>
              <li className="flex gap-3"><span className="font-mono text-xs text-accent-deep">03</span> Return to look up this booking whenever you need it.</li>
            </ol>
            <p className="mt-6 border-t border-ink/10 pt-5 text-xs leading-relaxed text-ink-muted">
              {confirmation.message} Payment is outside this demo.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-wrap gap-3">
        <Link to="/aftercare" className="btn-primary">Sample aftercare <ArrowRight size={16} aria-hidden="true" /></Link>
        <Link to="/lookup" className="btn-outline">Look up this booking</Link>
        <Link to="/book" className="btn-outline">Book again</Link>
      </div>
    </div>
  );
}
