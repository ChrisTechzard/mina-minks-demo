import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import Alert from '../components/Alert';
import DemoBadge from '../components/DemoBadge';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/Spinner';
import Stepper from '../components/Stepper';
import PageIntro from '../components/ui/PageIntro';
import { useAvailability } from '../hooks/useAvailability';
import { useServices } from '../hooks/useServices';
import { api, ApiError } from '../services/api';
import {
  addDaysToBusinessDate,
  businessDateToday,
  formatDate,
  formatDateInputLabel,
  formatDuration,
  formatPrice,
  formatTime,
} from '../services/format';
import { validateBookingDetails } from '../services/validation';
import type { DetailsErrors, DetailsForm } from '../services/validation';
import type { BookingCreatePayload } from '../types';

const STEPS = ['Service', 'Date', 'Time', 'Details', 'Review'];
const FIELD_IDS: Record<keyof DetailsForm, string> = {
  full_name: 'full-name',
  email: 'email',
  phone: 'phone',
  notes: 'notes',
};

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedService = Number(searchParams.get('service') ?? '0');

  const { services, loading: servicesLoading, error: servicesError, reload } = useServices();
  const [step, setStep] = useState<number>(0);
  const [serviceId, setServiceId] = useState<number | null>(
    Number.isInteger(requestedService) && requestedService > 0 ? requestedService : null,
  );
  const [date, setDate] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [form, setForm] = useState<DetailsForm>({ full_name: '', email: '', phone: '', notes: '' });
  const [formErrors, setFormErrors] = useState<DetailsErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotTaken, setSlotTaken] = useState<boolean>(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const { availability, loading: slotsLoading, error: slotsError, refetch } = useAvailability(date, serviceId);
  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDaysToBusinessDate(businessDateToday(), index)),
    [],
  );
  const canContinue = !servicesLoading && !servicesError && services.length > 0;

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  const updateField = (key: keyof DetailsForm, value: string): void => {
    setForm((previous: DetailsForm) => ({ ...previous, [key]: value }));
    setFormErrors((previous: DetailsErrors) => ({ ...previous, [key]: undefined }));
  };

  const goToDetails = (): void => {
    const errors = validateBookingDetails(form);
    setFormErrors(errors);
    const firstInvalid = (['full_name', 'email', 'phone'] as const).find((key) => errors[key]);
    if (firstInvalid) {
      document.getElementById(FIELD_IDS[firstInvalid])?.focus();
      return;
    }
    setStep(4);
  };

  const submit = async (): Promise<void> => {
    if (!selectedService || !selectedStart) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: BookingCreatePayload = {
        service_id: selectedService.id,
        start_at: selectedStart,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        notes: form.notes.trim().length > 0 ? form.notes.trim() : null,
      };
      const confirmation = await api.createBooking(payload);
      try {
        sessionStorage.setItem(`mina_minks_booking_${confirmation.reference}`, JSON.stringify(confirmation));
      } catch {
        // The booking still succeeds if browser storage is unavailable.
      }
      navigate(`/booking/${confirmation.reference}`);
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : 'Booking could not be completed.';
      setSubmitError(message);
      if (caught instanceof ApiError && caught.status === 409) {
        setSlotTaken(true);
        setSelectedStart(null);
        setStep(2);
        void refetch();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const summaryRows = [
    { label: 'Service', value: selectedService?.name ?? 'Not chosen yet', done: Boolean(selectedService) },
    { label: 'Date', value: date ? formatDateInputLabel(date) : 'Not chosen yet', done: Boolean(date) },
    { label: 'Time', value: selectedStart ? `${formatTime(selectedStart)} (Accra)` : 'Not chosen yet', done: Boolean(selectedStart) },
    { label: 'Client', value: form.full_name.trim() || 'Not added yet', done: form.full_name.trim().length >= 2 },
  ];

  return (
    <div className="page-shell py-12 sm:py-16">
      <PageIntro
        eyebrow="Booking journey"
        title="Reserve your slot."
        description="Choose a sample service, pick a live time and review everything before confirming. Times are shown in Africa/Accra and no payment is collected."
        aside={<DemoBadge />}
      />

      <div className="mt-9 flex flex-wrap items-center justify-between gap-5 rounded-3xl border border-ink/10 bg-ivory/80 px-5 py-4 sm:px-7">
        <Stepper steps={STEPS} current={step} />
        <p className="text-[11px] font-semibold uppercase tracking-editorial text-ink-muted">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_0.75fr] lg:items-start">
        <section className="surface min-h-[460px] p-6 sm:p-9">
          {servicesLoading ? <Spinner label="Loading sample services…" className="py-16" /> : null}
          {servicesError ? (
            <div className="space-y-4">
              <Alert variant="error" title="Menu unavailable">{servicesError}</Alert>
              <button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>
            </div>
          ) : null}
          {!servicesLoading && !servicesError && services.length === 0 ? (
            <EmptyState
              title="No services available."
              description="The sample menu is empty, so there is nothing to book yet. Please try again shortly."
              action={<button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>}
            />
          ) : null}

          {canContinue && step === 0 ? (
            <div className="animate-fade-up">
              <h2 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight focus:outline-none sm:text-4xl">Choose a service</h2>
              <p className="mt-2 text-sm text-ink-muted">Prices below are sample values. Pick one to continue.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {services.map((service, index) => (
                  <button
                    key={service.id}
                    type="button"
                    aria-pressed={serviceId === service.id}
                    className={`rounded-3xl border p-5 text-left transition duration-200 ${
                      serviceId === service.id
                        ? 'border-ink bg-accent/30 shadow-lift'
                        : 'border-ink/12 bg-white/60 hover:border-ink/45 hover:bg-white'
                    }`}
                    onClick={() => {
                      setServiceId(service.id);
                      setDate(null);
                      setSelectedStart(null);
                      setSubmitError(null);
                      setSlotTaken(false);
                      setStep(1);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] text-accent-deep">0{index + 1}</p>
                        <p className="mt-2 font-semibold text-ink">{service.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-ink-faint">{service.category}</p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-semibold">{formatPrice(service.price_ghs)}</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-ink-muted">{service.description}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4">
                      <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                        <Clock3 size={13} aria-hidden="true" /> {formatDuration(service.duration_minutes)}
                      </span>
                      <span className="link-arrow no-underline">{serviceId === service.id ? 'Selected' : 'Select'} <ArrowRight size={13} aria-hidden="true" /></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {canContinue && step === 1 ? (
            <div className="animate-fade-up">
              <h2 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight focus:outline-none sm:text-4xl">Choose a date</h2>
              <p className="mt-2 text-sm text-ink-muted">The next 14 demo dates. Closed days simply show no times.</p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {dateOptions.map((option: string, index: number) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={date === option}
                    className={`min-h-[104px] rounded-3xl border px-4 py-4 text-left transition duration-200 ${
                      date === option
                        ? 'border-ink bg-ink text-cream'
                        : 'border-ink/12 bg-white/60 hover:border-ink/45 hover:bg-white'
                    }`}
                    onClick={() => {
                      setDate(option);
                      setSelectedStart(null);
                      setSubmitError(null);
                      setSlotTaken(false);
                      setStep(2);
                    }}
                  >
                    <span className={`block text-[10px] font-semibold uppercase tracking-editorial ${date === option ? 'text-accent' : 'text-ink-faint'}`}>
                      {index === 0 ? 'Today' : new Date(`${option}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })}
                    </span>
                    <span className="mt-3 block font-display text-3xl leading-none">{option.slice(8)}</span>
                    <span className={`mt-2 block text-xs ${date === option ? 'text-cream/65' : 'text-ink-muted'}`}>
                      {formatDateInputLabel(option)}
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" className="btn-quiet -ml-4 mt-8" onClick={() => setStep(0)}>
                <ArrowLeft size={15} aria-hidden="true" /> Change service
              </button>
            </div>
          ) : null}

          {canContinue && step === 2 ? (
            <div className="animate-fade-up">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight focus:outline-none sm:text-4xl">Pick a time</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    {date ? formatDateInputLabel(date) : 'Choose a date first'} · times in Africa/Accra
                  </p>
                </div>
                <button type="button" className="btn-outline min-h-[40px] px-4 py-2 text-xs" onClick={() => void refetch()} disabled={slotsLoading}>
                  <RefreshCw size={14} className={slotsLoading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
                </button>
              </div>

              {slotTaken ? (
                <Alert variant="error" title="That slot was just taken" className="mt-6">
                  Another client reserved it first. Availability has been refreshed — please pick another time.
                </Alert>
              ) : null}
              {submitError && !slotTaken ? (
                <Alert variant="error" title="Booking not submitted" className="mt-6">{submitError}</Alert>
              ) : null}
              {slotsLoading && !availability ? <Spinner label="Checking live availability…" className="py-12" /> : null}
              {slotsLoading && availability ? <p className="mt-5 text-xs text-ink-muted" role="status">Refreshing times…</p> : null}
              {slotsError ? (
                <div className="mt-6 space-y-4">
                  <Alert variant="error" title="Availability unavailable">{slotsError}</Alert>
                  <button type="button" className="btn-outline" onClick={() => void refetch()}>Try again</button>
                </div>
              ) : null}
              {!slotsError && availability && availability.slots.length === 0 ? (
                <div className="mt-8 rounded-4xl border border-dashed border-ink/15 bg-ivory/60 px-6 py-12 text-center">
                  <CalendarDays size={28} className="mx-auto text-ink-faint" aria-hidden="true" />
                  <p className="mt-4 font-display text-2xl">Nothing open here.</p>
                  <p className="mt-2 text-sm text-ink-muted">Try a different date or refresh availability.</p>
                  <button type="button" className="btn-outline mt-6" onClick={() => setStep(1)}>Change date</button>
                </div>
              ) : null}
              {!slotsError && availability && availability.slots.length > 0 ? (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {availability.slots.map((slot: string) => (
                    <button
                      key={slot}
                      type="button"
                      aria-pressed={selectedStart === slot}
                      className={`min-h-[56px] rounded-2xl border px-3 py-3.5 text-sm font-semibold transition duration-200 ${
                        selectedStart === slot
                          ? 'border-ink bg-ink text-cream'
                          : 'border-ink/12 bg-white/60 hover:border-ink/50 hover:bg-white'
                      }`}
                      onClick={() => {
                        setSelectedStart(slot);
                        setSubmitError(null);
                        setSlotTaken(false);
                      }}
                    >
                      {formatTime(slot)}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn-outline" onClick={() => setStep(1)}>
                  <ArrowLeft size={15} aria-hidden="true" /> Change date
                </button>
                <button type="button" className="btn-primary" disabled={!selectedStart} onClick={() => setStep(3)}>
                  Continue <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          {canContinue && step === 3 ? (
            <div className="animate-fade-up">
              <h2 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight focus:outline-none sm:text-4xl">Your details</h2>
              <p className="mt-2 text-sm text-ink-muted">Used only to identify your booking. No payment information is collected.</p>
              <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); goToDetails(); }} noValidate>
                <div>
                  <label className="field-label" htmlFor="full-name">Full name</label>
                  <input
                    id="full-name"
                    className="field"
                    value={form.full_name}
                    onChange={(event) => updateField('full_name', event.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    aria-invalid={Boolean(formErrors.full_name)}
                    aria-describedby={formErrors.full_name ? 'full-name-error' : undefined}
                  />
                  {formErrors.full_name ? <p id="full-name-error" className="mt-1.5 text-xs text-danger">{formErrors.full_name}</p> : null}
                </div>
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    className="field"
                    value={form.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    aria-invalid={Boolean(formErrors.email)}
                    aria-describedby={formErrors.email ? 'email-error' : undefined}
                  />
                  {formErrors.email ? <p id="email-error" className="mt-1.5 text-xs text-danger">{formErrors.email}</p> : null}
                </div>
                <div>
                  <label className="field-label" htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    className="field"
                    value={form.phone}
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="+233 ..."
                    autoComplete="tel"
                    aria-invalid={Boolean(formErrors.phone)}
                    aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                  />
                  {formErrors.phone ? <p id="phone-error" className="mt-1.5 text-xs text-danger">{formErrors.phone}</p> : null}
                </div>
                <div>
                  <label className="field-label" htmlFor="notes">Notes <span className="normal-case tracking-normal text-ink-faint">(optional)</span></label>
                  <textarea
                    id="notes"
                    className="field min-h-[52px] resize-y"
                    value={form.notes}
                    onChange={(event) => updateField('notes', event.target.value)}
                    placeholder="Anything Mina should know"
                    maxLength={1000}
                    rows={2}
                  />
                </div>
                <div className="sm:col-span-2 mt-2 flex flex-wrap gap-3">
                  <button type="button" className="btn-outline" onClick={() => setStep(2)}>
                    <ArrowLeft size={15} aria-hidden="true" /> Back to times
                  </button>
                  <button type="submit" className="btn-primary">
                    Review booking <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {canContinue && step === 4 ? (
            <div className="animate-fade-up">
              <h2 ref={headingRef} tabIndex={-1} className="text-3xl leading-tight focus:outline-none sm:text-4xl">Review and confirm</h2>
              <p className="mt-2 text-sm text-ink-muted">Check the details below before reserving. Your reference appears on the next screen.</p>
              {submitError ? <Alert variant="error" title="Not booked yet" className="mt-6">{submitError}</Alert> : null}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                <button type="button" className="hover:text-ink" onClick={() => setStep(0)}>Edit service</button>
                <button type="button" className="hover:text-ink" onClick={() => setStep(1)}>Edit date</button>
                <button type="button" className="hover:text-ink" onClick={() => setStep(2)}>Edit time</button>
                <button type="button" className="hover:text-ink" onClick={() => setStep(3)}>Edit details</button>
              </div>
              <dl className="mt-5 divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-white/60 px-6">
                {[
                  ['Service', selectedService?.name ?? '—'],
                  ['Appointment', selectedStart ? formatDate(selectedStart) : '—'],
                  ['Time', selectedStart ? `${formatTime(selectedStart)} (Africa/Accra)` : '—'],
                  ['Duration', selectedService ? formatDuration(selectedService.duration_minutes) : '—'],
                  ['Client', form.full_name],
                  ['Email', form.email],
                  ['Phone', form.phone],
                  ['Notes', form.notes.trim() || 'None'],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-3 py-4 text-sm">
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="max-w-[60%] break-words text-right font-semibold text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-3xl bg-ink px-6 py-5 text-cream">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-editorial text-cream/50">Sample price</p>
                  <p className="mt-1 text-xs text-cream/55">No payment is collected in this demo.</p>
                </div>
                <p className="font-display text-4xl text-accent">{selectedService ? formatPrice(selectedService.price_ghs) : '—'}</p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn-outline" onClick={() => setStep(3)} disabled={submitting}>
                  <ArrowLeft size={15} aria-hidden="true" /> Edit details
                </button>
                <button type="button" className="btn-accent" onClick={() => void submit()} disabled={submitting}>
                  {submitting ? 'Reserving…' : 'Confirm booking'} <Check size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
          <div className="surface p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">Your reservation</p>
              <span className="font-mono text-[11px] text-ink-faint">{String(step + 1).padStart(2, '0')}/05</span>
            </div>
            <dl className="mt-6 space-y-4">
              {summaryRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${row.done ? 'bg-accent-deep' : 'bg-ink/15'}`} aria-hidden="true" />
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">{row.label}</dt>
                    <dd className={`mt-1 text-sm ${row.done ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex items-end justify-between border-t border-ink/10 pt-5">
              <span className="text-xs uppercase tracking-wider text-ink-muted">Sample total</span>
              <span className="font-display text-3xl">{selectedService ? formatPrice(selectedService.price_ghs) : '—'}</span>
            </div>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-blush/35 p-5">
            <ShieldCheck size={20} className="text-ink-soft" aria-hidden="true" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-editorial text-ink-soft">Clear before you confirm</p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Availability is checked again when you confirm. If someone takes the slot first, you
              will be shown fresh times immediately.
            </p>
          </div>
          <Link to="/recommend" className="link-arrow">Need help choosing a style? <ArrowRight size={14} aria-hidden="true" /></Link>
        </aside>
      </div>
    </div>
  );
}
