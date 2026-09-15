import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

const columns = [
{
  title: 'Platform',
  links: [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Explore strands', to: '/strands' },
  { label: 'Start exploring', to: '/app' }]

},
{
  title: 'Strands',
  links: [
  { label: 'STEM', to: '/strands/stem' },
  { label: 'ABM', to: '/strands/abm' },
  { label: 'HUMSS', to: '/strands/humss' },
  { label: 'TVL – ICT', to: '/strands/ict' }]

},
{
  title: 'About',
  links: [
  { label: 'About StrandPath', to: '/about' },
  { label: 'Guidance philosophy', to: '/about#philosophy' },
  { label: 'Prototype map', to: '/cover' }]

}];


export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-content px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A guidance tool for Senior High School students exploring strands and possible pathways.
            </p>
          </div>
          {columns.map((col) =>
          <div key={col.title}>
              <h2 className="text-[13px] font-semibold text-ink">{col.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) =>
              <li key={l.label}>
                    <Link
                  to={l.to}
                  className="rounded text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
                  
                      {l.label}
                    </Link>
                  </li>
              )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line pt-6 text-[13px] text-faint md:flex-row md:items-center md:justify-between">
          <p>© 2026 StrandPath. An educational guidance concept.</p>
          <p>StrandPath offers guidance, not decisions.</p>
        </div>
      </div>
    </footer>);

}