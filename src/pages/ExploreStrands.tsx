import React, { useState } from 'react';
import { StrandCard } from '../components/site/StrandCard';
import { gridStrands } from '../data/strands';
import { useScreenInit } from '../useScreenInit.js';

const filters = ['All strands', 'Academic', 'TVL', 'Arts & Design', 'Sports'] as const;

export function ExploreStrands() {
  const screenInit = useScreenInit();
  const [active, setActive] = useState<(typeof filters)[number]>(
    screenInit.active as (typeof filters)[number] | undefined ?? 'All strands'
  );
  const visible = active === 'All strands' ? gridStrands : gridStrands.filter((s) => s.track === active);

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-content px-6 py-20">
          <p className="text-[13px] font-medium text-brand">Explore strands</p>
          <h1 className="mt-3 max-w-2xl text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
            The Senior High School strands, in plain language.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
            Each strand below lists the interests it connects to, the skills it uses, and the pathways it can open.
            Read a few before deciding which ones deserve a closer look.
          </p>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-content px-6 py-16">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter strands by track">
            {filters.map((f) => {
              const selected = f === active;
              return (
                <button
                  key={f}
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(f)}
                  className={[
                  'rounded-full border px-4 py-2 text-[13px] font-medium',
                  'transition-[background-color,border-color,color] duration-150 ease-out',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
                  selected ?
                  'border-ink bg-ink text-white' :
                  'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'].
                  join(' ')}>
                  
                  {f}
                </button>);

            })}
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((s) =>
            <StrandCard key={s.slug} strand={s} />
            )}
          </div>

          <p className="mt-10 text-[13px] text-faint">
            Strand availability differs from school to school. Confirm which strands your school offers before
            planning around one.
          </p>
        </div>
      </section>
    </>);

}