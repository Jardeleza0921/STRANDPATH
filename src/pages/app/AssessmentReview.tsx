import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { Assessment as AssessmentType, Question } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Alert, Card, ErrorState, LoadingBlock, PageHeader } from '../../components/ui/Primitives';

export function AssessmentReview() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ assessment: AssessmentType }>(`/assessments/${id}`),
      api.get<{ questions: Question[] }>(`/assessments/${id}/questions`)
    ])
      .then(([a, q]) => {
        if (a.assessment.status === 'submitted') {
          navigate(`/app/results/${a.assessment.id}`, { replace: true });
          return;
        }
        setAssessment(a.assessment);
        setQuestions(q.questions);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id, navigate]);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!assessment) return <LoadingBlock label="Loading your answers…" />;

  const answers = assessment.answers;
  const sections = [...new Set(questions.map((q) => q.section))];
  const answered = questions.filter((q) => (answers[q.code] ?? []).length > 0).length;
  const missingQuestions = questions.filter((q) => !(answers[q.code] ?? []).length);

  const submit = async () => {
    setBusy(true);
    setSubmitError(null);
    setMissing([]);
    try {
      const data = await api.post<{ assessment: AssessmentType }>(`/assessments/${id}/submit`, { answers });
      navigate(`/app/results/${data.assessment.id}`, { replace: true });
    } catch (err) {
      setSubmitError(errorMessage(err));
      if (err && typeof err === 'object' && 'missing' in err && Array.isArray((err as { missing?: string[] }).missing)) {
        setMissing((err as { missing?: string[] }).missing ?? []);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <PageHeader
        eyebrow="Review"
        title="Everything is saved. Check before submitting."
        description="Once submitted, this attempt is scored and stored permanently in your history. Your previous attempts are never overwritten."
      />

      <Card className="mt-6 p-6">
        <Progress value={answered} total={questions.length} label={`${answered} of ${questions.length} answered`} />

        <ul className="mt-6 divide-y divide-line">
          {sections.map((section) => {
            const inSection = questions.filter((q) => q.section === section);
            const done = inSection.filter((q) => (answers[q.code] ?? []).length > 0).length;
            const first = questions.findIndex((q) => q.section === section) + 1;
            return (
              <li key={section} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-[14px] font-medium text-ink">{section}</p>
                  <p className="text-[12.5px] text-muted">
                    {done} of {inSection.length} answered
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {done === inSection.length ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-success">
                      <CheckIcon className="h-3.5 w-3.5" aria-hidden /> Complete
                    </span>
                  ) : (
                    <span className="text-[12px] text-accent">Needs answers</span>
                  )}
                  <Link to={`/app/assessment/${id}/q/${first}`} className="text-[13px] font-medium text-brand hover:text-brand-dark">
                    Review
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {(submitError || missingQuestions.length > 0) && (
        <div className="mt-5">
          <Alert tone="warn" title="Some questions still need an answer">
            {submitError && <p>{submitError}</p>}
            <ul className="mt-2 space-y-1.5">
              {missingQuestions.map((q) => {
                const index = questions.findIndex((item) => item.code === q.code) + 1;
                return (
                  <li key={q.code}>
                    <Link to={`/app/assessment/${id}/q/${index}`} className="underline">
                      {q.section}: {q.prompt}
                    </Link>
                  </li>
                );
              })}
              {missing
                .filter((code) => !missingQuestions.some((q) => q.code === code))
                .map((code) => (
                  <li key={code}>Unanswered: {code}</li>
                ))}
            </ul>
          </Alert>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
        <Button onClick={submit} size="lg" disabled={busy || answered !== questions.length}>
          {busy ? 'Scoring your answers…' : 'Submit and see my guidance'}
          {!busy && <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden />}
        </Button>
        <Button to={`/app/assessment/${id}/q/${questions.length}`} variant="secondary" size="lg">
          <ChevronLeftIcon className="h-4 w-4" aria-hidden />
          Back to last question
        </Button>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-faint">
        Submitting sends your answers to the server, where the deterministic scoring engine calculates dimension scores
        and strand alignment. AI is not used to compute or change scores.
      </p>
    </div>
  );
}
