import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarOff, Clock3, RefreshCw, Trash2 } from 'lucide-react';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { api } from '../../services/api';
import { formatDuration, formatPrice } from '../../services/format';
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
  const [loadedOnce, setLoadedOnce] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const deleteKeepRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [availabilityResult, servicesResult] = await Promise.all([
        api.admin.availability(token),
        api.admin.services(token),
      ]);
      setHours(availabilityResult.working_hours);
      setBlocked(availabilityResult.blocked_dates);
      setTimezone(availabilityResult.timezone);
      setServices(servicesResult);
      setLoadedOnce(true);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to load configuration.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (pendingDeleteId !== null) deleteKeepRef.current?.focus();
  }, [pendingDeleteId]);

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
      await load();
      setSuccess(`${WEEKDAYS[hour.weekday]} hours saved.`);
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
      await load();
      setSuccess('Closure added.');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not add the closure.');
    } finally {
      setBusy(false);
    }
  };

  const removeBlockedDate = async (id: number): Promise<void> => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.deleteBlockedDate(token, id);
      setPendingDeleteId(null);
      await load();
      setSuccess('Closure removed.');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Could not remove the closure.');
    } finally {
      setBusy(false);
    }
  };

  const toggleService = async (service: AdminService): Promise<void> => {
    setBusy(true);
    setError(null);
    setSuccess(null);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Studio setup</p>
          <h2 className="text-3xl sm:text-4xl">Hours, closures & services.</h2>
          <p className="mt-2 text-sm text-ink-muted">Edit the demo configuration that drives public availability.</p>
        </div>
        <button type="button" className="btn-outline px-4 py-2.5 text-xs" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Reload
        </button>
      </div>

      {error ? <Alert variant="error" title="Configuration error">{error}</Alert> : null}
      {!error && success ? <Alert variant="success">{success}</Alert> : null}
      {loading && !loadedOnce ? <Spinner label="Loading configuration…" className="py-16" /> : null}
      {loading && loadedOnce ? (
        <p className="text-xs text-ink-muted" role="status">Refreshing configuration…</p>
      ) : null}

      {loadedOnce ? (
        <div aria-busy={loading} className="grid gap-6 xl:grid-cols-2">
          <section className="surface p-6 sm:p-8 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-3 text-2xl">
                  <Clock3 size={19} className="text-accent-deep" aria-hidden="true" /> Working hours
                </h3>
                <p className="mt-1 text-xs text-ink-muted">Times are interpreted in {timezone}.</p>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">{timezone}</span>
            </div>
            {hours.length === 0 ? <p className="mt-6 text-sm text-ink-muted">No working hours configured.</p> : null}
            <div className="mt-6 space-y-3">
              {hours.map((hour) => (
                <div key={hour.id} className="grid gap-3 rounded-3xl border border-ink/10 bg-white/55 p-4 sm:grid-cols-[1.1fr_1fr_1fr_auto_auto] sm:items-center">
                  <span className="text-sm font-semibold">{WEEKDAYS[hour.weekday]}</span>
                  <div>
                    <label className="sr-only" htmlFor={`hour-start-${hour.id}`}>{WEEKDAYS[hour.weekday]} opening time</label>
                    <input id={`hour-start-${hour.id}`} type="time" className="field py-2" value={hour.start_time} onChange={(event) => changeHour(hour.id, { start_time: event.target.value })} />
                  </div>
                  <div>
                    <label className="sr-only" htmlFor={`hour-end-${hour.id}`}>{WEEKDAYS[hour.weekday]} closing time</label>
                    <input id={`hour-end-${hour.id}`} type="time" className="field py-2" value={hour.end_time} onChange={(event) => changeHour(hour.id, { end_time: event.target.value })} />
                  </div>
                  <label className="flex min-h-[44px] items-center gap-2 text-xs text-ink-muted">
                    <input type="checkbox" className="h-4 w-4 accent-accent-deep" checked={hour.is_active} onChange={(event) => changeHour(hour.id, { is_active: event.target.checked })} />
                    Open
                  </label>
                  <button type="button" className="btn-primary min-h-[44px] px-4 py-2 text-xs" disabled={busy} onClick={() => void saveHour(hour)}>Save</button>
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-6 sm:p-8">
            <h3 className="flex items-center gap-3 text-2xl">
              <CalendarOff size={19} className="text-accent-deep" aria-hidden="true" /> Closures
            </h3>
            <p className="mt-1 text-xs text-ink-muted">Block a full day or a specific time window.</p>
            <form className="mt-6 space-y-4" onSubmit={(event) => void addBlockedDate(event)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="blocked-date">Date</label>
                  <input id="blocked-date" type="date" required className="field" value={blockedForm.date} onChange={(event) => setBlockedForm({ ...blockedForm, date: event.target.value })} />
                </div>
                <div>
                  <label className="field-label" htmlFor="blocked-reason">Reason <span className="normal-case tracking-normal text-ink-faint">(optional)</span></label>
                  <input id="blocked-reason" className="field" value={blockedForm.reason} onChange={(event) => setBlockedForm({ ...blockedForm, reason: event.target.value })} placeholder="Demo closure" />
                </div>
              </div>
              <label className="flex min-h-[44px] items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" className="h-4 w-4 accent-accent-deep" checked={blockedForm.is_full_day} onChange={(event) => setBlockedForm({ ...blockedForm, is_full_day: event.target.checked })} />
                Full-day closure
              </label>
              {!blockedForm.is_full_day ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="blocked-start">From</label>
                    <input id="blocked-start" type="time" className="field" value={blockedForm.start_time} onChange={(event) => setBlockedForm({ ...blockedForm, start_time: event.target.value })} />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="blocked-end">Until</label>
                    <input id="blocked-end" type="time" className="field" value={blockedForm.end_time} onChange={(event) => setBlockedForm({ ...blockedForm, end_time: event.target.value })} />
                  </div>
                </div>
              ) : null}
              <button type="submit" className="btn-primary w-full" disabled={busy}>Add closure</button>
            </form>

            <div className="mt-7 space-y-2 border-t border-ink/10 pt-5">
              {blocked.length === 0 ? <p className="text-sm text-ink-muted">No closures configured.</p> : null}
              {blocked.map((entry) => (
                <div key={entry.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-white/55">
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{entry.date}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {entry.is_full_day ? 'Full day' : `${entry.start_time}–${entry.end_time}`}
                        {entry.reason ? ` · ${entry.reason}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-faint transition hover:bg-danger-light hover:text-danger"
                      aria-label={`Delete closure ${entry.date}`}
                      disabled={busy}
                      onClick={() => setPendingDeleteId(entry.id)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  {pendingDeleteId === entry.id ? (
                    <div className="border-t border-danger/20 bg-danger-light/70 px-4 py-3" aria-live="assertive">
                      <p className="text-xs font-semibold text-danger">Remove this closure?</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-danger/80">
                        {entry.date} will be removed from availability. Existing bookings are not changed.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          ref={deleteKeepRef}
                          type="button"
                          className="inline-flex min-h-[40px] items-center rounded-full border border-ink/20 bg-ivory px-4 py-2 text-xs font-semibold text-ink transition hover:border-ink disabled:opacity-50"
                          disabled={busy}
                          onClick={() => setPendingDeleteId(null)}
                        >
                          Keep closure
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-[40px] items-center rounded-full bg-danger px-4 py-2 text-xs font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
                          disabled={busy}
                          onClick={() => void removeBlockedDate(entry.id)}
                        >
                          {busy ? 'Removing…' : 'Yes, remove'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="surface p-6 sm:p-8">
            <h3 className="text-2xl">Sample services</h3>
            <p className="mt-1 text-xs text-ink-muted">Inactive services disappear from the public menu and booking flow.</p>
            {services.length === 0 ? <p className="mt-6 text-sm text-ink-muted">No services configured.</p> : null}
            <div className="mt-6 space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white/55 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{service.name}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {service.category} · {formatPrice(service.price_ghs)} · {formatDuration(service.duration_minutes)}
                    </p>
                  </div>
                  <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-accent-deep"
                      checked={service.is_active}
                      disabled={busy}
                      onChange={() => void toggleService(service)}
                    />
                    Active
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
