import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import BrandMark from './BrandMark';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services', end: false },
  { to: '/recommend', label: 'Find your style', end: false },
  { to: '/aftercare', label: 'Aftercare', end: false },
  { to: '/lookup', label: 'My booking', end: false },
];

export default function Navbar() {
  const [open, setOpen] = useState<boolean>(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur-sm">
      <div className="page-shell flex h-[76px] items-center justify-between gap-6">
        <Link to="/" className="group flex items-center gap-3" aria-label="Mina Minks home">
          <BrandMark compact />
          <span className="font-display text-2xl leading-none tracking-tight sm:text-[1.7rem]">Mina Minks</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `relative py-2 text-[11px] font-semibold uppercase tracking-editorial transition duration-200 ${
                  isActive ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  <span
                    aria-hidden="true"
                    className={`absolute inset-x-0 -bottom-0.5 h-px origin-left bg-ink transition-transform duration-200 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/book" className="btn-primary hidden px-5 py-2.5 sm:inline-flex">
            Book now <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/15 text-ink transition hover:border-ink lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((current: boolean) => !current)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-navigation"
          className="animate-fade-up border-t border-ink/10 bg-ivory px-5 pb-7 pt-4 lg:hidden"
          aria-label="Mobile navigation"
        >
          <div className="flex flex-col divide-y divide-ink/10">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `py-3.5 text-sm font-semibold uppercase tracking-wider ${isActive ? 'text-ink' : 'text-ink-muted'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          <Link to="/book" className="btn-primary mt-5 w-full" onClick={() => setOpen(false)}>
            Book now <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
