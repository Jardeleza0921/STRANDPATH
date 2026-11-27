import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { Strand } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card, Chip, ErrorState, LoadingBlock, PageHeader } from '../../components/ui/Primitives';

interface CareerField {
  strandSlug: string;
  strandCode: string;
  field: string;
  careers: string[];
}

export function Pathways() {
  const [params, setParams] = useSearchParams();
  const [strands, setStrands] = useState<Strand[] | null>(null);
  const [fields, setFields] = useState<CareerField[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ fields: CareerField[]; strands: Strand[] }>('/careers')
      .then((data) => {
        setFields(data.fields);
        setStrands(data.strands);
        if (!params.get('strand') && data.strands[0]) {
          setParams({ strand: data.strands[0].slug }, { replace: true });
        }
      })
      .catch((err) => setError(errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!strands) return <LoadingBlock label="Loading pathways…" />;
  if (strands.length === 0) {
    return <div className="px-4 py-10 sm:px-8"><ErrorState message="No strands are available yet." /></div>;
  }

  const activeSlug = params.get('strand') ?? strands[0]?.slug ?? '';
  const active = strands.find((s) => s.slug === activeSlug) ?? strands[0];
  const activeFields = fields.filter((f) => f.strandSlug === active.slug);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Future options"
        title="Explore Your Future Options"
        description="These are common next steps, not guarantees. Most college programmes accept students from several strands, and career paths often cross between fields."
        actions={<Button to={`/app/strands/${active.slug}`} variant="secondary" size="sm">Strand details</Button>}
      />

      <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Choose a strand">
        {strands.map((strand) => {
          const selected = strand.slug === active.slug;
          return (
            <button
              key={strand.slug}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setParams({ strand: strand.slug })}
              className={[
                'rounded-full border px-4 py-1.5 text-[13px] font-medium transition-colors',
                selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
              ].join(' ')}
            >
              {strand.code}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{active.code}</h2>
            <Chip>{active.track}</Chip>
          </div>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{active.name}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {activeFields.map((field) => (
              <div key={field.field} className="rounded-md border border-line bg-canvas p-4">
                <h3 className="text-[14px] font-semibold text-ink">{field.field}</h3>
                <p className="mt-1 text-[12px] uppercase tracking-[0.05em] text-faint">Possible roles</p>
                <ul className="mt-1.5 space-y-1 text-[13px] text-muted">
                  {field.careers.map((career) => (
                    <li key={career}>{career}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <p className="text-[12px] uppercase tracking-[0.05em] text-faint">Before you plan around this strand</p>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-muted">
              {(active.considerations ?? []).map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <p className="mt-5 text-[12px] leading-relaxed text-muted">
        Confirm programme requirements, admission rules and costs with the specific school or college. STRANDPATH does
        not maintain official curriculum or admission data. See{' '}
        <Link to="/app/assistance" className="font-medium text-brand hover:text-brand-dark">Strand Assistance</Link> or your
        guidance office for help interpreting these options.
      </p>
    </div>
  );
}
