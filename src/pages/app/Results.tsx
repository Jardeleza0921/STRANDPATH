import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckIcon, MessageCircleIcon, PrinterIcon, SparklesIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Assessment, AssessmentSummary, RankedStrand } from '../../types/api';
import { ComparisonBlock } from '../../components/app/Comparison';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  ScoreBar
} from '../../components/ui/Primitives';

const levelTone = {
  strong: 'brand',
  good: 'success',
  possible: 'neutral',
  exploratory: 'neutral'
} as const;

export function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = () => {
    setError(null);
    setNotFound(false);
    const fetchAssessment = async () => {
      if (id) return (await api.get<{ assessment: Assessment }>(`/assessments/${id}`)).assessment;
      const list = await api.get<{ assessments: AssessmentSummary[] }>('/assessments');
      const latest = list.assessments.find((a) => a.status === 'submitted');
      if (!latest) {
        setNotFound(true);
        return null;
      }
      return (await api.get<{ assessment: Assessment }>(`/assessments/${latest.id}`)).assessment;
    };
    fetchAssessment()
      .then((data) => {
        if (!data) return;
        if (data.status !== 'submitted') {
          navigate(`/app/assessment/${data.id}/q/1`, { replace: true });
          return;
        }
        setAssessment(data);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, [id, navigate]);

  const selectStrand = async (slug: string) => {
    if (!assessment) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/assessments/${assessment.id}/selection`, { strandSlug: slug });
      setAssessment({ ...assessment, selectedStrand: slug, selectedAt: new Date().toISOString() });
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const generateProgramme = async () => {
    if (!assessment) return;
    setBusy(true);
    setActionError(null);
    try {
      await api.post('/programs/generate', { assessmentId: assessment.id });
      navigate('/app/program');
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!assessment) return notFound ? <div className="px-4 py-10 sm:px-8"><EmptyState title="No submitted assessment yet" description="Complete the pre-assessment to see your results." action={<Button to="/app/assessment">Start assessment</Button>} /></div> : <LoadingBlock label="Loading your results…" />;

  const ranked = assessment.ranked ?? [];
  const selected = assessment.selectedStrand;
  const selectedStrand = ranked.find((r) => r.slug === selected);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow={`${assessment.type === 'post' ? 'Post-assessment' : 'Pre-assessment'} · ${formatDate(assessment.submittedAt)}`}
        title="Your Suggested Strands"
        description="These results describe how your answers align with each strand. They are evidence for a conversation, not a decision about your future."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <PrinterIcon className="h-4 w-4" aria-hidden />
              Print / save PDF
            </Button>
            <Button to="/app/assessment" variant="secondary" size="sm">
              New assessment
            </Button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
        <Chip>Questionnaire v{assessment.questionnaireVersion ?? '—'}</Chip>
        <Chip>Algorithm {assessment.algorithmVersion}</Chip>
        <Chip>{assessment.answeredCount} of {assessment.total} answered</Chip>
        {selected && <Chip tone="success">Selected: {selected.toUpperCase()}</Chip>}
      </div>

      {(assessment.warnings ?? []).length > 0 && (
        <div className="mt-5 space-y-2">
          {assessment.warnings!.map((warning) => (
            <Alert key={warning.type} tone={warning.type === 'no_mapped_items' ? 'danger' : 'info'}>
              {warning.message}
            </Alert>
          ))}
        </div>
      )}

      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <section aria-labelledby="ranked-heading">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="ranked-heading" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
                Strand alignment, ranked
              </h2>
              <Link to="/app/strands/compare" className="text-[13px] font-medium text-brand hover:text-brand-dark">
                Compare strands side by side
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {ranked.map((strand) => (
                <StrandResultCard
                  key={strand.slug}
                  strand={strand}
                  selected={selected === strand.slug}
                  busy={busy}
                  onSelect={() => selectStrand(strand.slug)}
                  onGenerate={generateProgramme}
                />
              ))}
            </div>
          </section>

          {assessment.comparison && <ComparisonBlock comparison={assessment.comparison} />}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Your strand choice</h2>
            {selectedStrand ? (
              <>
                <p className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-ink">{selectedStrand.code}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Rank #{selectedStrand.rank} on this attempt. Selection is always yours; STRANDPATH builds support
                  around it rather than overriding it.
                </p>
                <div className="mt-4 space-y-2">
                  <Button full size="sm" onClick={generateProgramme} disabled={busy}>
                    <SparklesIcon className="h-4 w-4" aria-hidden />
                    {busy ? 'Working…' : 'Generate improvement programme'}
                  </Button>
                  <Button to="/app/program" variant="secondary" size="sm" full>
                    View programme
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                Choose a strand from the ranked list when you are ready. You can change it later, including after a
                follow-up assessment.
              </p>
            )}
          </Card>

          {assessment.strengths && assessment.strengths.length > 0 && (
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold text-ink">What your answers show as strengths</h2>
              <ul className="mt-3 space-y-3">
                {assessment.strengths.map((strength) => (
                  <li key={strength.key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] text-ink">{strength.label}</span>
                      <span className="text-[12px] tabular-nums text-muted">{strength.percent}%</span>
                    </div>
                    <div className="mt-1"><ScoreBar percent={strength.percent} label={`${strength.label} ${strength.percent} percent`} /></div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-relaxed text-faint">
                Percentages are shares of the attainable range for each dimension in this attempt. They are descriptive,
                not a measure of ability.
              </p>
            </Card>
          )}

          {assessment.development && assessment.development.length > 0 && (
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold text-ink">Areas worth developing</h2>
              <ul className="mt-3 space-y-3">
                {assessment.development.map((area) => (
                  <li key={area.key}>
                    <p className="text-[13.5px] font-medium text-ink">{area.label}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{area.developing}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Next steps</h2>
            <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-muted">
              <li>1. Read the strand pages for your top two, including the considerations.</li>
              <li>2. Compare them side by side and note what you would actually study.</li>
              <li>3. Talk it through with your adviser, a parent, or the guidance office.</li>
              <li>4. Choose a strand and start a preparation programme.</li>
            </ol>
            <div className="mt-4 space-y-2">
              <Button to="/app/coach" variant="secondary" size="sm" full>
                <MessageCircleIcon className="h-4 w-4" aria-hidden />
                Ask the Virtual Coach to explain
              </Button>
              <Button to="/app/history" variant="ghost" size="sm" full>
                View assessment history
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StrandResultCard({
  strand,
  selected,
  busy,
  onSelect,
  onGenerate
}: {
  strand: RankedStrand;
  selected: boolean;
  busy: boolean;
  onSelect: () => void;
  onGenerate: () => void;
}) {
  const [open, setOpen] = useState(strand.rank === 1);
  return (
    <article className={`rounded-lg border bg-surface ${selected ? 'border-brand' : 'border-line'}`}>
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold tabular-nums text-faint">#{strand.rank}</span>
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand">{strand.code}</p>
              <Chip tone={levelTone[strand.level]}>{strand.levelLabel}</Chip>
              {selected && <Chip tone="success">Your selection</Chip>}
            </div>
            <h3 className="mt-1.5 text-[19px] font-semibold tracking-[-0.015em] text-ink">{strand.name}</h3>
          </div>
          <p className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-ink">
            {strand.score.toFixed(1)}
            <span className="ml-1 text-[11px] font-normal text-faint">/ 100 alignment</span>
          </p>
        </div>

        <div className="mt-3">
          <ScoreBar percent={strand.score} label={`${strand.code} alignment ${strand.score.toFixed(1)} of 100`} />
        </div>

        <p className="mt-4 text-[14px] leading-relaxed text-ink">{strand.explanation}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(!open)}>
            {open ? 'Hide evidence' : 'Show evidence'}
          </Button>
          <Button to={`/app/strands/${strand.slug}`} variant="ghost" size="sm">
            Strand details
          </Button>
          <Button to={`/app/pathways?strand=${strand.slug}`} variant="ghost" size="sm">
            Careers
          </Button>
        </div>

        {open && (
          <div className="mt-4 space-y-4 border-t border-line pt-4">
            <div>
              <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                Dimensions that contributed
              </h4>
              <ul className="mt-2 space-y-2.5">
                {strand.evidence.map((evidence) => (
                  <li key={evidence.category}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] text-ink">
                        {evidence.label}
                        <span className="ml-1.5 text-[11.5px] text-faint">weight {Math.round(evidence.weight * 100)}%</span>
                      </p>
                      <span className="text-[12px] tabular-nums text-muted">{evidence.percent}%</span>
                    </div>
                    <div className="mt-1"><ScoreBar percent={evidence.percent} tone="muted" label={evidence.label} /></div>
                    {evidence.answers.length > 0 && (
                      <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                        From your answers: {evidence.answers.join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            {strand.gaps.length > 0 && (
              <div className="rounded-md bg-canvas p-3.5">
                <h4 className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-faint">
                  Preparation worth considering
                </h4>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
                  {strand.gaps.map((gap) => gap.label).join(', ')} scored lower in this attempt. That is current
                  preparation, not a barrier — the programme can target it.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
          <Button onClick={onSelect} disabled={selected || busy} size="sm">
            {selected ? 'Selected' : busy ? 'Saving…' : 'Choose this strand'}
            {selected && <CheckIcon className="h-3.5 w-3.5" aria-hidden />}
          </Button>
          {selected && (
            <Button onClick={onGenerate} variant="secondary" size="sm" disabled={busy}>
              Build preparation programme
            </Button>
          )}
          <Link to={`/app/coach?prompt=${encodeURIComponent(`Why did ${strand.code} rank #${strand.rank} for me?`)}`} className="inline-flex items-center gap-1 px-2 text-[12.5px] font-medium text-muted hover:text-ink">
            Ask the coach about this
          </Link>
        </div>
      </div>
    </article>
  );
}
