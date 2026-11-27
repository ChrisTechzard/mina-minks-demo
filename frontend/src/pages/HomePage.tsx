import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck2, Heart, ShieldCheck, Sparkles } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import ServiceCard from '../components/ServiceCard';
import DemoBadge from '../components/DemoBadge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import { useServices } from '../hooks/useServices';

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
    caption: 'Soft definition',
  },
  {
    src: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=800&q=80',
    caption: 'Everyday elegance',
  },
  {
    src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80',
    caption: 'Statement volume',
  },
];

export default function HomePage() {
  const { services, loading, error } = useServices();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="eyebrow">Lash studio · Accra demo</span>
              <DemoBadge />
            </div>
            <h1 className="max-w-2xl text-5xl leading-[0.98] sm:text-6xl lg:text-7xl">
              Lashes that feel like you,
              <span className="relative ml-2 inline-block">
                <span className="relative z-10">only softer.</span>
                <span className="absolute bottom-1 left-0 z-0 h-3 w-full bg-accent/80" />
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-ink/65 sm:text-lg">
              Explore sample lash styles, compare demo prices and reserve a time that fits your
              day. A polished booking experience built for Mina Minks — with sample business
              details clearly labelled throughout.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/book" className="btn-accent">
                Book an appointment <ArrowRight size={16} />
              </Link>
              <Link to="/services" className="btn-outline">
                View sample menu
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-ink/10 pt-6 text-xs uppercase tracking-wider text-ink/50">
              <span>6 sample services</span>
              <span>GHS pricing demo</span>
              <span>Accra timezone</span>
              <span>No payment collected</span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] border border-ink/10 bg-sand/20">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&q=85"
                alt="Premium lash styling sample photograph"
                className="h-full w-full"
              />
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-ink/10 bg-cream/95 p-5 shadow-soft backdrop-blur sm:left-auto sm:right-8 sm:max-w-xs">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent">
                  <CalendarCheck2 size={18} />
                </span>
                <div>
                  <p className="font-display text-xl leading-tight">Your next slot is a few clicks away</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink/55">
                    Live availability, instant reference and a clear returning-client lookup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">The gallery</p>
            <h2 className="text-4xl sm:text-5xl">A study in softness.</h2>
          </div>
          <p className="max-w-sm text-sm text-ink/60">
            Sample imagery shows the mood of the brand. Final photography should be approved by Mina.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {GALLERY.map((item, index) => (
            <figure key={item.caption} className={`overflow-hidden rounded-3xl border border-ink/10 ${index === 1 ? 'md:mt-10' : ''}`}>
              <div className="aspect-[4/5] overflow-hidden bg-sand/20">
                <ImageWithFallback
                  src={item.src}
                  alt={`${item.caption} lash gallery sample`}
                  className="h-full w-full transition duration-700 hover:scale-105"
                />
              </div>
              <figcaption className="flex items-center justify-between px-5 py-4 text-xs uppercase tracking-wider text-ink/60">
                {item.caption} <span>0{index + 1}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white/50">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow mb-3">Sample menu</p>
              <h2 className="text-4xl sm:text-5xl">Choose your lash language.</h2>
            </div>
            <Link to="/services" className="btn-outline">
              Compare all services <ArrowRight size={16} />
            </Link>
          </div>
          {loading ? <Spinner label="Loading sample services…" className="py-12" /> : null}
          {error ? <Alert variant="error" title="Services unavailable">{error}</Alert> : null}
          {!loading && !error ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 3).map((service) => (
                <ServiceCard key={service.id} service={service} compact />
              ))}
            </div>
          ) : null}
          <p className="mt-6 text-xs text-ink/45">
            Prices and durations shown are demonstration examples, not confirmed business information.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="eyebrow mb-3">Why Mina Minks</p>
        <h2 className="max-w-2xl text-4xl sm:text-5xl">Considered from first look to aftercare.</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Sparkles,
              title: 'Guided choice',
              body: 'A short, explainable style finder helps first-time clients compare sample options without external AI.',
            },
            {
              icon: ShieldCheck,
              title: 'Protected booking',
              body: 'Server-side checks and database locking stop two clients from reserving overlapping appointment times.',
            },
            {
              icon: Heart,
              title: 'Return made easy',
              body: 'Booking references, verified lookup and clearly labelled sample aftercare keep the journey connected.',
            },
          ].map((item) => (
            <article key={item.title} className="border-t border-ink pt-6">
              <item.icon size={24} strokeWidth={1.5} />
              <h3 className="mt-5 text-2xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/60">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-accent">Ready when you are</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Book the look, keep the calm.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/60">
              Pick a sample service, choose a live slot and receive a booking reference instantly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="btn-accent">
              Start booking <ArrowRight size={16} />
            </Link>
            <Link to="/aftercare" className="inline-flex items-center rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold transition hover:border-accent hover:text-accent">
              Read sample aftercare
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
