import { Link } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import ServiceCard from '../components/ServiceCard';
import DemoBadge from '../components/DemoBadge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { formatDuration, formatPrice } from '../services/format';

export default function ServicesPage() {
  const { services, loading, error, reload } = useServices();

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="eyebrow">The menu</p>
            <DemoBadge />
          </div>
          <h1 className="text-5xl leading-tight sm:text-6xl">Sample services, clearly priced.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/60">
            Compare demonstration options by category, duration and GHS price. These examples
            are configurable and must be confirmed by Mina before real bookings exist.
          </p>
        </div>
        <Link to="/recommend" className="btn-primary">
          Not sure? Find your style <ArrowRight size={16} />
        </Link>
      </div>

      <div className="mt-10 overflow-hidden rounded-3xl border border-ink/10 bg-white/60">
        <div className="grid grid-cols-3 divide-x divide-ink/10 text-center text-xs uppercase tracking-wider text-ink/55">
          <div className="px-3 py-4">No payment collected</div>
          <div className="px-3 py-4">Times in Africa/Accra</div>
          <div className="px-3 py-4">Demo data only</div>
        </div>
      </div>

      <div className="mt-10">
        {loading ? <Spinner label="Loading sample services…" className="py-16" /> : null}
        {error ? (
          <div className="space-y-4">
            <Alert variant="error" title="We couldn't load the menu">{error}</Alert>
            <button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>
          </div>
        ) : null}
        {!loading && !error ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : null}
      </div>

      {!loading && !error ? (
        <section className="mt-16 rounded-3xl border border-ink/10 bg-ink px-6 py-10 text-cream sm:px-10">
          <h2 className="text-3xl">Prefer to see everything side by side?</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-editorial text-cream/50">
                <tr>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Sample price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/10">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="py-4 pr-4">{service.name}</td>
                    <td className="py-4 pr-4 text-cream/60">{service.category}</td>
                    <td className="py-4 pr-4 text-cream/60">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} /> {formatDuration(service.duration_minutes)}
                      </span>
                    </td>
                    <td className="py-4 font-semibold text-accent">{formatPrice(service.price_ghs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
