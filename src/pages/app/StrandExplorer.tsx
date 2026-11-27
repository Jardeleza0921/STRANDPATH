import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CompassIcon } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { AssessmentSummary, Strand } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card, Chip, ErrorState, LoadingBlock, PageHeader, ScoreBar } from '../../components/ui/Primitives';

export function StrandExplorer() {
  const [strands, setStrands] = useState<Strand[] | null>(null);
  const [latest, setLatest] = useState<AssessmentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      api.get<{ strands: Strand[] }>('/strands'),
      api.get<{ assessments: AssessmentSummary[] }>('/assessments')
    ])
      .then(([s, a]) => {
        setStrands(s.strands);
        setLatest(a.assessments.find((item) => item.status === 'submitted') ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!strands) return <LoadingBlock label="Loading strands…" />;

  const tracks = ['All', ...new Set(strands.map((s) => s.track))];
  const visible = filter === 'All' ? strands : strands.filter((s) => s.track === filter);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Explore"
        title="Explore Strands"
        description="Compare academic strands, college programs and careers before deciding which pathway you want to pursue. Availability differs between schools, so confirm your own school's offerings."
        actions={
          <>
            <Button to="/app/strands/compare" variant="secondary" size="sm">Compare strands</Button>
            <Button to="/app/results" size="sm">My results</Button>
          </>
        }
      />

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by track">
        {tracks.map((track) => {
          const selected = track === filter;
          return (
            <button
              key={track}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(track)}
              className={[
                'rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
                selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
              ].join(' ')}
            >
              {track}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {visible.map((strand) => {
          const ranked = latest?.ranked.find((r) => r.slug === strand.slug);
          const selected = latest?.selectedStrand === strand.slug;
          return (
            <Card key={strand.slug} className="flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold uppercase tracking-wide text-brand">{strand.code}</span>
                  <Chip>{strand.track}</Chip>
                  {selected && <Chip tone="success">Your selection</Chip>}
                </div>
                {ranked && <span className="text-[12px] text-muted">Alignment {ranked.score.toFixed(1)}</span>}
              </div>
              <h2 className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">{strand.name}</h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{strand.tagline}</p>
              {ranked && (
                <div className="mt-3">
                  <ScoreBar percent={ranked.score} label={`${strand.code} alignment ${ranked.score.toFixed(1)}`} />
                </div>
              )}
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[12.5px]">
                <div>
                  <dt className="text-faint">Subjects and learning</dt>
                  <dd className="mt-0.5 text-ink">{strand.learn.slice(0, 2).join(' · ')}</dd>
                </div>
                <div>
                  <dt className="text-faint">College fields</dt>
                  <dd className="mt-0.5 text-ink">{strand.collegeFields.slice(0, 3).join(' · ')}</dd>
                </div>
              </dl>
              <Link
                to={`/app/strands/${strand.slug}`}
                className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-medium text-brand hover:text-brand-dark"
              >
                View strand details
                <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Card>
          );
        })}
      </div>

      {!latest && (
        <div className="mt-8 rounded-lg border border-line bg-surface p-6">
          <div className="flex items-start gap-3">
            <CompassIcon className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
            <div>
              <p className="text-[14px] font-semibold text-ink">See which strands fit your answers</p>
              <p className="mt-1 text-[13px] text-muted">
                Complete the pre-assessment to see your alignment with each strand, with the evidence behind it.
              </p>
              <div className="mt-3">
                <Button to="/app/assessment" size="sm">Start assessment</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
