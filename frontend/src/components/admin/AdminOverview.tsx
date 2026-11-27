import { CalendarCheck2, CalendarDays, CheckCircle2, Gauge, XCircle } from 'lucide-react';
import Alert from '../Alert';
import Spinner from '../Spinner';
import { formatDateTime, formatPrice } from '../../services/format';
import type { Dashboard } from '../../types';

interface AdminOverviewProps {
  data: Dashboard | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function AdminOverview({ data, loading, error, onRefresh }: AdminOverviewProps) {
  if (loading && !data) return <Spinner label="Loading dashboard…" className="py-16 text-cream/60" />;
  if (error) return <div className="max-w-xl"><Alert variant="error" title="Dashboard unavailable">{error}</Alert><button type="button" className="btn-outline mt-4 border-cream/30 text-cream" onClick={onRefresh}>Retry</button></div>;
  if (!data) return null;

  const cards = [
    { label: 'Total bookings', value: String(data.total_bookings), icon: Gauge },
    { label: "Today's bookings", value: String(data.today_bookings), icon: CalendarDays },
    { label: 'Upcoming', value: String(data.upcoming_bookings), icon: CalendarCheck2 },
    { label: 'Confirmed', value: String(data.confirmed_bookings), icon: CheckCircle2 },
    { label: 'Cancelled', value: String(data.cancelled_bookings), icon: XCircle },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-cream/15 bg-white/5 p-5">
            <card.icon size={19} className="text-accent" />
            <p className="mt-4 font-display text-4xl">{card.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-cream/50">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-cream/15 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-cream/50">Sample value of active bookings</p>
            <p className="mt-2 font-display text-4xl text-accent">{formatPrice(data.sample_value_ghs)}</p>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-cream/45">
           Demo data only. This is a sum of sample service prices for pending/confirmed bookings,
            not revenue and not a payment total.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-cream/15 bg-white/5 p-6">
        <h2 className="text-2xl">Next appointments</h2>
        {data.upcoming.length === 0 ? (
          <p className="mt-4 text-sm text-cream/55">No upcoming pending or confirmed appointments.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-cream/45">
                <tr><th className="pb-3">Client</th><th className="pb-3">Service</th><th className="pb-3">When</th><th className="pb-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-cream/10">
                {data.upcoming.map((booking) => (
                  <tr key={booking.id}>
                    <td className="py-4 pr-4">{booking.client_name}</td>
                    <td className="py-4 pr-4 text-cream/65">{booking.service_name}</td>
                    <td className="py-4 pr-4 text-cream/65">{formatDateTime(booking.start_at)}</td>
                    <td className="py-4"><span className="rounded-full bg-accent/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent">{booking.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
