import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/strands', label: 'Explore strands' },
  { to: '/careers', label: 'Careers' },
  { to: '/methodology', label: 'Methodology' },
  { to: '/about', label: 'About' }
];

export function SiteHeader() {
  const { user, loading } = useAuth();
  const home = user?.role === 'admin' || user?.role === 'guidance' ? '/admin' : '/app';

  return (
    <header className="sp-panel sticky top-0 z-30 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex h-[72px] max-w-content items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to="/"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-4 focus-visible:ring-offset-panel"
          aria-label="StrandPath home"
        >
          <Logo inverted />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                [
                  'rounded px-3 py-2 text-[13px] transition-colors duration-150',
                  isActive ? 'bg-white/10 font-medium text-panel-ink' : 'text-panel-muted hover:text-panel-ink'
                ].join(' ')
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeSwitcher onDark />
          </div>
          {loading ? null : user ? (
            <Button to={home} size="sm">
              {user.role === 'student' ? 'My dashboard' : 'Admin area'}
            </Button>
          ) : (
            <>
              <Button to="/login" variant="secondary" size="sm">
                Sign in
              </Button>
              <Button to="/register" size="sm">
                Start exploring
              </Button>
            </>
          )}
        </div>
      </div>

      <nav aria-label="Main mobile" className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 lg:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              [
                'whitespace-nowrap rounded px-3 py-1.5 text-[12.5px]',
                isActive ? 'bg-white/10 font-medium text-panel-ink' : 'text-panel-muted'
              ].join(' ')
            }
          >
            {link.label}
          </NavLink>
        ))}
        <div className="ml-auto shrink-0 pl-2 sm:hidden">
          <ThemeSwitcher onDark />
        </div>
      </nav>
    </header>
  );
}
