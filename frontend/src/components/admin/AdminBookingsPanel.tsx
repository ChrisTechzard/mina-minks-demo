import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, RefreshCw, X } from 'lucide-react';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { api } from '../../services/api';
import { formatDateTime, formatPrice, formatTime } from '../../services/format';
import type { AdminBooking } from '../../types';

interface AdminBookingsPanelProps {
  token: string;
  onChanged: () => void;
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

  const open = (booking: AdminBooking): void => {
    setSelected(booking);
    setDraftStatus(booking.status);
    setDraftNotes(booking.notes ?? '');
    setActionError(null);
  };

  const refresh = (): void => {
    void load();
    onChanged();
  };

  const save = async (): Promise<void> => {
    if (!selected) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.admin.patchBooking(token, selected.id, {
        status: draftStatus,
        notes: draftNotes,
      });
      setSelected(null);
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
      setSelected(null);
      refresh();
    } catch (caught: unknown) {
      setActionError(caught instanceof Error ? caught.message : 'Cancellation failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl">Appointments</h2>
          <p className="mt-2 text-sm text-cream/55">Search, filter and update demonstration bookings.</p>
        </div>
        <button type="button" className="btn-outline border-cream/25 px-4 py-2 text-xs text-cream" onClick={refresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-cream/15 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void load(); }}
      >
        <div className="lg:col-span-2">
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-cream/45" htmlFor="booking-search">Name or reference</label>
          <input id="booking-search" className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream placeholder:text-cream/30" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search…" />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-cream/45" htmlFor="booking-status">Status</label>
          <select id="booking-status" className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-cream/45" htmlFor="booking-from">From</label>
          <input id="booking-from" type="date" className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-cream/45" htmlFor="booking-to">To</label>
          <input id="booking-to" type="date" className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
        <button type="submit" className="btn-accent sm:col-span-2 lg:col-span-5"><Search size={15} /> Apply filters</button>
      </form>

      {loading ? <Spinner label="Loading appointments…" className="py-12 text-cream/60" /> : null}
      {error ? <div className="max-w-xl"><Alert variant="error" title="Bookings unavailable">{error}</Alert></div> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-2xl border border-cream/15 bg-white/5">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-cream/45">
              <tr>
                <th className="px-5 py-4">Reference</th>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Service</th>
                <th className="px-5 py-4">When</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/10">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-white/5">
                  <td className="px-5 py-4 font-mono text-xs">{booking.reference}</td>
                  <td className="px-5 py-4">{booking.client_name}<span className="block text-xs text-cream/45">{booking.client_email}</span></td>
                  <td className="px-5 py-4 text-cream/70">{booking.service_name}</td>
                  <td className="px-5 py-4 text-cream/70">{formatDateTime(booking.start_at)}<span className="block text-xs text-cream/45">until {formatTime(booking.end_at)}</span></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${booking.status === 'cancelled' ? 'bg-white/10 text-cream/60' : 'bg-accent/20 text-accent'}`}>{booking.status}</span></td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" className="text-xs font-semibold uppercase tracking-wider text-accent hover:underline" onClick={() => open(booking)}>View</button>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-cream/50">No bookings matched these filters.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8" role="dialog" aria-modal="true" aria-label="Booking details">
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-3xl border border-cream/15 bg-[#171717] p-6 text-cream sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-cream/50">Booking details</p>
                <h3 className="mt-2 font-mono text-xl">{selected.reference}</h3>
              </div>
              <button type="button" className="rounded-full border border-cream/20 p-2 hover:border-accent" aria-label="Close details" onClick={() => setSelected(null)}><X size={16} /></button>
            </div>
            <dl className="mt-6 divide-y divide-cream/10 border-y border-cream/10 text-sm">
              <div className="flex justify-between gap-4 py-3"><dt className="text-cream/45">Client</dt><dd className="text-right">{selected.client_name}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-cream/45">Email</dt><dd className="text-right">{selected.client_email}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-cream/45">Phone</dt><dd className="text-right">{selected.client_phone}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-cream/45">Service</dt><dd className="text-right">{selected.service_name}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-cream/45">When</dt><dd className="text-right">{formatDateTime(selected.start_at)}</dd></div>
              <div className="flex justify-between gap-4 py-3"><dt className="text-cream/45">Sample price</dt><dd className="text-right text-accent">{formatPrice(selected.price_ghs)}</dd></div>
            </dl>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-cream/50" htmlFor="status-update">Status</label>
                <select id="status-update" className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-3 text-sm text-cream" value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}>
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-cream/50" htmlFor="notes-update">Internal notes</label>
                <textarea id="notes-update" rows={3} className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-3 text-sm text-cream" value={draftNotes} onChange={(event) => setDraftNotes(event.target.value)} />
              </div>
            </div>

            {actionError ? <Alert variant="error" className="mt-5">{actionError}</Alert> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="btn-accent" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save changes'}</button>
              <button type="button" className="btn-outline border-cream/25 text-cream" disabled={busy} onClick={() => void cancel()}>Cancel appointment</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
