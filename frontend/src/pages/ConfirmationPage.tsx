import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Mail, Phone } from 'lucide-react';
import DemoBadge from '../components/DemoBadge';
import { formatDate, formatPrice, formatTime } from '../services/format';
import type { BookingConfirmation } from '../types';

function readStoredConfirmation(reference: string | undefined): BookingConfirmation | null {
  if (!reference) return null;
  const raw = sessionStorage.getItem(`mina_minks_booking_${reference}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as BookingConfirmation;
    return typeof parsed.reference === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export default function ConfirmationPage() {
  const { reference } = useParams<{ reference: string }>();
  const [confirmation] = useState<BookingConfirmation | null>(() => readStoredConfirmation(reference));

  if (!confirmation) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <DemoBadge />
        <h1 className="mt-6 text-5xl">Find your booking details.</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/60">
          Confirmation details are kept in this browser session. Use your booking reference and
          the email or phone you booked with to retrieve them again.
        </p>
        <Link to="/lookup" className="btn-primary mt-8">
          Look up a booking <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14 lg:py-20">
      <div className="text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent">
          <CheckCircle2 size={30} />
        </span>
        <div className="mt-6 flex justify-center"><DemoBadge /></div>
        <h1 className="mt-4 text-5xl leading-tight sm:text-6xl">You're on the calendar.</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink/60">
          Your demo appointment is saved. Keep the reference below — it is how you and Mina can
          find the booking later.
        </p>
      </div>

      <div className="card mt-10 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink/10 bg-accent/20 px-6 py-5 sm:px-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-ink/55">Booking reference</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-wider sm:text-2xl">{confirmation.reference}</p>
          </div>
          <span className="rounded-full border border-ink/20 bg-cream px-4 py-2 text-xs font-semibold uppercase tracking-wider">
            {confirmation.status}
          </span>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-9">
          <div>
            <p className="eyebrow">Appointment</p>
            <h2 className="mt-3 text-3xl">{confirmation.service_name}</h2>
            <p className="mt-2 text-sm text-ink/60">{confirmation.service_category} · {formatPrice(confirmation.price_ghs)} sample price</p>
            <div className="mt-6 space-y-3 text-sm">
              <p className="flex items-center gap-2"><Clock3 size={16} /> {formatDate(confirmation.start_at)} · {formatTime(confirmation.start_at)}–{formatTime(confirmation.end_at)} (Africa/Accra)</p>
              <p className="flex items-center gap-2"><Mail size={16} /> {confirmation.client_email_masked}</p>
              <p className="flex items-center gap-2"><Phone size={16} /> {confirmation.client_phone_masked}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-ink/10 bg-white/60 p-6">
            <p className="eyebrow mb-4">What happens next</p>
            <ol className="space-y-4 text-sm leading-relaxed text-ink/65">
              <li>1. Save your booking reference.</li>
              <li>2. Read the clearly labelled sample aftercare guidance.</li>
              <li>3. Return any time to look up this booking and rebook.</li>
            </ol>
            <p className="mt-5 border-t border-ink/10 pt-5 text-xs text-ink/45">
              {confirmation.message} Payment is outside this demo.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/aftercare" className="btn-primary">Sample aftercare <ArrowRight size={16} /></Link>
        <Link to="/lookup" className="btn-outline">Look up this booking</Link>
        <Link to="/book" className="btn-outline">Book again</Link>
      </div>
    </div>
  );
}
