import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon, Loader2Icon, XIcon } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { Assessment as AssessmentType, Question } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Choice, ScaleChoice } from '../../components/ui/Choice';
import { Alert, ErrorState, LoadingBlock } from '../../components/ui/Primitives';

export function Assessment() {
  const { id = '', index = '1' } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [version, setVersion] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const loadedRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<{ assessment: AssessmentType }>(`/assessments/${id}`),
      api.get<{ questions: Question[]; questionnaireVersion: string | null }>(`/assessments/${id}/questions`)
    ])
      .then(([a, q]) => {
        if (cancelled) return;
        if (a.assessment.status === 'submitted') {
          navigate(`/app/results/${a.assessment.id}`, { replace: true });
          return;
        }
        setAssessment(a.assessment);
        setAnswers(a.assessment.answers ?? {});
        setQuestions(q.questions);
        setVersion(q.questionnaireVersion);
        loadedRef.current = true;
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  // Persist progress automatically (debounced).
  useEffect(() => {
    if (!loadedRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    setSaveState('saving');
    timer.current = setTimeout(() => {
      api
        .patch(`/assessments/${id}/answers`, { answers })
        .then(() => setSaveState('saved'))
                    .catch(() => setSaveState('error'));
    }, 600);
    // No cleanup on unmount: a pending debounced save should still reach the server
    // when the student navigates to the review screen.
  }, [answers, id]);

  if (error) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-8">
        <ErrorState message={error} />
      </div>
    );
  }
  if (!assessment) return <LoadingBlock label="Loading your assessment…" />;

  const position = Math.min(Math.max(Number(index) || 1, 1), questions.length);
  const question = questions[position - 1];
  if (!question) return <ErrorState message="That question does not exist in this questionnaire." />;

  const selected = answers[question.code] ?? [];
  const multi = question.kind === 'multi';
  const atMax = Boolean(question.maxChoices && selected.length >= question.maxChoices);
  const isLast = position === questions.length;
  const answeredCount = questions.filter((q) => (answers[q.code] ?? []).length > 0).length;

  const select = (questionCode: string, optionCode: string) => {
    setAnswers((prev) => {
      const current = prev[questionCode] ?? [];
      if (question.kind === 'multi') {
        if (current.includes(optionCode)) return { ...prev, [questionCode]: current.filter((c) => c !== optionCode) };
        if (question.maxChoices && current.length >= question.maxChoices) return prev;
        return { ...prev, [questionCode]: [...current, optionCode] };
      }
      return { ...prev, [questionCode]: [optionCode] };
    });
  };

  const goNext = () => {
    if (isLast) navigate(`/app/assessment/${id}/review`);
    else navigate(`/app/assessment/${id}/q/${position + 1}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center gap-4 px-4 py-3.5 sm:px-8">
          <div className="min-w-[180px] flex-1">
            <Progress value={answeredCount} total={questions.length} label={`Question ${position} of ${questions.length}`} />
          </div>
          <span
            className={[
              'inline-flex items-center gap-1.5 text-[12px]',
              saveState === 'error' ? 'text-accent' : 'text-faint'
            ].join(' ')}
            aria-live="polite"
          >
            {saveState === 'saving' && <Loader2Icon className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {saveState === 'saved' && <CheckIcon className="h-3.5 w-3.5 text-success" aria-hidden />}
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Not saved — check your connection' : ''}
          </span>
          <Link
            to="/app/assessment"
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-muted hover:text-ink"
          >
            <XIcon className="h-4 w-4" aria-hidden />
            Save & exit
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[760px] flex-1 px-4 py-9 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-medium text-brand">{question.section}</p>
          {version && <span className="text-[11px] text-faint">questionnaire v{version}</span>}
          {assessment.type === 'post' && (
            <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] text-muted">follow-up</span>
          )}
        </div>
        <h1 className="mt-3 text-[26px] font-semibold leading-[1.2] tracking-[-0.025em] text-ink sm:text-[30px]">
          {question.prompt}
        </h1>
        {question.helper && <p className="mt-3 text-[15px] leading-relaxed text-muted">{question.helper}</p>}

        <div className="mt-8">
          {question.kind === 'scale' ? (
            <ScaleChoice
              options={question.options.map((option) => ({ id: option.code, label: option.label }))}
              value={selected[0] ?? null}
              onSelect={(optionCode) => select(question.code, optionCode)}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((option) => (
                <Choice
                  key={option.code}
                  label={option.label}
                  hint={option.hint ?? undefined}
                  multi={multi}
                  selected={selected.includes(option.code)}
                  disabled={multi && atMax}
                  onSelect={() => select(question.code, option.code)}
                />
              ))}
            </div>
          )}
        </div>

        {multi && question.maxChoices && (
          <p className="mt-4 text-[13px] text-faint" aria-live="polite">
            {selected.length} of {question.maxChoices} selected
          </p>
        )}

        {answeredCount < questions.length && isLast && (
          <div className="mt-8">
            <Alert tone="info">
              You still have {questions.length - answeredCount} unanswered question
              {questions.length - answeredCount === 1 ? '' : 's'}. You can move back with the Back button; the review
              screen lists anything unanswered before submission.
            </Alert>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-4 py-3.5 sm:px-8">
          {position > 1 ? (
            <Button to={`/app/assessment/${id}/q/${position - 1}`} variant="secondary">
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              Back
            </Button>
          ) : (
            <Button to="/app/assessment" variant="secondary">
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              Back
            </Button>
          )}
          <div className="flex items-center gap-3">
            {selected.length === 0 && <span className="hidden text-[13px] text-faint sm:inline">Select an answer to continue</span>}
            <Button onClick={goNext} disabled={selected.length === 0}>
              {isLast ? 'Review answers' : 'Next'}
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
