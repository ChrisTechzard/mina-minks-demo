import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarClock, Check, RefreshCw, Search, X } from 'lucide-react';
import Alert from '../Alert';
import Spinner from '../Spinner';
import EmptyState from '../ui/EmptyState';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import { api } from '../../services/api';
import {
  businessDateFromIso,
  businessDateToday,
  formatDateInputLabel,
  formatDateTime,
  formatPrice,
  formatTime,
} from '../../services/format';
import type { AdminBooking, BookingPatch } from '../../types';

interface AdminBookingsPanelProps {
  token: string;
  onChanged: () => void;
}

const STATUS_OPTIONS: Record<string, string[]> = {
  pending: ['pending', 'confirmed', 'cancelled'],
  confirmed: ['confirmed', 'completed', 'cancelled'],
  cancelled: ['cancelled', 'pending', 'confirmed'],
  completed: ['completed'],
};

function statusOptions(status: string): string[] {
  return STATUS_OPTIONS[status] ?? ['pending', 'confirmed', 'completed', 'cancelled'];
}

export default function AdminBookingsPanel({ token, onChanged }: AdminBookingsPanelProps) {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminBooking | null>(null);
  const [draftStatus, setDraftStatus] = useState<string>('pending');
  const [draftNotes, setDraftNotes] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [rescheduleOpen, setRescheduleOpen] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState<boolean>(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [newStart, setNewStart] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);
  const cancelKeepRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setBookings(await api.admin.bookings(token, {
        search: search.trim() || undefined,
        status: status || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [token, search, status, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!rescheduleOpen || !selected || !rescheduleDate) {
      setRescheduleSlots([]);
      return;
    }
    let active = true;
    setRescheduleLoading(true);
    setRescheduleError(null);
    api.getAvailability(rescheduleDate, selected.service_id)
      .then((result) => { if (active) setRescheduleSlots(result.slots); })
      .catch((caught: unknown) => {
        if (active) {
          setRescheduleSlots([]);
          setRescheduleError(caught instanceof Error ? caught.message : 'Could not load times.');
        }
      })
      .finally(() => { if (active) setRescheduleLoading(false); });
    return () => { active = false; };
  }, [rescheduleOpen, selected?.id, selected?.service_id, rescheduleDate]);

  useEffect(() => {
    if (confirmCancel) cancelKeepRef.current?.focus();
  }, [confirmCancel]);

  const close = (): void => {
    setSelected(null);
    setConfirmCancel(false);
  };

  const open = (booking: AdminBooking): void => {
    setSelected(booking);
    setDraftStatus(booking.status);
    setDraftNotes(booking.notes ?? '');
    setActionError(null);
    setRescheduleOpen(false);
    setRescheduleDate(businessDateFromIso(booking.start_at) || businessDateToday());
    setRescheduleSlots([]);
    setRescheduleError(null);
    setNewStart(null);
    setConfirmCancel(false);
  };

  const refresh = (): void => {
    void load();
    onChanged();
  };

  const save = async (): Promise<void> => {
    if (!selected) return;
    if (rescheduleOpen && !newStart) {
      setActionError('Choose a new time before saving.');
      return;
    }
    setBusy(true);
    setActionError(null);
    try {
      const patch: BookingPatch = { status: draftStatus, notes: draftNotes };
      if (newStart) patch.start_at = newStart;
      await api.admin.patchBooking(token, selected.id, patch);
      close();
      refresh();
    } catch (caught: unknown) {
      setActionError(caught instanceof Error ? caught.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (): Promise<void> => {
    if (!selected) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.admin.cancelBooking(token, selected.id);
      close();
      refresh();
    } catch (caught: unknown) {
      setActionError(caught instanceof Error ? caught.message : 'Cancellation failed.');
    } finally {
      setBusy(false);
    }
  };

  const resetFilters = (): void => {
    setSearch('');
    setStatus('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = search.length > 0 || status.length > 0 || dateFrom.length > 0 || dateTo.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Appointments</p>
          <h2 className="text-3xl sm:text-4xl">Every booking, in view.</h2>
          <p className="mt-2 text-sm text-ink-muted">Search, filter and update demonstration bookings.</p>
        </div>
        <button type="button" className="btn-outline px-4 py-2.5 text-xs" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
        </button>
      </div>

      {loading && bookings.length > 0 ? (
        <p className="text-xs text-ink-muted" role="status">Refreshing appointments…</p>
      ) : null}

      <form
        className="surface grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5"
        onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void load(); }}
      >
        <div className="sm:col-span-2 xl:col-span-2">
          <label className="field-label" htmlFor="booking-search">Name or reference</label>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input id="booking-search" className="field pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="booking-status">Status</label>
          <select id="booking-status" className="field" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="booking-from">From date</label>
          <input id="booking-from" type="date" className="field" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="booking-to">To date</label>
          <input id="booking-to" type="date" className="field" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-5">
          <button type="submit" className="btn-primary flex-1"><Search size={15} aria-hidden="true" /> Apply filters</button>
          {hasFilters ? (
            <button type="button" className="btn-outline" onClick={resetFilters}>
              <X size={15} aria-hidden="true" /> Clear
            </button>
          ) : null}
        </div>
      </form>

      {loading && bookings.length === 0 ? <Spinner label="Loading appointments…" className="py-14" /> : null}
      {error ? (
        <div className="max-w-xl space-y-2">
          <Alert variant="error" title="Bookings unavailable">{error}</Alert>
          {bookings.length > 0 ? <p className="text-xs text-ink-muted">Showing the last loaded appointments.</p> : null}
        </div>
      ) : null}

      {!loading && !error && bookings.length === 0 ? (
        <EmptyState
          icon={<CalendarClock size={28} />}
          title={hasFilters ? 'No bookings matched these filters.' : 'No bookings yet.'}
          description={hasFilters ? 'Try a wider date range or clear the status filter.' : 'New demo bookings will appear here.'}
          action={hasFilters ? <button type="button" className="btn-outline" onClick={resetFilters}>Clear filters</button> : undefined}
        />
      ) : null}

      {bookings.length > 0 ? (
        <div aria-busy={loading}>
          <div className="space-y-3 lg:hidden">
            {bookings.map((booking) => (
              <article key={booking.id} className="surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{booking.client_name}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-ink-faint">{booking.reference}</p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-4 text-sm text-ink-soft">{booking.service_name}</p>
                <p className="mt-1.5 text-xs text-ink-muted">{formatDateTime(booking.start_at)}</p>
                <button type="button" className="btn-outline mt-5 w-full py-2 text-xs" onClick={() => open(booking)}>View details</button>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-4xl border border-ink/10 bg-ivory lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink/10 text-[11px] uppercase tracking-editorial text-ink-faint">
                <tr>
                  <th scope="col" className="px-6 py-4">Reference</th>
                  <th scope="col" className="px-5 py-4">Client</th>
                  <th scope="col" className="px-5 py-4">Service</th>
                  <th scope="col" className="px-5 py-4">When</th>
                  <th scope="col" className="px-5 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="transition hover:bg-white/60">
                    <td className="px-6 py-4 font-mono text-xs">{booking.reference}</td>
                    <td className="px-5 py-4">
                      <span className="font-medium">{booking.client_name}</span>
                      <span className="mt-1 block text-xs text-ink-muted">{booking.client_email}</span>
                    </td>
                    <td className="px-5 py-4 text-ink-muted">{booking.service_name}</td>
                    <td className="px-5 py-4 text-ink-muted">
                      {formatDateTime(booking.start_at)}
                      <span className="mt-1 block text-xs text-ink-faint">until {formatTime(booking.end_at)}</span>
                    </td>
                    <td className="px-5 py-4"><StatusBadge status={booking.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" className="link-arrow" onClick={() => open(booking)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {selected ? (
        <Modal
          title="Appointment details"
          description={selected.reference}
          onClose={() => close()}
          footer={
            <>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void save()}>
                {busy ? 'Saving…' : 'Save changes'} <Check size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="inline-flex min-h-[46px] items-center rounded-full border border-danger/30 bg-danger-light px-5 py-3 text-sm font-semibold text-danger transition hover:brightness-95 disabled:opacity-50"
                disabled={busy || !statusOptions(selected.status).includes('cancelled')}
                onClick={() => setConfirmCancel(true)}
              >
                Cancel appointment
              </button>
              <button type="button" className="btn-quiet" disabled={busy} onClick={() => close()}>Close</button>
            </>
          }
        >
          <dl className="grid gap-x-8 gap-y-3 rounded-3xl border border-ink/10 bg-ivory px-5 py-6 text-sm sm:grid-cols-2">
            {[
              ['Client', selected.client_name],
              ['Email', selected.client_email],
              ['Phone', selected.client_phone],
              ['Service', selected.service_name],
              ['When', formatDateTime(selected.start_at)],
              ['Sample price', formatPrice(selected.price_ghs)],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">{label}</dt>
                <dd className="mt-1 break-words font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="status-update">Status</label>
              <select id="status-update" className="field" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}>
                {statusOptions(selected.status).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {selected.status === 'completed' ? (
                <p className="mt-2 text-xs text-ink-faint">Completed bookings are terminal in this demo.</p>
              ) : null}
            </div>
            <div>
              <label className="field-label" htmlFor="notes-update">Internal notes</label>
              <textarea id="notes-update" rows={3} className="field resize-y" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
            </div>
          </div>

          <div className="mt-6 border-t border-ink/10 pt-5">
            <button
              type="button"
              className="btn-quiet -ml-4"
              disabled={selected.status === 'completed'}
              aria-expanded={rescheduleOpen}
              onClick={() => {
                setRescheduleOpen((current: boolean) => !current);
                setNewStart(null);
                setRescheduleError(null);
              }}
            >
              <CalendarClock size={15} aria-hidden="true" /> {rescheduleOpen ? 'Hide reschedule' : 'Reschedule appointment'}
            </button>
            {selected.status === 'completed' ? (
              <p className="mt-1 text-xs text-ink-faint">Completed appointments cannot be rescheduled.</p>
            ) : null}

            {rescheduleOpen ? (
              <div className="mt-4 rounded-3xl border border-ink/10 bg-cream p-5">
                <label className="field-label" htmlFor="reschedule-date">New date</label>
                <input
                  id="reschedule-date"
                  type="date"
                  className="field"
                  min={businessDateToday()}
                  value={rescheduleDate}
                  onChange={(event) => { setRescheduleDate(event.target.value); setNewStart(null); }}
                />
                {rescheduleLoading ? <Spinner label="Checking times…" className="py-6" /> : null}
                {rescheduleError ? <Alert variant="error" className="mt-4">{rescheduleError}</Alert> : null}
                {!rescheduleLoading && !rescheduleError && rescheduleSlots.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">No open times on this date. Try another day.</p>
                ) : null}
                {!rescheduleLoading && rescheduleSlots.length > 0 ? (
                  <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {rescheduleSlots.map((slot: string) => (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={newStart === slot}
                        className={`min-h-[42px] rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                          newStart === slot ? 'border-ink bg-ink text-cream' : 'border-ink/15 bg-ivory hover:border-ink/50'
                        }`}
                        onClick={() => { setNewStart(slot); setRescheduleError(null); }}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                ) : null}
                {newStart ? (
                  <p className="mt-4 text-xs font-semibold text-accent-deep">
                    New time: {formatDateInputLabel(rescheduleDate)} at {formatTime(newStart)} (Africa/Accra)
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {confirmCancel ? (
            <div
              className="mt-5 rounded-3xl border border-danger/25 bg-danger-light p-5"
              aria-live="assertive"
              aria-labelledby="cancel-confirmation-title"
            >
              <p id="cancel-confirmation-title" className="text-sm font-semibold text-danger">
                Cancel this appointment?
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-danger/80">
                {selected.reference} for {selected.client_name} will be marked cancelled. You can
                reactivate it later from the status control.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  ref={cancelKeepRef}
                  type="button"
                  className="inline-flex min-h-[44px] items-center rounded-full border border-ink/20 bg-ivory px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink disabled:opacity-50"
                  disabled={busy}
                  onClick={() => setConfirmCancel(false)}
                >
                  Keep appointment
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-[44px] items-center rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void cancel()}
                >
                  {busy ? 'Cancelling…' : 'Yes, cancel booking'}
                </button>
              </div>
            </div>
          ) : null}

          {actionError ? <Alert variant="error" className="mt-5">{actionError}</Alert> : null}
        </Modal>
      ) : null}
    </div>
  );
}
