import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3Icon,
  ClipboardListIcon,
  CompassIcon,
  FlagIcon,
  HistoryIcon,
  HomeIcon,
  LayersIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MailWarningIcon,
  MenuIcon,
  MessageCircleIcon,
  RouteIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  XIcon
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

const nav = [
  { to: '/app', label: 'Home', icon: HomeIcon, end: true },
  { to: '/app/assessment', label: "Let's Get Started", icon: ClipboardListIcon },
  { to: '/app/results', label: 'Your Suggested Strands', icon: CompassIcon },
  { to: '/app/development', label: 'My Development Journey', icon: FlagIcon },
  { to: '/app/program', label: 'My Improvement Plan', icon: SparklesIcon },
  { to: '/app/strands', label: 'Explore Strands', icon: LayersIcon },
  { to: '/app/pathways', label: 'Explore Your Future', icon: RouteIcon },
  { to: '/app/progress', label: 'Track My Progress', icon: BarChart3Icon },
  { to: '/app/history', label: 'My Previous Assessments', icon: HistoryIcon },
  { to: '/app/assistance', label: 'Strand Assistance', icon: MessageCircleIcon },
  { to: '/app/support', label: 'Get Help', icon: LifeBuoyIcon }
];

const account = [
  { to: '/app/profile', label: 'My Profile', icon: UserIcon },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon }
];

export function AppShell() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
  }, [pathname]);

  // While the drawer is open: lock page scroll, close on Escape, and move focus
  // into the drawer. Focus returns to the single menu button on close.
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link to="/app" className="px-2" aria-label="StrandPath dashboard" onClick={close}>
        <Logo size={26} inverted />
      </Link>
      <div className="mt-4 px-2">
        <ThemeSwitcher onDark />
      </div>
      <nav aria-label="Student application" className="mt-5 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={close}
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
        {account.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={close}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-all duration-150',
                isActive
                  ? 'bg-white/10 font-semibold text-panel-ink'
                  : 'text-panel-muted hover:bg-white/5 hover:text-panel-ink'
              ].join(' ')
            }
          >
            <Icon className="h-[17px] w-[17px]" aria-hidden />
            {label}
          </NavLink>
        ))}
        {(user?.role === 'admin' || user?.role === 'guidance') && (
          <Link
            to="/admin"
            onClick={close}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-panel-ink hover:bg-white/5"
          >
            <BarChart3Icon className="h-[17px] w-[17px]" aria-hidden />
            Admin area
          </Link>
        )}
        <button
          type="button"
          onClick={async () => {
            close();
            await logout();
            navigate('/login');
          }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] text-panel-muted hover:bg-white/5 hover:text-panel-ink"
        >
          <LogOutIcon className="h-[17px] w-[17px]" aria-hidden />
          Sign out
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-md bg-white/10 px-3 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-[12px] font-medium text-panel-ink" aria-hidden>
          {user?.name?.slice(0, 2).toUpperCase() ?? 'SP'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-panel-ink">{user?.name}</p>
          <p className="truncate text-[11px] text-panel-muted">Student account</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-canvas">
      <aside className="sp-panel sticky top-0 hidden h-screen w-[258px] shrink-0 rounded-none border-y-0 border-l-0 px-4 py-5 lg:block">
        {sidebar}
      </aside>

      {/* One overlay and one panel, rendered once. The header stays above both so
          its single button can always close the drawer again. */}
      {open && (
        <div
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Main navigation"
          className="fixed inset-0 z-40 lg:hidden"
        >
          <button
            type="button"
            aria-label="Close navigation"
            tabIndex={-1}
            className="absolute inset-0 h-full w-full cursor-default bg-ink/60 backdrop-blur-sm"
            onClick={close}
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="sp-panel absolute inset-y-0 left-0 w-[280px] max-w-[85vw] overflow-y-auto rounded-none p-4 outline-none"
          >
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sp-panel sticky top-0 z-50 flex h-14 items-center justify-between gap-3 rounded-none border-x-0 border-t-0 px-3 sm:px-4 lg:hidden">
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close navigation' : 'Open navigation'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-panel-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            {open ? <XIcon className="h-4 w-4" aria-hidden /> : <MenuIcon className="h-4 w-4" aria-hidden />}
          </button>
          <Link to="/app" aria-label="StrandPath dashboard" onClick={close} className="min-w-0">
            <Logo size={24} inverted />
          </Link>
          <span aria-hidden className="h-9 w-9 shrink-0" />
        </header>

        {user && !user.emailVerified && (
          <div className="border-b border-warn/25 bg-warn-soft px-4 py-2.5 text-[12.5px] text-warn sm:px-6">
            <Link to="/verify-email" className="inline-flex items-center gap-2 font-medium hover:underline">
              <MailWarningIcon className="h-4 w-4" aria-hidden />
              Confirm your email address to keep password recovery working. Open confirmation →
            </Link>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <div className="sp-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
