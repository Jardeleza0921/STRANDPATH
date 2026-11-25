import React, { useEffect, useState } from 'react';
import { StrandCard } from '../components/site/StrandCard';
import { api } from '../lib/api';
import { Strand } from '../types/api';
import { ErrorState, LoadingBlock } from '../components/ui/Primitives';

const filters = ['All strands', 'Academic', 'TVL', 'Arts & Design', 'Sports'];

export function ExploreStrands() {
  const [strands, setStrands] = useState<Strand[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState('All strands');

  useEffect(() => {
    api
      .get<{ strands: Strand[] }>('/strands')
      .then((data) => setStrands(data.strands))
      .catch(() => setFailed(true));
  }, []);

  const available = [...new Set((strands ?? []).map((s) => s.track))];
  const tabs = filters.filter((f) => f === 'All strands' || available.includes(f));
  const visible = !strands ? [] : active === 'All strands' ? strands : strands.filter((s) => s.track === active);

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
          {failed ? (
            <ErrorState message="Strand information could not be loaded. Please try again later." />
          ) : !strands ? (
            <LoadingBlock label="Loading strands…" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filter strands by track">
                {tabs.map((filter) => {
                  const selected = filter === active;
                  return (
                    <button
                      key={filter}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setActive(filter)}
                      className={[
                        'rounded-full border px-4 py-2 text-[13px] font-medium transition-colors',
                        selected
                          ? 'border-ink bg-ink text-white'
                          : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
                      ].join(' ')}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((strand) => (
                  <StrandCard key={strand.slug} strand={strand} />
                ))}
              </div>

              <p className="mt-10 text-[13px] text-faint">
                Strand availability differs from school to school. Confirm which strands your school offers before
                planning around one.
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
}
