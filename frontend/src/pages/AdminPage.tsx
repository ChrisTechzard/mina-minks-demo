import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarClock, LayoutDashboard, LogOut, Settings2 } from 'lucide-react';
import AdminLogin from '../components/admin/AdminLogin';
import AdminOverview from '../components/admin/AdminOverview';
import AdminBookingsPanel from '../components/admin/AdminBookingsPanel';
import AdminSettingsPanel from '../components/admin/AdminSettingsPanel';
import DemoBadge from '../components/DemoBadge';
import Spinner from '../components/Spinner';
import { useAdminSession } from '../hooks/useAdminSession';
import { api } from '../services/api';
import type { Dashboard } from '../types';

type Tab = 'overview' | 'bookings' | 'settings';

const TABS: Array<{ key: Tab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'bookings', label: 'Bookings', icon: CalendarClock },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

export default function AdminPage() {
  const { token, identity, verifying, signIn, signOut } = useAdminSession();
  const [tab, setTab] = useState<Tab>('overview');
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
      setDashboardError(caught instanceof Error ? caught.message : 'Unable to load the overview.');
    } finally {
      setDashboardLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) void loadDashboard();
  }, [token, loadDashboard]);

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-cream">
        <Spinner label="Verifying admin session…" className="text-cream/60" />
      </div>
    );
  }

  if (!token) return <AdminLogin onSignIn={signIn} />;

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-cream/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-cream/50 text-xs font-bold tracking-widest">MM</span>
            <div>
              <p className="font-display text-2xl leading-none">Mina Minks</p>
              <p className="mt-1 text-[11px] uppercase tracking-editorial text-accent">Admin workspace</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DemoBadge className="border-cream/20 bg-white/5 text-cream/60" />
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cream/55 hover:text-accent">
              <ArrowLeft size={14} /> View site
            </Link>
            <button type="button" className="btn-outline border-cream/25 px-4 py-2 text-xs text-cream" onClick={() => void signOut()}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cream/10 pb-6">
          <div>
            <h1 className="text-4xl sm:text-5xl">Studio dashboard.</h1>
            <p className="mt-2 text-sm text-cream/50">
              Signed in as {identity?.email ?? 'admin'} · prototype session
            </p>
          </div>
          <nav className="flex flex-wrap gap-2" aria-label="Admin sections">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                  tab === item.key ? 'bg-accent text-ink' : 'border border-cream/20 text-cream/60 hover:border-accent hover:text-accent'
                }`}
              >
                <item.icon size={14} /> {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-8">
          {tab === 'overview' ? (
            <AdminOverview data={dashboard} loading={dashboardLoading} error={dashboardError} onRefresh={() => void loadDashboard()} />
          ) : null}
          {tab === 'bookings' && token ? (
            <AdminBookingsPanel token={token} onChanged={() => void loadDashboard()} />
          ) : null}
          {tab === 'settings' && token ? <AdminSettingsPanel token={token} /> : null}
        </div>
      </div>
    </div>
  );
}
