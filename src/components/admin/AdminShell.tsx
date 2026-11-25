import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ActivityIcon,
  BarChart3Icon,
  ClipboardListIcon,
  FileClockIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  UsersIcon,
  XIcon
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

const nav = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboardIcon, end: true },
  { to: '/admin/students', label: 'Students', icon: UsersIcon },
  { to: '/admin/questionnaire', label: 'Questionnaire', icon: ClipboardListIcon, adminOnly: true },
  { to: '/admin/strands', label: 'Strands', icon: FileClockIcon, adminOnly: true },
  { to: '/admin/activities', label: 'Activities', icon: ActivityIcon, adminOnly: true },
  { to: '/admin/tickets', label: 'Support requests', icon: LifeBuoyIcon },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3Icon, adminOnly: true },
  { to: '/admin/settings', label: 'AI & system settings', icon: SettingsIcon, adminOnly: true },
  { to: '/admin/logs', label: 'Activity log', icon: FileClockIcon, adminOnly: true }
];

export function AdminShell() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
  }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/admin" className="px-2" aria-label="STRANDPATH administration">
        <Logo size={26} inverted />
      </Link>
      <p className="mt-3 px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-panel-muted">Administration</p>
      <div className="mt-3 px-2">
        <ThemeSwitcher onDark />
      </div>
      <nav aria-label="Administration" className="mt-4 flex-1 space-y-0.5">
        {nav
          .filter((item) => !item.adminOnly || user?.role === 'admin')
          .map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-all duration-150',
                  isActive
                    ? 'bg-white/10 font-semibold text-panel-ink shadow-[inset_0_1px_0_rgba(255,255,255,.12)]'
                    : 'text-panel-muted hover:bg-white/5 hover:text-panel-ink'
                ].join(' ')
              }
            >
              <Icon className="h-[17px] w-[17px]" aria-hidden />
              {label}
            </NavLink>
          ))}
      </nav>
      <div className="mt-3 border-t border-white/10 pt-3">
        <Link
          to="/app"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-panel-muted hover:bg-white/5 hover:text-panel-ink"
        >
          Student view
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] text-panel-muted hover:bg-white/5 hover:text-panel-ink"
        >
          <LogOutIcon className="h-[17px] w-[17px]" aria-hidden />
          Sign out
        </button>
      </div>
      <div className="mt-3 rounded-md bg-white/10 px-3 py-3">
        <p className="truncate text-[13px] font-medium text-panel-ink">{user?.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-panel-muted">
          {user?.role === 'admin' ? 'Administrator' : 'Guidance reviewer'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <aside className="sp-panel sticky top-0 hidden h-screen w-[258px] shrink-0 rounded-none border-y-0 border-l-0 px-4 py-5 lg:block">
        {sidebar}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="sp-panel absolute left-0 top-0 h-full w-[280px] rounded-none p-4">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sp-panel sticky top-0 z-30 flex h-14 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/10 text-panel-ink"
            aria-label="Open navigation"
          >
            <MenuIcon className="h-4 w-4" aria-hidden />
          </button>
          <Logo size={24} inverted />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-white/10 text-panel-muted"
            aria-label="Toggle navigation"
          >
            {open ? <XIcon className="h-4 w-4" aria-hidden /> : <MenuIcon className="h-4 w-4" aria-hidden />}
          </button>
        </header>
        <main className="min-w-0 flex-1">
          <div className="sp-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
