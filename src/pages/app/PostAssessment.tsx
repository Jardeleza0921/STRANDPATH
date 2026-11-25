import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CalendarClockIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { AssessmentSummary } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Alert, Card, ErrorState, LoadingBlock, PageHeader, Stat } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';

export function PostAssessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<AssessmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ assessments: AssessmentSummary[] }>('/assessments')
      .then((data) => setItems(data.assessments))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const start = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const data = await api.post<{ assessment: { id: number; answers: Record<string, string[]> } }>('/assessments', { type: 'post' });
      navigate(`/app/assessment/${data.assessment.id}/q/1`);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!items) return <LoadingBlock label="Checking your assessments…" />;

  const pre = items.find((a) => a.type === 'pre' && a.status === 'submitted');
  const post = items.find((a) => a.type === 'post' && a.status === 'submitted');
  const inProgress = items.find((a) => a.type === 'post' && a.status === 'in_progress');

  return (
    <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Follow-up"
        title="Your Follow-Up Assessment"
        description="A follow-up attempt with the same questionnaire. It measures how your answers have changed; it cannot prove that any activity caused the change."
      />

      {!pre ? (
        <div className="mt-6">
          <Alert tone="warn" title="Complete a pre-assessment first">
            The post-assessment compares against your baseline, so there needs to be a baseline.{' '}
            <Link to="/app/assessment" className="font-semibold underline">Start the pre-assessment</Link>.
          </Alert>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Baseline" value={`#${pre.id}`} note={formatDate(pre.submittedAt)} />
            <Stat label="Latest follow-up" value={post ? `#${post.id}` : '—'} note={post ? formatDate(post.submittedAt) : 'Not taken yet'} />
            <Stat label="Questionnaire" value={`v${pre.questionnaireVersion ?? '—'}`} note={`Algorithm ${pre.algorithmVersion}`} />
          </div>

          {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}

          <Card className="mt-5 p-6">
            <div className="flex items-start gap-3">
              <CalendarClockIcon className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
              <div>
                <h2 className="text-[16px] font-semibold text-ink">
                  {inProgress ? 'You have a follow-up in progress' : post ? 'Take another follow-up' : 'Ready when you are'}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Answer the same questions about your current interests, strengths and preferences. Your earlier
                  answers are not shown while you answer, so the comparison stays honest.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {inProgress ? (
                    <Button onClick={() => navigate(`/app/assessment/${inProgress.id}/q/1`)}>
                      Resume follow-up
                      <ArrowRightIcon className="h-4 w-4" aria-hidden />
                    </Button>
                  ) : (
                    <Button onClick={start} disabled={busy}>
                      {busy ? 'Starting…' : post ? 'Take another post-assessment' : 'Start post-assessment'}
                      {!busy && <ArrowRightIcon className="h-4 w-4" aria-hidden />}
                    </Button>
                  )}
                  {post && (
                    <Button to={`/app/results/${post.id}`} variant="secondary">
                      View comparison
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-5">
            <Alert tone="info" title="Reading the comparison">
              A higher score means your answers now align more closely with that dimension. It does not mean you have
              become more capable, and a lower score is not a failure — interests and self-perception change. Use the
              result to ask better questions, not to grade yourself.
            </Alert>
          </div>

          {user?.role === 'student' && (
            <p className="mt-4 text-[12px] leading-relaxed text-faint">
              Your guidance office can discuss changes with you. If something in your results is confusing, the Virtual
              Coach can explain the scoring, and Support can help with technical problems.
            </p>
          )}
        </>
      )}
    </div>
  );
}
