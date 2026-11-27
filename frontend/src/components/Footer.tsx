import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-cream/50 text-xs font-bold tracking-widest">
              MM
            </span>
            <span className="font-display text-2xl">Mina Minks</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
            A premium lash booking experience. This site is a competition prototype using
            clearly labelled sample services, prices and policies.
          </p>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-editorial text-cream/50">Explore</p>
          <div className="flex flex-col gap-2 text-sm text-cream/70">
            <Link to="/services" className="hover:text-accent">Sample services</Link>
            <Link to="/recommend" className="hover:text-accent">Style finder</Link>
            <Link to="/book" className="hover:text-accent">Book an appointment</Link>
            <Link to="/aftercare" className="hover:text-accent">Aftercare</Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-editorial text-cream/50">Returning clients</p>
          <div className="flex flex-col gap-2 text-sm text-cream/70">
            <Link to="/lookup" className="hover:text-accent">Find a booking</Link>
            <Link to="/lookup" className="hover:text-accent">Rebook</Link>
            <Link to="/admin" className="hover:text-accent">Mina admin sign-in</Link>
          </div>
        </div>

        <div>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-editorial text-cream/50">Contact placeholders</p>
          <p className="text-sm text-cream/70">Accra, Ghana — demo location</p>
          <p className="text-sm text-cream/70">hello@example.com</p>
          <p className="text-sm text-cream/70">+233 000 000 000</p>
          <p className="mt-3 text-xs text-cream/40">Replace all contact details before launch.</p>
        </div>
      </div>
      <div className="border-t border-cream/10 px-5 py-5 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} Mina Minks demo. Not a live business. Prices, hours and guidance are samples.
        <Link to="/admin" className="ml-2 inline-flex items-center gap-1 text-cream/60 hover:text-accent">
          Staff <ArrowUpRight size={12} />
        </Link>
      </div>
    </footer>
  );
}
