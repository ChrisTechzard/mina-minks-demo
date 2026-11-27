import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/recommend', label: 'Find your style' },
  { to: '/aftercare', label: 'Aftercare' },
  { to: '/lookup', label: 'My booking' },
];

export default function Navbar() {
  const [open, setOpen] = useState<boolean>(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-ink text-xs font-bold tracking-widest">
            MM
          </span>
          <span className="font-display text-2xl leading-none tracking-wide">Mina Minks</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `text-xs font-semibold uppercase tracking-wider transition hover:text-ink ${
                  isActive ? 'text-ink' : 'text-ink/55'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/book" className="btn-primary hidden px-5 py-2.5 sm:inline-flex">
            Book appointment
          </Link>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/20 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((current: boolean) => !current)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-ink/10 bg-cream px-5 py-4 md:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
                className={`text-sm font-semibold uppercase tracking-wider ${
                  location.pathname === link.to ? 'text-ink' : 'text-ink/60'
                }`}
              >
                {link.label}
              </NavLink>
            ))}
            <Link to="/book" className="btn-primary mt-2" onClick={() => setOpen(false)}>
              Book appointment
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
