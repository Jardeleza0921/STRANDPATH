import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, ClipboardListIcon, InfoIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { AssessmentSummary, QuestionnaireMeta } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Alert, Card, ErrorState, LoadingBlock, Notice, PageHeader } from '../../components/ui/Primitives';

export function AssessmentIntro() {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<QuestionnaireMeta | null>(null);
  const [history, setHistory] = useState<AssessmentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'pre' | 'post' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    Promise.all([
      api.get<QuestionnaireMeta>('/questionnaire/active'),
      api.get<{ assessments: AssessmentSummary[] }>('/assessments')
    ])
      .then(([questionnaire, list]) => {
        setMeta(questionnaire);
        setHistory(list.assessments);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!meta) return <LoadingBlock label="Loading the questionnaire…" />;

  const inProgress = history.find((a) => a.status === 'in_progress');
  const submittedPre = history.filter((a) => a.type === 'pre' && a.status === 'submitted');
  const submittedPost = history.filter((a) => a.type === 'post' && a.status === 'submitted');

  const start = async (type: 'pre' | 'post') => {
    setBusy(type);
    setActionError(null);
    try {
      const data = await api.post<{ assessment: { id: number; answers: Record<string, string[]> } }>('/assessments', { type });
      const firstUnanswered = meta.questions.findIndex((q) => !(data.assessment.answers[q.code] ?? []).length);
      const index = firstUnanswered === -1 ? 1 : firstUnanswered + 1;
      navigate(`/app/assessment/${data.assessment.id}/q/${index}`);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Your assessment"
        title="Let's Get Started"
        description="Discover your interests, strengths and current readiness through guided questions. There are no right answers, nothing is timed, and you can pause at any question and return later."
      />

      {actionError && (
        <div className="mt-5">
          <Alert tone="danger">{actionError}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Questions', value: meta.questions.length },
          { label: 'Sections', value: meta.sections.length },
          { label: 'Estimated time', value: '10–12 min' }
        ].map((fact) => (
          <Card key={fact.label} className="px-5 py-4">
            <p className="text-[12px] uppercase tracking-[0.05em] text-faint">{fact.label}</p>
            <p className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-ink">{fact.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-[16px] font-semibold text-ink">What you will answer</h2>
        <ul className="mt-4 divide-y divide-line">
          {meta.sections.map((section) => {
            const count = meta.questions.filter((q) => q.section === section).length;
            return (
              <li key={section} className="flex items-center justify-between gap-4 py-2.5">
                <span className="text-[14px] text-ink">{section}</span>
                <span className="text-[13px] text-muted">{count} questions</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
          Your answers save automatically as you go. You can leave and resume at any question, and you can review
          everything before submitting.
        </p>
      </Card>

      <div className="mt-6 space-y-4">
        {inProgress && (
          <Card className="border-brand-edge bg-brand-soft p-5">
            <p className="text-[14px] font-semibold text-brand-dark">
              {inProgress.type === 'post' ? 'Post-assessment' : 'Pre-assessment'} in progress
            </p>
            <p className="mt-1 text-[13px] text-brand-dark/80">
              Started {formatDate(inProgress.startedAt, true)}. You can continue where you stopped.
            </p>
            <div className="mt-3">
              <Button onClick={() => navigate(`/app/assessment/${inProgress.id}/q/1`)} size="sm">
                Resume assessment
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <ClipboardListIcon className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Pre-assessment</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Establishes your baseline. Complete this first; it is the version your improvement programme and
                follow-up comparison are built from.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <Button onClick={() => start('pre')} disabled={busy !== null}>
                  {busy === 'pre' ? 'Starting…' : submittedPre.length ? 'Take a new pre-assessment' : 'Begin pre-assessment'}
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Button>
                {submittedPre.length > 0 && (
                  <span className="text-[12px] text-muted">
                    {submittedPre.length} previous {submittedPre.length === 1 ? 'attempt' : 'attempts'} kept in history.
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <ClipboardListIcon className="mt-0.5 h-5 w-5 text-muted" aria-hidden />
            <div>
              <h2 className="text-[16px] font-semibold text-ink">Post-assessment</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Available after your pre-assessment. It uses the same questionnaire and compares your current answers
                with your baseline. Differences are reported without claiming that the programme caused them.
              </p>
              <div className="mt-4">
                <Button
                  onClick={() => start('post')}
                  disabled={busy !== null || submittedPre.length === 0}
                  variant="secondary"
                >
                  {busy === 'post' ? 'Starting…' : submittedPost.length ? 'Take another post-assessment' : 'Begin post-assessment'}
                </Button>
                {submittedPre.length === 0 && (
                  <p className="mt-2 text-[12px] text-faint">Complete a pre-assessment first.</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Alert tone="warn" title="About this questionnaire">
          <span className="flex gap-2">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {meta.validationNotice}
          </span>
        </Alert>
      </div>

      <div className="mt-4">
        <Notice>
          Version {meta.version} · Algorithm {meta.algorithmVersion}. A completed assessment always keeps the
          questionnaire version and algorithm version it was scored with.
        </Notice>
      </div>
    </div>
  );
}
