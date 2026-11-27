import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { useServices } from '../hooks/useServices';
import ServiceCard from '../components/ServiceCard';
import DemoBadge from '../components/DemoBadge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import EmptyState from '../components/ui/EmptyState';
import PageIntro from '../components/ui/PageIntro';
import { formatDuration, formatPrice } from '../services/format';
import { publicDisclaimer, publicServices } from '../content/publicInfo';

export default function ServicesPage() {
  const { services, loading, error, reload } = useServices();
  const [category, setCategory] = useState<string>('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(services.map((service) => service.category)))],
    [services],
  );
  const visibleServices = useMemo(
    () => (category === 'All' ? services : services.filter((service) => service.category === category)),
    [category, services],
  );

  return (
    <div className="page-shell py-14 sm:py-20">
      <PageIntro
        eyebrow="The sample menu"
        title="Services, clearly priced."
        description="Compare demonstration options by style, duration and GHS price. Every value here is configurable sample data and must be confirmed before real bookings exist."
        actions={<Link to="/recommend" className="btn-primary">Not sure? Find your style <ArrowRight size={16} aria-hidden="true" /></Link>}
        aside={<DemoBadge />}
      />

      <div className="mt-10 flex flex-wrap gap-2 border-b border-ink/10 pb-5" aria-label="Filter services by category">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={category === item}
            onClick={() => setCategory(item)}
            className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition duration-200 ${
              category === item ? 'bg-ink text-cream' : 'border border-ink/15 text-ink-muted hover:border-ink/50 hover:text-ink'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? <Spinner label="Loading sample services…" className="py-16" /> : null}
      {error ? (
        <div className="mt-8 max-w-xl space-y-4">
          <Alert variant="error" title="We couldn't load the menu">{error}</Alert>
          <button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>
        </div>
      ) : null}
      {!loading && !error ? (
        services.length === 0 ? (
          <EmptyState
            className="mt-8"
            icon={<Sparkles size={28} />}
            title="The sample menu is empty."
            description="Services will appear here once the studio configures its menu."
            action={<button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>}
          />
        ) : visibleServices.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-8"
            icon={<Sparkles size={28} />}
            title="Nothing in this category yet."
            description="Choose another category to see the rest of the sample menu."
            action={<button type="button" className="btn-outline" onClick={() => setCategory('All')}>Show all services</button>}
          />
        )
      ) : null}

      {!loading && !error && services.length > 0 ? (
        <section className="mt-16 overflow-hidden rounded-5xl bg-ink text-cream">
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 py-8 sm:px-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-editorial text-accent">At a glance</p>
              <h2 className="mt-3 text-3xl sm:text-4xl">Compare every sample service.</h2>
            </div>
            <Link to="/book" className="btn-accent">Reserve a slot <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <div className="overflow-x-auto border-t border-cream/10">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-ink text-[11px] uppercase tracking-editorial text-cream/45">
                <tr>
                  <th scope="col" className="px-6 py-4 sm:px-10">Service</th>
                  <th scope="col" className="px-4 py-4">Category</th>
                  <th scope="col" className="px-4 py-4">Duration</th>
                  <th scope="col" className="px-6 py-4 text-right sm:px-10">Sample price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/10">
                {services.map((service) => (
                  <tr key={service.id} className="transition hover:bg-cream/[0.04]">
                    <td className="px-6 py-4 font-medium sm:px-10">{service.name}</td>
                    <td className="px-4 py-4 text-cream/60">{service.category}</td>
                    <td className="px-4 py-4 text-cream/60">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={13} aria-hidden="true" /> {formatDuration(service.duration_minutes)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-accent sm:px-10">{formatPrice(service.price_ghs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="mt-16 border-t border-champagne/45 pt-12">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="eyebrow text-accent-deep">Published reference</p>
            <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">The public Mina Minks menu.</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Names, descriptions, prices and durations below are published on minaminks.com. They
              are shown for reference only — the booking flow above uses separate sample data, and
              no published price or duration is enforced here.
            </p>
          </div>
          <a
            href="https://www.minaminks.com/"
            target="_blank"
            rel="noreferrer"
            className="btn-outline"
          >
            View source <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
        <p className="mt-6 max-w-3xl rounded-2xl border border-champagne/45 bg-blush/30 px-4 py-3 text-xs leading-relaxed text-ink-soft">
          {publicDisclaimer}
        </p>
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {publicServices.map((service) => (
            <article key={service.name} className="surface p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl leading-tight">{service.name}</h3>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-editorial text-accent-deep">
                    {service.category}
                  </p>
                </div>
                <p className="font-display text-2xl leading-none text-ink">{service.publishedPrice}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{service.description}</p>
              <p className="mt-4 border-t border-champagne/45 pt-3 text-xs text-ink-soft">
                Published duration: {service.publishedDuration} · not applied to demo availability
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
