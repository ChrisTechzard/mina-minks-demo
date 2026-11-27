import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { api } from '../../services/api';
import { formatPrice } from '../../services/format';
import type { AdminService, BlockedDate, WorkingHour } from '../../types';

interface AdminSettingsPanelProps {
  token: string;
}

interface BlockedForm {
  date: string;
  reason: string;
  is_full_day: boolean;
  start_time: string;
  end_time: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminSettingsPanel({ token }: AdminSettingsPanelProps) {
  const [hours, setHours] = useState<WorkingHour[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [services, setServices] = useState<AdminService[]>([]);
  const [timezone, setTimezone] = useState<string>('Africa/Accra');
  const [blockedForm, setBlockedForm] = useState<BlockedForm>({
    date: '',
    reason: '',
    is_full_day: true,
    start_time: '12:00',
    end_time: '14:00',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [availabilityResult, servicesResult] = await Promise.all([
        api.admin.availability(token),
        api.admin.services(token),
      ]);
      setHours(availabilityResult.working_hours);
      setBlocked(availabilityResult.blocked_dates);
      setTimezone(availabilityResult.timezone);
      setServices(servicesResult);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to load configuration.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeHour = (id: number, patch: Partial<WorkingHour>): void => {
    setHours((previous: WorkingHour[]) =>
      previous.map((hour) => (hour.id === id ? { ...hour, ...patch } : hour)),
    );
  };

  const saveHour = async (hour: WorkingHour): Promise<void> => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.saveWorkingHour(token, {
        weekday: hour.weekday,
        start_time: hour.start_time,
        end_time: hour.end_time,
        is_active: hour.is_active,
      });
      setSuccess(`${WEEKDAYS[hour.weekday]} hours saved.`);
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not save working hours.');
    } finally {
      setBusy(false);
    }
  };

  const addBlockedDate = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.createBlockedDate(token, {
        date: blockedForm.date,
        reason: blockedForm.reason.trim() || null,
        is_full_day: blockedForm.is_full_day,
        start_time: blockedForm.is_full_day ? null : blockedForm.start_time,
        end_time: blockedForm.is_full_day ? null : blockedForm.end_time,
      });
      setBlockedForm({ date: '', reason: '', is_full_day: true, start_time: '12:00', end_time: '14:00' });
      setSuccess('Closure added.');
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not add the closure.');
    } finally {
      setBusy(false);
    }
  };

