import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import BrandMark from './BrandMark';
import { publicBusiness } from '../content/publicInfo';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ink/10 bg-ink text-cream">
      <div className="page-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:py-16">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark light compact />
            <span className="font-display text-2xl leading-none">Mina Minks</span>
          </div>
          <p className="mt-5 max-w-xs font-display text-sm italic leading-relaxed text-cream/75">
            “{publicBusiness.tagline}”
          </p>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-cream/50">
            Independent booking prototype. Lash services booked here use sample data.
          </p>
        </div>

        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-editorial text-cream/45">Explore</p>
          <div className="flex flex-col gap-3 text-sm text-cream/70">
            <Link to="/services" className="transition hover:text-accent">Sample services</Link>
            <Link to="/recommend" className="transition hover:text-accent">Style finder</Link>
            <Link to="/book" className="transition hover:text-accent">Book an appointment</Link>
            <Link to="/aftercare" className="transition hover:text-accent">Aftercare</Link>
          </div>
        </div>

        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-editorial text-cream/45">Your booking</p>
          <div className="flex flex-col gap-3 text-sm text-cream/70">
            <Link to="/lookup" className="transition hover:text-accent">Find a booking</Link>
            <Link to="/book" className="transition hover:text-accent">Make another booking</Link>
            <Link to="/admin" className="inline-flex items-center gap-1.5 transition hover:text-accent">
              Staff sign-in <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-editorial text-cream/45">Public contact</p>
          <div className="flex flex-col gap-2.5 text-sm text-cream/70">
            <a href={publicBusiness.phoneHref} className="transition hover:text-accent">Phone · {publicBusiness.phoneLabel}</a>
            <a href={`mailto:${publicBusiness.email}`} className="transition hover:text-accent">Email · {publicBusiness.email}</a>
            <a href={publicBusiness.whatsappUrl} target="_blank" rel="noreferrer" className="transition hover:text-accent">WhatsApp</a>
            <a href={publicBusiness.instagramUrl} target="_blank" rel="noreferrer" className="transition hover:text-accent">Instagram · @mina.minkss</a>
            <a href={publicBusiness.snapchatUrl} target="_blank" rel="noreferrer" className="transition hover:text-accent">Snapchat</a>
            <a href={publicBusiness.mapUrl} target="_blank" rel="noreferrer" className="transition hover:text-accent">Find the studio · {publicBusiness.location}</a>
          </div>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="page-shell flex flex-wrap items-center justify-between gap-3 py-5 text-xs text-cream/45">
          <p>© {new Date().getFullYear()} Mina Minks demo. Independent prototype, not the live business.</p>
          <p>Public contact details from minaminks.com · booking prices, hours and aftercare are samples.</p>
        </div>
      </div>
    </footer>
  );
}
