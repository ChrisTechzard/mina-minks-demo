import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, LayoutDashboard, LogOut, Settings2 } from 'lucide-react';
import AdminLogin from '../components/admin/AdminLogin';
import AdminOverview from '../components/admin/AdminOverview';
import AdminBookingsPanel from '../components/admin/AdminBookingsPanel';
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel';
import BrandMark from '../components/BrandMark';
import DemoBadge from '../components/DemoBadge';
import Spinner from '../components/Spinner';
import { useAdminSession } from '../hooks/useAdminSession';
import { ApiError, api } from '../services/api';
import type { Dashboard } from '../types';

type Tab = 'overview' | 'bookings' | 'settings';

const TABS: Array<{ key: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'bookings', label: 'Appointments', icon: CalendarClock },
  { key: 'settings', label: 'Studio setup', icon: Settings2 },
];

export default function AdminPage() {
  const { token, identity, verifying, sessionExpired, signIn, signOut, acknowledgeExpiry } = useAdminSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab: Tab = requestedTab === 'bookings' || requestedTab === 'settings' ? requestedTab : 'overview';
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState<boolean>(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    if (!token) return;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      setDashboard(await api.admin.dashboard(token));
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) return;
      setDashboardError(caught instanceof Error ? caught.message : 'Unable to load the overview.');
    } finally {
      setDashboardLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void loadDashboard();
  }, [token, loadDashboard]);

  const selectTab = (next: Tab): void => {
    setSearchParams(next === 'overview' ? {} : { tab: next });
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner label="Verifying admin session…" />
      </div>
    );
  }

  if (!token) {
    return (
      <AdminLogin
        onSignIn={signIn}
        sessionExpired={sessionExpired}
        onAcknowledgeExpiry={acknowledgeExpiry}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-cream/10 bg-ink p-7 text-cream lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark light compact />
            <div>
              <p className="font-display text-xl leading-none">Mina Minks</p>
              <p className="mt-1 text-[10px] uppercase tracking-editorial text-accent">Studio workspace</p>
            </div>
          </div>

          <nav className="mt-12 space-y-2" aria-label="Admin sections">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                aria-current={tab === item.key ? 'page' : undefined}
                onClick={() => selectTab(item.key)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition duration-200 ${
                  tab === item.key ? 'bg-accent text-ink' : 'text-cream/60 hover:bg-cream/5 hover:text-cream'
                }`}
              >
                <item.icon size={17} aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-5">
            <DemoBadge className="border-cream/20 bg-cream/5 text-cream/60" />
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cream/60 transition hover:text-accent">
              <ArrowLeft size={14} aria-hidden="true" /> View public site
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="border-b border-ink/10 bg-ivory/70">
            <div className="px-5 py-6 sm:px-8 lg:px-10">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <div className="mb-3 flex items-center gap-3 lg:hidden">
                    <BrandMark compact />
                    <span className="font-display text-lg">Mina Minks</span>
                  </div>
                  <p className="eyebrow mb-2">Studio workspace</p>
                  <h1 className="text-4xl leading-tight sm:text-5xl">Dashboard.</h1>
                  <p className="mt-2 text-sm text-ink-muted">
                    Signed in as {identity?.email ?? 'admin'} · prototype session
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/" className="btn-outline hidden px-4 py-2.5 text-xs sm:inline-flex">
                    <ArrowLeft size={14} aria-hidden="true" /> View site
                  </Link>
                  <button type="button" className="btn-outline px-4 py-2.5 text-xs" onClick={() => void signOut()}>
                    <LogOut size={14} aria-hidden="true" /> Sign out
                  </button>
                </div>
              </div>

              <nav className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden" aria-label="Admin sections">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={tab === item.key ? 'page' : undefined}
                    onClick={() => selectTab(item.key)}
                    className={`inline-flex min-h-[42px] shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                      tab === item.key ? 'bg-ink text-cream' : 'border border-ink/15 text-ink-muted'
                    }`}
                  >
                    <item.icon size={14} aria-hidden="true" /> {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </header>

          <main id="main-content" className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10" tabIndex={-1}>
            {tab === 'overview' ? (
              <AdminOverview data={dashboard} loading={dashboardLoading} error={dashboardError} onRefresh={() => void loadDashboard()} />
            ) : null}
            {tab === 'bookings' && token ? (
              <AdminBookingsPanel token={token} onChanged={() => void loadDashboard()} />
            ) : null}
            {tab === 'settings' && token ? <AdminSettingsPanel token={token} /> : null}
          </main>
        </div>
      </div>
    </div>
  );
}