  const removeBlockedDate = async (id: number): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await api.admin.deleteBlockedDate(token, id);
      setSuccess('Closure removed.');
      await load();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not remove the closure.');
    } finally {
      setBusy(false);
    }
  };

  const toggleService = async (service: AdminService): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.admin.patchService(token, service.id, { is_active: !service.is_active });
      setServices((previous: AdminService[]) => previous.map((item) => (item.id === updated.id ? updated : item)));
      setSuccess(`${updated.name} is now ${updated.is_active ? 'active' : 'inactive'}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not update the service.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl">Studio configuration</h2>
          <p className="mt-2 text-sm text-cream/55">Edit demo working hours, closures and service availability.</p>
        </div>
        <button type="button" className="btn-outline border-cream/25 px-4 py-2 text-xs text-cream" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload
        </button>
      </div>

      {error ? <div className="max-w-2xl"><Alert variant="error" title="Configuration error">{error}</Alert></div> : null}
      {success ? <div className="max-w-2xl"><Alert variant="success">{success}</Alert></div> : null}
      {loading ? <Spinner label="Loading configuration…" className="py-12 text-cream/60" /> : null}

      {!loading ? (
        <>
          <section className="rounded-2xl border border-cream/15 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-2xl">Working hours</h3>
              <span className="text-xs uppercase tracking-wider text-cream/45">{timezone}</span>
            </div>
            <div className="mt-5 space-y-3">
              {hours.map((hour) => (
                <div key={hour.id} className="grid gap-3 rounded-xl border border-cream/10 bg-ink/40 p-3 sm:grid-cols-[1.2fr_1fr_1fr_auto_auto] sm:items-center">
                  <span className="text-sm">{WEEKDAYS[hour.weekday]}</span>
                  <input type="time" className="rounded-lg border border-cream/15 bg-ink/60 px-3 py-2 text-sm text-cream" value={hour.start_time} onChange={(event) => changeHour(hour.id, { start_time: event.target.value })} aria-label={`${WEEKDAYS[hour.weekday]} opening time`} />
                  <input type="time" className="rounded-lg border border-cream/15 bg-ink/60 px-3 py-2 text-sm text-cream" value={hour.end_time} onChange={(event) => changeHour(hour.id, { end_time: event.target.value })} aria-label={`${WEEKDAYS[hour.weekday]} closing time`} />
                  <label className="flex items-center gap-2 text-xs text-cream/65">
                    <input type="checkbox" className="h-4 w-4 accent-[#C8FF00]" checked={hour.is_active} onChange={(event) => changeHour(hour.id, { is_active: event.target.checked })} />
                    Open
                  </label>
                  <button type="button" className="btn-accent px-4 py-2 text-xs" disabled={busy} onClick={() => void saveHour(hour)}>Save</button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-cream/15 bg-white/5 p-6">
              <h3 className="text-2xl">Blocked dates</h3>
              <form className="mt-5 space-y-4" onSubmit={(event) => void addBlockedDate(event)}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-cream/45" htmlFor="blocked-date">Date</label>
                    <input id="blocked-date" type="date" required className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={blockedForm.date} onChange={(event) => setBlockedForm({ ...blockedForm, date: event.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wider text-cream/45" htmlFor="blocked-reason">Reason</label>
                    <input id="blocked-reason" className="w-full rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={blockedForm.reason} onChange={(event) => setBlockedForm({ ...blockedForm, reason: event.target.value })} placeholder="Demo closure" />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-cream/70">
                  <input type="checkbox" className="h-4 w-4 accent-[#C8FF00]" checked={blockedForm.is_full_day} onChange={(event) => setBlockedForm({ ...blockedForm, is_full_day: event.target.checked })} />
                  Full-day closure
                </label>
                {!blockedForm.is_full_day ? (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="time" className="rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={blockedForm.start_time} onChange={(event) => setBlockedForm({ ...blockedForm, start_time: event.target.value })} aria-label="Blocked period start" />
                    <input type="time" className="rounded-xl border border-cream/15 bg-ink/60 px-3 py-2.5 text-sm text-cream" value={blockedForm.end_time} onChange={(event) => setBlockedForm({ ...blockedForm, end_time: event.target.value })} aria-label="Blocked period end" />
                  </div>
                ) : null}
                <button type="submit" className="btn-accent w-full" disabled={busy}>Add closure</button>
              </form>

              <div className="mt-6 space-y-2">
                {blocked.length === 0 ? <p className="text-sm text-cream/45">No closures configured.</p> : null}
                {blocked.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-cream/10 bg-ink/40 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold">{entry.date}</p>
                      <p className="text-xs text-cream/45">{entry.is_full_day ? 'Full day' : `${entry.start_time}–${entry.end_time}`}{entry.reason ? ` · ${entry.reason}` : ''}</p>
                    </div>
                    <button type="button" className="text-cream/50 hover:text-red-300" aria-label={`Delete closure ${entry.date}`} disabled={busy} onClick={() => void removeBlockedDate(entry.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-cream/15 bg-white/5 p-6">
              <h3 className="text-2xl">Sample services</h3>
              <p className="mt-2 text-xs text-cream/45">Inactive services disappear from the public menu and booking flow.</p>
              <div className="mt-5 space-y-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between gap-4 rounded-xl border border-cream/10 bg-ink/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{service.name}</p>
                      <p className="text-xs text-cream/45">{service.category} · {formatPrice(service.price_ghs)} · {service.duration_minutes} min</p>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 text-xs text-cream/65">
                      <input type="checkbox" className="h-4 w-4 accent-[#C8FF00]" checked={service.is_active} disabled={busy} onChange={() => void toggleService(service)} />
                      Active
                    </label>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
