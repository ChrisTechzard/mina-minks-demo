import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, Sparkles } from 'lucide-react';
import ImageWithFallback from '../components/ImageWithFallback';
import ServiceCard from '../components/ServiceCard';
import DemoBadge from '../components/DemoBadge';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import EmptyState from '../components/ui/EmptyState';
import SectionHeading from '../components/ui/SectionHeading';
import { useServices } from '../hooks/useServices';
import { publicBusiness } from '../content/publicInfo';

const GALLERY = [
  {
    src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900&q=85',
    caption: 'Soft definition',
  },
  {
    src: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=900&q=85',
    caption: 'Everyday elegance',
  },
  {
    src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=900&q=85',
    caption: 'Statement volume',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Choose your service',
    body: 'Compare sample styles, durations and prices before you commit to a time.',
    to: '/services',
    cta: 'View the menu',
  },
  {
    number: '02',
    title: 'Pick a live slot',
    body: 'Availability comes from configured demo hours and is checked again when you confirm.',
    to: '/book',
    cta: 'Start booking',
  },
  {
    number: '03',
    title: 'Keep your reference',
    body: 'Use your booking reference with your email or phone to find the appointment again.',
    to: '/lookup',
    cta: 'Find a booking',
  },
];

export default function HomePage() {
  const { services, loading, error, reload } = useServices();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-ink/10 bg-cream">
        <div className="page-shell grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
          <div className="animate-fade-up">
            <div className="mb-7 flex flex-wrap items-center gap-3">
              <span className="eyebrow">Lash atelier · {publicBusiness.location}</span>
              <DemoBadge />
            </div>
            <h1 className="max-w-2xl text-[3.25rem] leading-[0.98] sm:text-6xl lg:text-[5.4rem]">
              Lashes that feel like you,
              <span className="mt-1 block font-normal italic text-accent-deep">only softer.</span>
            </h1>
            <p className="mt-6 max-w-xl font-display text-lg italic leading-snug text-ink-soft sm:text-xl">
              “{publicBusiness.tagline}”
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Explore a considered sample menu, compare clear prices and reserve a time that fits
              your day. Every service, hour and policy used for booking here is demonstration data.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/book" className="btn-primary">
                Book an appointment <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/services" className="btn-outline">
                View the sample menu
              </Link>
            </div>
            <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 border-t border-ink/10 pt-6 sm:grid-cols-4">
              {[
                ['Menu', 'Sample services'],
                ['Pricing', 'Shown in GHS'],
                ['Timezone', 'Africa/Accra'],
                ['Payment', 'Not collected'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">{label}</dt>
                  <dd className="mt-1 text-xs font-semibold text-ink-soft">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative animate-fade-up [animation-delay:100ms]">
            <figure className="aspect-[4/5] overflow-hidden rounded-5xl border border-champagne/60 bg-sand/30">
              <ImageWithFallback
                src={`${import.meta.env.BASE_URL}mina-studio.jpg`}
                alt="Studio photograph supplied with the Mina Minks demo brief"
                className="h-full w-full"
                eager
              />
            </figure>
            <p className="mt-3 text-right text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
              Provided studio photograph · pending approval
            </p>
            <div className="absolute -bottom-6 left-3 right-3 rounded-3xl border border-champagne/60 bg-ivory p-5 shadow-soft sm:left-auto sm:right-6 sm:max-w-xs">
              <div className="flex items-start gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent">
                  <CalendarDays size={18} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-display text-xl leading-tight">A clear path to your slot</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                    Service, time and cost stay visible at every step of booking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell section-shell">
        <SectionHeading
          eyebrow="The gallery"
          title="A study in softness."
          description="Sample imagery sets the mood of the brand. Final photography should be approved by Mina before launch."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {GALLERY.map((item, index) => (
            <figure key={item.caption} className={`group ${index === 1 ? 'md:mt-12' : ''}`}>
              <div className="aspect-[4/5] overflow-hidden rounded-4xl border border-ink/10 bg-sand/25">
                <ImageWithFallback
                  src={item.src}
                  alt={`${item.caption} lash gallery sample`}
                  className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <figcaption className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-editorial text-ink-muted">
                {item.caption} <span>0{index + 1}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-blush/35">
        <div className="page-shell section-shell">
          <SectionHeading
            eyebrow="Sample menu"
            title="Choose your lash language."
            description="A small, configurable menu makes it easy to understand what is being booked and what it costs."
            action={<Link to="/services" className="btn-outline">Compare all services <ArrowUpRight size={15} aria-hidden="true" /></Link>}
          />
          {loading ? <Spinner label="Loading sample services…" className="py-14" /> : null}
          {error ? (
            <div className="mt-8 max-w-xl space-y-4">
              <Alert variant="error" title="Services unavailable">{error}</Alert>
              <button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>
            </div>
          ) : null}
          {!loading && !error && services.length === 0 ? (
            <EmptyState
              className="mt-10"
              title="No sample services yet."
              description="The menu will appear here once the studio configures its services."
            />
          ) : null}
          {!loading && !error && services.length > 0 ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 3).map((service) => (
                <ServiceCard key={service.id} service={service} compact />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="page-shell section-shell">
        <SectionHeading
          eyebrow="The booking journey"
          title="Three steps, no guesswork."
          description="The flow is designed to keep the current choice, the price and the next action in view."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.number} className="border-t border-ink pt-6">
              <p className="font-mono text-xs text-accent-deep">{step.number}</p>
              <h3 className="mt-5 text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              <Link to={step.to} className="link-arrow mt-6">
                {step.cta} <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell pb-16 sm:pb-20">
        <div className="grid overflow-hidden rounded-5xl border border-ink/10 bg-ivory lg:grid-cols-[1fr_0.85fr]">
          <div className="p-8 sm:p-12">
            <p className="eyebrow mb-4">Style finder</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">Not sure where to begin?</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-muted">
              Answer four quick questions and compare an explainable sample suggestion. You can
              always override it and continue straight to booking.
            </p>
            <Link to="/recommend" className="btn-primary mt-8">
              Find your style <Sparkles size={16} aria-hidden="true" />
            </Link>
          </div>
          <div className="relative min-h-[280px] bg-sand/25">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=85"
              alt="Calm beauty treatment sample photograph"
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-champagne/45 bg-blush/25">
        <div className="page-shell py-14 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="max-w-2xl">
              <p className="eyebrow text-accent-deep">Public studio details</p>
              <h2 className="mt-3 text-3xl leading-tight sm:text-4xl">Find Mina Minks.</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Published contact details from minaminks.com. This demo is independent and does not
                book through the live studio.
              </p>
            </div>
            <a
              href={publicBusiness.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              View public site <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
          <dl className="mt-9 grid gap-x-10 gap-y-5 border-t border-champagne/45 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: 'Founder', value: publicBusiness.founder, href: '' },
              { label: 'Studio', value: publicBusiness.location, href: publicBusiness.mapUrl },
              { label: 'Phone', value: publicBusiness.phoneLabel, href: publicBusiness.phoneHref },
              { label: 'Email', value: publicBusiness.email, href: `mailto:${publicBusiness.email}` },
              { label: 'WhatsApp', value: 'Message the studio', href: publicBusiness.whatsappUrl },
              { label: 'Social', value: '@mina.minkss', href: publicBusiness.instagramUrl },
              { label: 'Snapchat', value: 'Open Snapchat link', href: publicBusiness.snapchatUrl },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">{item.label}</dt>
                <dd className="mt-1.5 text-sm font-semibold text-ink-soft">
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                      className="transition hover:text-accent-deep"
                    >
                      {item.value}
                    </a>
                  ) : (
                    item.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-ink text-cream">
        <div className="page-shell flex flex-wrap items-end justify-between gap-8 py-14 sm:py-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-editorial text-accent">Ready when you are</p>
            <h2 className="mt-4 text-4xl sm:text-5xl">Book the look, keep the calm.</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/60">
              Choose a sample service, select a live slot and receive a reference on the next screen.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/book" className="btn-accent">
              Start booking <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to="/aftercare" className="btn-outline-light">Read sample aftercare</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
