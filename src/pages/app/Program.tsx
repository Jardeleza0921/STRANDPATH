import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ClockIcon, SparklesIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { DashboardData, Programme } from '../../types/api';
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

export function Program() {
  const [program, setProgram] = useState<Programme | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.get<{ program: Programme | null }>('/programs/current'), api.get<DashboardData>('/dashboard')])
      .then(([p, d]) => {
        setProgram(p.program);
        setDashboard(d);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const generate = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const data = await api.post<{ program: Programme }>('/programs/generate', {});
      setProgram(data.program);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} onRetry={load} /></div>;
  if (loading || !dashboard) return <LoadingBlock label="Loading your programme…" />;

  const next = program?.activities.find((a) => a.status !== 'completed');

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Your plan"
        title={program ? program.name : 'My Improvement Plan'}
        description={
          program
            ? program.goal
            : 'Develop the skills your chosen strand needs through short lessons, practice activities and knowledge checks. The plan starts at your current level, not at the beginning of the list.'
        }
        actions={
          <>
            <Button to="/app/development" variant="secondary" size="sm">Development journey</Button>
            {program && <Button to="/app/progress" variant="secondary" size="sm">Progress</Button>}
          </>
        }
      />

      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}

      {!program ? (
        <div className="mt-6">
          {dashboard.selectedStrand ? (
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <SparklesIcon className="mt-0.5 h-5 w-5 text-brand" aria-hidden />
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">
                    Generate a programme for {dashboard.selectedStrand.toUpperCase()}
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">
                    STRANDPATH will use your latest pre-assessment to choose up to three dimensions, then select
                    activities that develop them in a sequence, starting at your current evidence. You can repeat,
                    skip or request alternatives at any point.
                  </p>
                  <ul className="mt-3 space-y-1 text-[12.5px] text-muted">
                    <li>• Activities are drawn from your school's activity library, not generated randomly.</li>
                    <li>• Completion is recorded from your own reflection, with optional knowledge checks.</li>
                    <li>• A follow-up assessment is recommended after about four weeks, not required.</li>
                  </ul>
                  <div className="mt-4">
                    <Button onClick={generate} disabled={busy}>
                      {busy ? 'Building programme…' : 'Generate my programme'}
                      {!busy && <ArrowRightIcon className="h-4 w-4" aria-hidden />}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={SparklesIcon}
              title="Choose a strand first"
              description="Programmes are built around the strand you choose. Review your results and select one — you can change it later."
              action={
                <Button to={dashboard.assessment.latestPre ? '/app/results' : '/app/assessment'}>
                  {dashboard.assessment.latestPre ? 'Review results' : 'Take the assessment'}
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Card className="px-5 py-4">
              <p className="text-[11.5px] uppercase tracking-[0.05em] text-faint">Status</p>
              <p className="mt-1 text-[15px] font-semibold capitalize text-ink">{program.status}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">Started {formatDate(program.createdAt)}</p>
            </Card>
            <Card className="px-5 py-4">
              <p className="text-[11.5px] uppercase tracking-[0.05em] text-faint">Activities</p>
              <p className="mt-1 text-[15px] font-semibold text-ink">
                {program.progress.completed} of {program.progress.total} complete
              </p>
              <div className="mt-2"><ScoreBar percent={program.progress.percent} tone="success" label="Programme progress" /></div>
            </Card>
            <Card className="px-5 py-4">
              <p className="text-[11.5px] uppercase tracking-[0.05em] text-faint">Recommended follow-up</p>
              <p className="mt-1 text-[15px] font-semibold text-ink">After {program.reassessmentAfterDays} days</p>
              <Link to="/app/post-assessment" className="mt-1 inline-block text-[12px] font-medium text-brand hover:text-brand-dark">
                About the post-assessment
              </Link>
            </Card>
          </div>

          <Card className="mt-5 p-5">
            <h2 className="text-[14px] font-semibold text-ink">Target areas</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {program.targetCategories.map((category) => (
                <div key={category.key} className="rounded-md bg-canvas p-3.5">
                  <p className="text-[13px] font-medium text-ink">{category.label}</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{category.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {next && (
            <div className="mt-5">
              <Alert tone="info" title="Next activity">
                {next.title} · {next.minutes} minutes. <Link to={`/app/program/activities/${next.id}`} className="font-semibold underline">Open it</Link>.
              </Alert>
            </div>
          )}

          <section className="mt-6">
            <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">Activity sequence</h2>
            <ol className="mt-4 space-y-3">
              {program.activities.map((activity) => (
                <li key={activity.id}>
                  <Card className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold tabular-nums text-faint">
                            {String(activity.sequence).padStart(2, '0')}
                          </span>
                          <Chip tone={activity.status === 'completed' ? 'success' : activity.status === 'in_progress' ? 'brand' : 'neutral'}>
                            {activity.status === 'completed' ? 'Completed' : activity.status === 'in_progress' ? 'In progress' : 'Not started'}
                          </Chip>
                          <span className="text-[11.5px] text-muted">{activity.targetCategoryLabel}</span>
                        </div>
                        <h3 className="mt-1.5 text-[15.5px] font-semibold text-ink">{activity.title}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
                          <ClockIcon className="h-3.5 w-3.5" aria-hidden />
                          {activity.minutes} min ·{' '}
                          {activity.tier === 'foundation'
                            ? 'Foundation'
                            : activity.targetCategory === 'persistence'
                              ? 'Building Competence'
                              : 'Developing'}
                          {' · '}
                          {activity.type}
                        </p>
                        {activity.status === 'completed' && activity.checkScore !== null && (
                          <p className="mt-1.5 text-[12px] text-success">Knowledge check: {activity.checkScore}%</p>
                        )}
                      </div>
                      <Button to={`/app/program/activities/${activity.id}`} variant="secondary" size="sm">
                        {activity.status === 'completed' ? 'Review' : activity.status === 'in_progress' ? 'Continue' : 'Open activity'}
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          {program.status === 'completed' && (
            <div className="mt-6">
              <Alert tone="success" title="Programme complete">
                <span className="flex flex-wrap items-center gap-2">
                  All activities are recorded as complete. A post-assessment compares your current answers with your
                  baseline.{' '}
                  <Button to="/app/post-assessment" size="sm">Take the post-assessment</Button>
                </span>
              </Alert>
            </div>
          )}

          <p className="mt-6 text-[12px] leading-relaxed text-faint">
            Activities are suggestions for practice, not a curriculum. If an activity does not fit your situation, use
            “Request an alternative” on its page and your guidance office can respond.
          </p>
        </>
      )}
    </div>
  );
}
