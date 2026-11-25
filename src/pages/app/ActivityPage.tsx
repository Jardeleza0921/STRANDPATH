import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon, ClockIcon, LifeBuoyIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { ProgrammeActivity } from '../../types/api';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  ErrorState,
  Field,
  LoadingBlock,
  PageHeader,
  ScoreBar,
  TextArea
} from '../../components/ui/Primitives';

export function ActivityPage() {
  const { id = '' } = useParams();
  const [activity, setActivity] = useState<ProgrammeActivity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ checkScore: number | null; checkFeedback: string | null; alternatives: { id: number; title: string; tier: string; minutes: number }[] } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alternativeMessage, setAlternativeMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ activity: ProgrammeActivity }>(`/program-activities/${id}`)
      .then((data) => {
        setActivity(data.activity);
        setReflection(data.activity.reflection ?? '');
        if (data.activity.status !== 'completed') {
          api.post(`/program-activities/${id}/start`).catch(() => undefined);
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!activity) return <LoadingBlock label="Loading activity…" />;

  const steps = activity.instructions.split('\n').filter(Boolean);
  const completed = activity.status === 'completed';

  const complete = async () => {
    setBusy(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = { reflection };
      if (activity.check && activity.check.length) {
        payload.responses = activity.check.map((_, index) => responses[index]);
      }
      const data = await api.post<typeof result>(`/program-activities/${id}/complete`, payload);
      setResult(data);
      const refreshed = await api.get<{ activity: ProgrammeActivity }>(`/program-activities/${id}`);
      setActivity(refreshed.activity);
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const requestAlternative = async () => {
    setAlternativeMessage(null);
    try {
      await api.post('/support/tickets', {
        subject: `Alternative activity request: ${activity.title}`,
        category: 'improvement-programme',
        message: `I would like an alternative activity for "${activity.title}" (${activity.targetCategoryLabel}). The current one is difficult to complete because: `,
        priority: 'low'
      });
      setAlternativeMessage('Request sent to your guidance office as a support request. You can follow it on the Support page.');
    } catch (err) {
      setAlternativeMessage(errorMessage(err));
    }
  };

  return (
    <div className="mx-auto max-w-[800px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link to="/app/program" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        Back to programme
      </Link>

      <PageHeader
        eyebrow={`${activity.targetCategoryLabel} · ${activity.tier}`}
        title={activity.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ClockIcon className="h-3.5 w-3.5" aria-hidden /> {activity.minutes} minutes
            {completed && <Chip tone="success">Completed {formatDate(activity.completedAt)}</Chip>}
            {!completed && activity.status === 'in_progress' && <Chip tone="brand">In progress</Chip>}
          </span>
        }
      />

      <Card className="mt-6 p-6">
        <h2 className="text-[15px] font-semibold text-ink">What this activity develops</h2>
        <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-muted">
          {activity.objectives.map((objective) => (
            <li key={objective} className="flex gap-2">
              <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
              {objective}
            </li>
          ))}
        </ul>
        <h2 className="mt-6 text-[15px] font-semibold text-ink">Steps</h2>
        <ol className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-ink">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-2.5">
              <span className="text-[12px] font-semibold tabular-nums text-faint">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-md bg-canvas px-4 py-3 text-[12.5px] leading-relaxed text-muted">
          <span className="font-medium text-ink">Completion criteria:</span> {activity.completionCriteria}
        </p>
      </Card>

      {activity.check && activity.check.length > 0 && (
        <Card className="mt-5 p-6">
          <h2 className="text-[15px] font-semibold text-ink">Knowledge check (optional feedback)</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            This is not a grade. It shows whether the idea landed; if not, you will be offered a simpler alternative.
          </p>
          <ol className="mt-4 space-y-5">
            {activity.check.map((question, qIndex) => (
              <li key={question.prompt}>
                <fieldset>
                  <legend className="text-[13.5px] font-medium text-ink">
                    {qIndex + 1}. {question.prompt}
                  </legend>
                  <div className="mt-2 space-y-1.5">
                    {question.options.map((option, oIndex) => (
                      <label key={option} className="flex items-start gap-2.5 rounded-md border border-line px-3 py-2 text-[13px] text-ink hover:border-ink/25">
                        <input
                          type="radio"
                          name={`check-${qIndex}`}
                          checked={responses[qIndex] === oIndex}
                          onChange={() => setResponses((prev) => ({ ...prev, [qIndex]: oIndex }))}
                          className="mt-0.5 h-3.5 w-3.5 text-brand focus:ring-brand"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mt-5 p-6">
        <h2 className="text-[15px] font-semibold text-ink">Your reflection</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          Write at least a couple of sentences on what you did and what you noticed. This is stored with the activity and
          counts as completion; it is visible to you and authorised guidance staff.
        </p>
        <div className="mt-3">
          <Field label="Reflection" htmlFor="reflection" hint="20 characters minimum.">
            <TextArea
              id="reflection"
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="What did you try? What worked? What would you do differently next time?"
              disabled={busy}
            />
          </Field>
        </div>

        {submitError && <div className="mt-3"><Alert tone="danger">{submitError}</Alert></div>}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={complete} disabled={busy || reflection.trim().length < 20}>
            {busy ? 'Saving…' : completed ? 'Update completion record' : 'Mark activity complete'}
          </Button>
          <Button variant="secondary" onClick={requestAlternative}>
            <LifeBuoyIcon className="h-4 w-4" aria-hidden />
            Request an alternative
          </Button>
        </div>
        {alternativeMessage && <p className="mt-2 text-[12.5px] text-muted">{alternativeMessage}</p>}
      </Card>

      {result && (
        <div className="mt-5 space-y-3">
          <Alert tone={result.checkScore === null || result.checkScore >= 60 ? 'success' : 'warn'} title="Recorded">
            {result.checkFeedback ?? 'Your reflection has been recorded.'}
          </Alert>
          {result.alternatives.length > 0 && (
            <Card className="p-5">
              <p className="text-[13px] font-semibold text-ink">Alternative activities for this skill</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-muted">
                {result.alternatives.map((alternative) => (
                  <li key={alternative.id}>
                    {alternative.title} · {alternative.minutes} min ({alternative.tier})
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-faint">
                These are in the activity library but not in your sequence. Ask your guidance office to swap one in.
              </p>
            </Card>
          )}
        </div>
      )}

      {completed && activity.checkScore !== null && (
        <div className="mt-4">
          <p className="mb-1.5 text-[12px] text-muted">Knowledge check result: {activity.checkScore}%</p>
          <ScoreBar percent={activity.checkScore} tone={activity.checkScore >= 60 ? 'success' : 'accent'} label="Knowledge check score" />
        </div>
      )}
    </div>
  );
}
