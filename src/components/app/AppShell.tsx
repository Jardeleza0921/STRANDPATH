import React, { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ClipboardListIcon,
  CompassIcon,
  HomeIcon,
  LayersIcon,
  RouteIcon,
  SettingsIcon,
  SmartphoneIcon } from
'lucide-react';
import { Logo } from '../ui/Logo';

const nav = [
{ to: '/app', label: 'Dashboard', icon: HomeIcon, end: true },
{ to: '/app/assessment/intro', label: 'Assessment', icon: ClipboardListIcon },
{ to: '/app/results', label: 'My results', icon: CompassIcon },
{ to: '/app/strands/ict', label: 'Strands', icon: LayersIcon },
{ to: '/app/pathways', label: 'Pathways', icon: RouteIcon }];


export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-full w-full bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <Link to="/" className="px-2" aria-label="StrandPath home">
          <Logo size={26} />
        </Link>

        <nav aria-label="Application" className="mt-8 flex-1 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) =>
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
            [
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm',
            'transition-[background-color,color] duration-150 ease-out',
            isActive ? 'bg-brand-soft font-medium text-brand-dark' : 'text-muted hover:bg-canvas hover:text-ink'].
            join(' ')
            }>
            
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          )}
        </nav>

        <div className="space-y-1 border-t border-line pt-4">
          <Link
            to="/mobile"
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink">
            
            <SmartphoneIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            Mobile app
          </Link>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted transition-colors duration-150 ease-out hover:bg-canvas hover:text-ink">
            
            <SettingsIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            Settings
          </button>
          <div className="mt-3 flex items-center gap-3 rounded-md bg-canvas px-3 py-3">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[13px] font-medium text-white"
              aria-hidden="true">
              
              MR
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">Maria Reyes</p>
              <p className="truncate text-[12px] text-faint">Grade 10 · Section B</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>);

}