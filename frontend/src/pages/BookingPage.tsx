import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, RefreshCw } from 'lucide-react';
import Alert from '../components/Alert';
import DemoBadge from '../components/DemoBadge';
import Spinner from '../components/Spinner';
import Stepper from '../components/Stepper';
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
import type { BookingCreatePayload } from '../types';

const STEPS = ['Service', 'Date', 'Time', 'Details', 'Review'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9()\s-]{7,20}$/;
const MIN_PHONE_DIGITS = 7;

interface DetailsForm {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

type FormErrors = Partial<Record<keyof DetailsForm, string>>;

function validateDetails(form: DetailsForm): FormErrors {
  const errors: FormErrors = {};
  if (form.full_name.trim().length < 2) errors.full_name = 'Please enter your full name.';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';
  const phone = form.phone.trim();
  const phoneDigits = phone.replace(/\D/g, '').length;
  if (!PHONE_PATTERN.test(phone) || phoneDigits < MIN_PHONE_DIGITS) {
    errors.phone = 'Enter a valid phone number with at least 7 digits.';
  }
  return errors;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedService = Number(searchParams.get('service') ?? '0');

  const { services, loading: servicesLoading, error: servicesError } = useServices();
  const [step, setStep] = useState<number>(0);
  const [serviceId, setServiceId] = useState<number | null>(
    Number.isInteger(requestedService) && requestedService > 0 ? requestedService : null,
  );
  const [date, setDate] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [form, setForm] = useState<DetailsForm>({ full_name: '', email: '', phone: '', notes: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotTaken, setSlotTaken] = useState<boolean>(false);

  const { availability, loading: slotsLoading, error: slotsError, refetch } = useAvailability(date, serviceId);
  const selectedService = services.find((service) => service.id === serviceId) ?? null;
  const dateOptions = useMemo(
    () => Array.from({ length: 14 }, (_, index) => addDaysToBusinessDate(businessDateToday(), index)),
    [],
  );

  const updateField = (key: keyof DetailsForm, value: string): void => {
    setForm((previous: DetailsForm) => ({ ...previous, [key]: value }));
    setFormErrors((previous: FormErrors) => ({ ...previous, [key]: undefined }));
  };

  const goToDetails = (): void => {
    const errors = validateDetails(form);
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) setStep(4);
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
      sessionStorage.setItem(`mina_minks_booking_${confirmation.reference}`, JSON.stringify(confirmation));
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

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="eyebrow">Booking flow</p>
            <DemoBadge />
          </div>
          <h1 className="text-5xl leading-tight sm:text-6xl">Reserve your slot.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink/60">
            All times are shown in Africa/Accra. No payment is collected and every service,
            price and hour is demonstration data.
          </p>
        </div>
        <Stepper steps={STEPS} current={step} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_0.75fr]">
        <section className="card min-h-[420px] p-6 sm:p-9">
          {servicesLoading ? <Spinner label="Loading sample services…" className="py-16" /> : null}
          {servicesError ? <Alert variant="error" title="Menu unavailable">{servicesError}</Alert> : null}

          {!servicesLoading && !servicesError && step === 0 ? (
            <div>
              <h2 className="text-3xl">Step 1 — choose a service</h2>
              <p className="mt-2 text-sm text-ink/60">Prices below are sample values for demonstration.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`rounded-2xl border p-5 text-left transition ${
                      serviceId === service.id ? 'border-ink bg-accent/20' : 'border-ink/15 bg-white/50 hover:border-ink/40'
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
                        <p className="font-semibold">{service.name}</p>
                        <p className="mt-1 text-xs text-ink/55">{service.category}</p>
                      </div>
                      <span className="whitespace-nowrap text-sm font-semibold">{formatPrice(service.price_ghs)}</span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-ink/60">{service.description}</p>
                    <p className="mt-4 flex items-center gap-1.5 text-xs text-ink/55">
                      <Clock3 size={13} /> {formatDuration(service.duration_minutes)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {!servicesLoading && !servicesError && step === 1 ? (
            <div>
              <h2 className="text-3xl">Step 2 — choose a date</h2>
              <p className="mt-2 text-sm text-ink/60">The next 14 demo dates. Closed days simply show no times.</p>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {dateOptions.map((option: string) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-2xl border px-4 py-5 text-left transition ${
                      date === option ? 'border-ink bg-accent/25' : 'border-ink/15 bg-white/50 hover:border-ink/40'
                    }`}
                    onClick={() => {
                      setDate(option);
                      setSelectedStart(null);
                      setSubmitError(null);
                      setSlotTaken(false);
                      setStep(2);
                    }}
                  >
                    <span className="block text-xs font-semibold uppercase tracking-wider text-ink/50">
                      {new Date(`${option}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })}
                    </span>
                    <span className="mt-2 block font-display text-2xl">{option.slice(8)}</span>
                    <span className="block text-xs text-ink/50">{formatDateInputLabel(option)}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/55 hover:text-ink" onClick={() => setStep(0)}>
                <ArrowLeft size={15} /> Back to services
              </button>
            </div>
          ) : null}

          {!servicesLoading && !servicesError && step === 2 ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl">Step 3 — pick a time</h2>
                  <p className="mt-2 text-sm text-ink/60">
                    {date ? formatDateInputLabel(date) : 'Choose a date first'} · times in Africa/Accra
                  </p>
                </div>
                <button type="button" className="btn-outline px-4 py-2 text-xs" onClick={() => void refetch()} disabled={slotsLoading}>
                  <RefreshCw size={14} className={slotsLoading ? 'animate-spin' : ''} /> Refresh
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
              {slotsLoading ? <Spinner label="Checking live availability…" className="py-12" /> : null}
              {slotsError ? (
                <div className="mt-6 space-y-4">
                  <Alert variant="error" title="Availability unavailable">{slotsError}</Alert>
                  <button type="button" className="btn-outline" onClick={() => void refetch()}>Try again</button>
                </div>
              ) : null}
              {!slotsLoading && !slotsError && availability && availability.slots.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-ink/20 p-10 text-center">
                  <CalendarDays size={26} className="mx-auto text-ink/35" />
                  <p className="mt-3 font-display text-2xl">Nothing open here.</p>
                  <p className="mt-2 text-sm text-ink/55">Try a different date or refresh availability.</p>
                </div>
              ) : null}
              {!slotsLoading && !slotsError && availability && availability.slots.length > 0 ? (
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {availability.slots.map((slot: string) => (
                    <button
                      key={slot}
                      type="button"
                      className={`rounded-xl border px-3 py-4 text-sm font-semibold transition ${
                        selectedStart === slot ? 'border-ink bg-ink text-cream' : 'border-ink/15 bg-white/50 hover:border-ink'
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
                  <ArrowLeft size={15} /> Change date
                </button>
                <button type="button" className="btn-primary" disabled={!selectedStart} onClick={() => setStep(3)}>
                  Continue <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ) : null}

          {!servicesLoading && !servicesError && step === 3 ? (
            <div>
              <h2 className="text-3xl">Step 4 — your details</h2>
              <p className="mt-2 text-sm text-ink/60">Used only to identify your booking. No payment information is collected.</p>
              <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); goToDetails(); }}>
                <div>
                  <label className="field-label" htmlFor="full-name">Full name</label>
                  <input id="full-name" className="field" value={form.full_name} onChange={(event) => updateField('full_name', event.target.value)} placeholder="Your name" autoComplete="name" />
                  {formErrors.full_name ? <p className="mt-1 text-xs text-red-800">{formErrors.full_name}</p> : null}
                </div>
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="field" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="you@example.com" autoComplete="email" />
                  {formErrors.email ? <p className="mt-1 text-xs text-red-800">{formErrors.email}</p> : null}
                </div>
                <div>
                  <label className="field-label" htmlFor="phone">Phone</label>
                  <input id="phone" type="tel" className="field" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+233 ..." autoComplete="tel" />
                  {formErrors.phone ? <p className="mt-1 text-xs text-red-800">{formErrors.phone}</p> : null}
                </div>
                <div>
                  <label className="field-label" htmlFor="notes">Notes (optional)</label>
                  <input id="notes" className="field" value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Anything Mina should know" maxLength={1000} />
                </div>
                <div className="sm:col-span-2 mt-2 flex flex-wrap gap-3">
                  <button type="button" className="btn-outline" onClick={() => setStep(2)}>
                    <ArrowLeft size={15} /> Back to times
                  </button>
                  <button type="submit" className="btn-primary">
                    Review booking <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {!servicesLoading && !servicesError && step === 4 ? (
            <div>
              <h2 className="text-3xl">Step 5 — review and confirm</h2>
              <p className="mt-2 text-sm text-ink/60">Check the details below before reserving. You will receive a booking reference.</p>
              {submitError ? <Alert variant="error" title="Not booked yet" className="mt-6">{submitError}</Alert> : null}
              <dl className="mt-7 divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-white/60 px-6">
                {[
                  ['Service', selectedService?.name ?? '—'],
                  ['Appointment', selectedStart ? formatDate(selectedStart) : '—'],
                  ['Time', selectedStart ? `${formatTime(selectedStart)} (Africa/Accra)` : '—'],
                  ['Duration', selectedService ? formatDuration(selectedService.duration_minutes) : '—'],
                  ['Client', form.full_name],
                  ['Email', form.email],
                  ['Phone', form.phone],
                  ['Sample price', selectedService ? formatPrice(selectedService.price_ghs) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-3 py-4 text-sm">
                    <dt className="text-ink/50">{label}</dt>
                    <dd className="font-semibold text-right">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn-outline" onClick={() => setStep(3)} disabled={submitting}>
                  <ArrowLeft size={15} /> Edit details
                </button>
                <button type="button" className="btn-accent" onClick={() => void submit()} disabled={submitting}>
                  {submitting ? 'Reserving…' : 'Confirm booking'} <Check size={16} />
                </button>
              </div>
              <p className="mt-4 text-xs text-ink/45">By confirming you agree to the demo terms shown on this site. No payment is taken.</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-5">
          <div className="card p-6">
            <p className="eyebrow mb-5">Your appointment</p>
            <div className="space-y-5 text-sm">
              <div>
                <p className="text-xs text-ink/45">Service</p>
                <p className="mt-1 font-semibold">{selectedService?.name ?? 'Not selected'}</p>
              </div>
              <div>
                <p className="text-xs text-ink/45">Date</p>
                <p className="mt-1 font-semibold">{date ? formatDateInputLabel(date) : 'Not selected'}</p>
              </div>
              <div>
                <p className="text-xs text-ink/45">Time</p>
                <p className="mt-1 font-semibold">{selectedStart ? formatTime(selectedStart) : 'Not selected'}</p>
              </div>
              <div className="border-t border-ink/10 pt-5">
                <p className="text-xs text-ink/45">Sample price</p>
                <p className="mt-1 font-display text-3xl">{selectedService ? formatPrice(selectedService.price_ghs) : '—'}</p>
              </div>
            </div>
          </div>
          <Alert variant="info" title="Double-booking protection">
            The server verifies availability and holds a database write lock when saving. If
            someone takes the same slot first, you will be told immediately and shown fresh times.
          </Alert>
        </aside>
      </div>
    </div>
  );
}
