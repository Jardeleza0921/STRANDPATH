import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { PathwayMap } from '../../components/PathwayMap';
import { getPathway, pathways } from '../../data/pathways';

export function Pathways() {
  const [params, setParams] = useSearchParams();
  const active = params.get('strand') ?? 'ict';
  const pathway = getPathway(active);

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10">
      <Link
        to="/app/results"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
        
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to results
      </Link>

      <header className="mt-5 border-b border-line pb-8">
        <h1 className="text-[36px] font-semibold leading-tight tracking-[-0.03em] text-ink">Pathway exploration</h1>
        <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
          Follow a strand toward the college fields it commonly leads to, and the career areas connected to each
          field. These are possible pathways, not guaranteed outcomes — students often move between them.
        </p>
      </header>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Choose a strand pathway">
        {pathways.map((p) => {
          const selected = p.slug === pathway.slug;
          return (
            <button
              key={p.slug}
              role="tab"
              aria-selected={selected}
              onClick={() => setParams({ strand: p.slug })}
              className={[
              'rounded-full border px-4 py-2 text-[13px] font-medium',
              'transition-[background-color,border-color,color] duration-150 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
              selected ?
              'border-ink bg-ink text-white' :
              'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'].
              join(' ')}>
              
              {p.strand}
            </button>);

        })}
      </div>

      <p className="mt-8 text-[15px] text-muted">{pathway.strandName}</p>

      <div className="mt-6">
        <PathwayMap pathway={pathway} />
      </div>

      <section className="mt-12 rounded-lg border border-line bg-surface p-7" aria-labelledby="pathway-note">
        <h2 id="pathway-note" className="text-[17px] font-semibold tracking-[-0.015em] text-ink">
          How to read this map
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          {[
          {
            t: 'Strand',
            d: 'Where you start in Grades 11 and 12. It shapes preparation, not destiny.'
          },
          {
            t: 'College field',
            d: 'Programmes commonly taken after this strand. Most accept students from other strands too.'
          },
          {
            t: 'Career area',
            d: 'Kinds of work graduates often move into. Roles change over time and vary by employer.'
          }].
          map((c) =>
          <div key={c.t}>
              <p className="text-[14px] font-semibold text-ink">{c.t}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.d}</p>
            </div>
          )}
        </div>
      </section>
    </div>);

}