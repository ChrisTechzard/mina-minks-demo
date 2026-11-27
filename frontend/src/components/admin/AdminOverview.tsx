import { CalendarCheck2, CalendarDays, CheckCircle2, Gauge, RefreshCw, XCircle } from 'lucide-react';
import Alert from '../Alert';
import Spinner from '../Spinner';
import StatusBadge from '../ui/StatusBadge';
import { formatDateTime, formatPrice } from '../../services/format';
import type { Dashboard } from '../../types';

interface AdminOverviewProps {
  data: Dashboard | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function AdminOverview({ data, loading, error, onRefresh }: AdminOverviewProps) {
  if (loading && !data) return <Spinner label="Loading dashboard…" className="py-20" />;
  if (error && !data) {
    return (
      <div className="max-w-xl space-y-4">
        <Alert variant="error" title="Dashboard unavailable">{error}</Alert>
        <button type="button" className="btn-outline" onClick={onRefresh}>Retry</button>
      </div>
    );
  }
  if (!data) return null;

  const cards = [
    { label: 'Total bookings', value: data.total_bookings, icon: Gauge },
    { label: "Today's bookings", value: data.today_bookings, icon: CalendarDays },
    { label: 'Upcoming', value: data.upcoming_bookings, icon: CalendarCheck2 },
    { label: 'Confirmed', value: data.confirmed_bookings, icon: CheckCircle2 },
    { label: 'Cancelled', value: data.cancelled_bookings, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <div className="max-w-xl space-y-4">
          <Alert variant="error" title="Could not refresh the dashboard">{error}</Alert>
          <button type="button" className="btn-outline" onClick={onRefresh}>Retry</button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">At a glance</p>
          <h2 className="text-3xl sm:text-4xl">Today's studio pulse.</h2>
        </div>
        <button type="button" className="btn-outline px-4 py-2.5 text-xs" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <article key={card.label} className="surface p-5">
            <card.icon size={19} className="text-accent-deep" aria-hidden="true" />
            <p className="mt-5 font-display text-4xl leading-none">{card.value}</p>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-editorial text-ink-muted">{card.label}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-5xl border border-ink/10 bg-ink text-cream">
        <div className="flex flex-wrap items-end justify-between gap-6 p-6 sm:p-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-accent">Sample value</p>
            <p className="mt-3 font-display text-5xl leading-none text-accent">{formatPrice(data.sample_value_ghs)}</p>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-cream/55">
            Demo data only. This sums sample service prices for pending and confirmed bookings. It
            is not revenue and does not represent a payment total.
          </p>
        </div>
      </section>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-6 py-5 sm:px-8">
          <div>
            <h3 className="text-2xl">Next appointments</h3>
            <p className="mt-1 text-xs text-ink-muted">Upcoming pending and confirmed bookings.</p>
          </div>
          <span className="font-mono text-xs text-ink-faint">{data.upcoming.length} shown</span>
        </div>

        {data.upcoming.length === 0 ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <CalendarCheck2 size={26} className="mx-auto text-ink-faint" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl">No upcoming appointments.</p>
            <p className="mt-2 text-sm text-ink-muted">New demo bookings will appear here.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-ink/10 lg:hidden">
              {data.upcoming.map((booking) => (
                <article key={booking.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{booking.client_name}</p>
                      <p className="mt-1 text-xs text-ink-muted">{booking.service_name}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-4 text-xs text-ink-muted">{formatDateTime(booking.start_at)}</p>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-[11px] uppercase tracking-editorial text-ink-faint">
                  <tr>
                    <th scope="col" className="px-8 py-4">Client</th>
                    <th scope="col" className="px-5 py-4">Service</th>
                    <th scope="col" className="px-5 py-4">When</th>
                    <th scope="col" className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {data.upcoming.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-8 py-4 font-medium">{booking.client_name}</td>
                      <td className="px-5 py-4 text-ink-muted">{booking.service_name}</td>
                      <td className="px-5 py-4 text-ink-muted">{formatDateTime(booking.start_at)}</td>
                      <td className="px-8 py-4"><StatusBadge status={booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
