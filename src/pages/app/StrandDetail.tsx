import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { Assessment, Strand } from '../../types/api';
import { StrandDetailContent } from '../../components/StrandDetailContent';
import { Button } from '../../components/ui/Button';
import { Alert, Card, ErrorState, LoadingBlock, ScoreBar } from '../../components/ui/Primitives';

export function StrandDetail() {
  const { slug = '' } = useParams();
  const [strand, setStrand] = useState<Strand | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<{ strand: Strand }>(`/strands/${slug}`),
      api
        .get<{ assessments: { id: number; status: string }[] }>('/assessments')
        .then(async (list) => {
          const latest = list.assessments.find((a) => a.status === 'submitted');
          if (!latest) return null;
          return (await api.get<{ assessment: Assessment }>(`/assessments/${latest.id}`)).assessment;
        })
    ])
      .then(([s, a]) => {
        setStrand(s.strand);
        setAssessment(a);
        setSelected(a?.selectedStrand ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [slug]);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!strand) return <LoadingBlock label="Loading strand…" />;

  const rank = assessment?.ranked?.find((r) => r.slug === strand.slug);

  const choose = async () => {
    if (!assessment) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/assessments/${assessment.id}/selection`, { strandSlug: strand.slug });
      setSelected(strand.slug);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link to="/app/strands" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        All strands
      </Link>

      {rank && (
        <Card className="mt-5 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">
                Your alignment · rank #{rank.rank}
              </p>
              <p className="mt-1 text-[13px] text-muted">
                {Math.round(rank.score)} of 100 on the alignment index, from your latest assessment.
              </p>
            </div>
            <Button onClick={choose} size="sm" disabled={busy || selected === strand.slug || !assessment} variant="secondary">
              {selected === strand.slug ? 'Selected strand' : busy ? 'Saving…' : 'Choose this strand'}
            </Button>
          </div>
          <div className="mt-3"><ScoreBar percent={rank.score} label={`${strand.code} alignment ${rank.score}`} /></div>
          <p className="mt-3 text-[13px] leading-relaxed text-ink">{rank.explanation}</p>
          {rank.evidence.length > 0 && (
            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[11.5px] uppercase tracking-[0.06em] text-faint">Evidence from your answers</p>
              <ul className="mt-1.5 space-y-1 text-[12.5px] text-muted">
                {rank.evidence.map((e) => (
                  <li key={e.category}>
                    <span className="text-ink">{e.label}</span> ({e.percent}%): {e.answers.join(' · ') || 'no specific answers'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {rank.gaps.length > 0 && (
            <p className="mt-3 rounded-md bg-canvas px-3.5 py-2.5 text-[12px] leading-relaxed text-muted">
              Preparation to consider: {rank.gaps.map((g) => g.label).join(', ')}. Lower scores describe current
              preparation, not capability.
            </p>
          )}
        </Card>
      )}

      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}

      <div className="mt-6">
        <StrandDetailContent strand={strand} pathwayHref={`/app/pathways?strand=${strand.slug}`} />
      </div>
    </div>
  );
}
