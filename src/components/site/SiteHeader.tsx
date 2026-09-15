import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

const links = [
  { to: '/landing', label: 'Home' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/strands', label: 'Explore strands' },
  { to: '/about', label: 'About' },
  { to: '/mobile', label: 'Mobile Prototype' }
];


export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-[72px] max-w-content items-center justify-between gap-6 px-6">
        <Link
          to="/"
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
          aria-label="StrandPath home">
          
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) =>
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
            [
            'rounded px-3 py-2 text-sm transition-colors duration-150 ease-out',
            isActive ? 'text-ink font-medium' : 'text-muted hover:text-ink'].
            join(' ')
            }>
            
              {l.label}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Button to="/app" variant="secondary" size="sm">
            Sign in
          </Button>
          <Button to="/app" size="sm">
            Start exploring
          </Button>
        </div>
      </div>
    </header>);

}
