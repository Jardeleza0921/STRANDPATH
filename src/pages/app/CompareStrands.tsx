import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { Assessment, Strand } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card, ErrorState, LoadingBlock, PageHeader, ScoreBar } from '../../components/ui/Primitives';

export function CompareStrands() {
  const [params, setParams] = useSearchParams();
  const [strands, setStrands] = useState<Strand[] | null>(null);
  const [latest, setLatest] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ strands: Strand[] }>('/strands'),
      api
        .get<{ assessments: { id: number; status: string; type: string }[] }>('/assessments')
        .then(async (list) => {
          const latestSubmitted = list.assessments.find((a) => a.status === 'submitted');
          if (!latestSubmitted) return null;
          return (await api.get<{ assessment: Assessment }>(`/assessments/${latestSubmitted.id}`)).assessment;
        })
    ])
      .then(([s, a]) => {
        setStrands(s.strands);
        setLatest(a);
        const initial = (params.get('slugs') ?? '').split(',').filter(Boolean);
        if (!initial.length) {
          const top = a?.ranked?.slice(0, 2).map((r) => r.slug) ?? s.strands.slice(0, 2).map((x) => x.slug);
          setParams({ slugs: top.join(',') }, { replace: true });
        }
      })
      .catch((err) => setError(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => (params.get('slugs') ?? '').split(',').filter(Boolean), [params]);

  const toggle = (slug: string) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : selected.length >= 3
        ? [...selected.slice(1), slug]
        : [...selected, slug];
    setParams({ slugs: next.join(',') });
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!strands) return <LoadingBlock label="Loading strands…" />;

  const chosen = selected.map((slug) => strands.find((s) => s.slug === slug)).filter(Boolean) as Strand[];
  const rows: { label: string; render: (strand: Strand) => React.ReactNode }[] = [
    {
      label: 'Track',
      render: (s) => s.track
    },
    {
      label: 'Alignment with your answers',
      render: (s) => {
        const rank = latest?.ranked?.find((r) => r.slug === s.slug);
        if (!rank) return <span className="text-faint">Complete an assessment</span>;
        return (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-ink">{rank.score.toFixed(1)}</span>
              <span className="text-[11.5px] text-muted">#{rank.rank} · {rank.levelLabel}</span>
            </div>
            <div className="mt-1"><ScoreBar percent={rank.score} label={`${s.code} alignment`} /></div>
          </div>
        );
      }
    },
    {
      label: 'Strongest matching dimensions',
      render: (s) => {
        const rank = latest?.ranked?.find((r) => r.slug === s.slug);
        if (!rank) return <span className="text-faint">—</span>;
        return rank.evidence
          .slice(0, 3)
          .map((e) => `${e.label} (${e.percent}%)`)
          .join(' · ');
      }
    },
    { label: 'What you would study', render: (s) => s.learn.join('; ') },
    { label: 'College fields', render: (s) => s.collegeFields.join(', ') },
    { label: 'Career areas', render: (s) => s.careerAreas.join(', ') },
    {
      label: 'Considerations',
      render: (s) => (
        <ul className="space-y-1.5">
          {s.considerations.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )
    },
    {
      label: 'Preparation areas in your results',
      render: (s) => {
        const rank = latest?.ranked?.find((r) => r.slug === s.slug);
        if (!rank || !rank.gaps.length) return <span className="text-muted">Nothing specific flagged by this attempt.</span>;
        return rank.gaps.map((g) => g.label).join(', ');
      }
    }
  ];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Compare"
        title="Compare Strands Side by Side"
        description="Choose up to three strands. Scores come from your latest submitted assessment; everything else comes from the strand records maintained by your school."
        actions={<Button to="/app/results" variant="secondary" size="sm">Back to results</Button>}
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {strands.map((strand) => {
          const active = selected.includes(strand.slug);
          return (
            <button
              key={strand.slug}
              type="button"
              onClick={() => toggle(strand.slug)}
              aria-pressed={active}
              className={[
                'rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors',
                active ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
              ].join(' ')}
            >
              {strand.code}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && <p className="mt-2 text-[12.5px] text-faint">Select at least one strand.</p>}

      {chosen.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th scope="col" className="w-[180px] px-4 py-3 text-[11px] uppercase tracking-[0.05em] text-faint">Dimension</th>
                  {chosen.map((strand) => (
                    <th key={strand.slug} scope="col" className="px-4 py-3 align-top">
                      <Link to={`/app/strands/${strand.slug}`} className="text-[13px] font-semibold text-ink hover:text-brand">
                        {strand.code}
                      </Link>
                      <p className="mt-0.5 text-[11.5px] font-normal text-muted">{strand.name}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-line/70 last:border-0">
                    <th scope="row" className="px-4 py-3 align-top text-[12px] font-medium text-faint">{row.label}</th>
                    {chosen.map((strand) => (
                      <td key={strand.slug} className="px-4 py-3 align-top leading-relaxed text-ink">
                        {row.render(strand)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <p className="mt-4 text-[12px] leading-relaxed text-muted">
        Alignment scores describe how closely your selected answers match each strand's emphasis. They are not
        probabilities of success and should not be read as limits on what you can study.
      </p>
    </div>
  );
}
