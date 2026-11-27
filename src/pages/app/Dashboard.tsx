import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  BarChart3Icon,
  ClipboardListIcon,
  MessageCircleIcon,
  SparklesIcon,
  TargetIcon
} from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { DashboardData, NotificationItem } from '../../types/api';
import type { DevelopmentBundle } from '../../development/load';
import { loadDevelopment } from '../../development/load';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  ScoreBar,
  Stat,
  Chip
} from '../../components/ui/Primitives';

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [development, setDevelopment] = useState<DevelopmentBundle | null>(null);
  const [notices, setNotices] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    loadDevelopment()
      .then((bundle) => {
        setData(bundle.dashboard);
        setDevelopment(bundle);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  useEffect(() => {
    api
      .get<{ notifications: NotificationItem[] }>('/notifications')
      .then((result) => setNotices(result.notifications.filter((item) => !item.readAt).slice(0, 3)))
      .catch(() => undefined);
  }, []);

  const markNoticesRead = async () => {
    try {
      await api.post('/notifications/read');
      setNotices([]);
    } catch {
      /* non-critical */
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!data) return <LoadingBlock label="Loading your dashboard…" />;

  const firstName = data.user.name.split(' ')[0];
  const latest = data.assessment.latestPre;
  const topThree = latest?.ranked.slice(0, 3) ?? [];

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow={data.profile?.gradeLevel ? `${data.profile.gradeLevel} · ${data.profile.school ?? 'StrandPath'}` : undefined}
        title={`Welcome back, ${firstName}.`}
        description="See where your strand journey stands, what you have improved, and the next thing worth doing. Everything here is built only from assessments and activities you have actually completed."
        actions={
          <Button to={latest ? '/app/results' : '/app/assessment'} size="sm">
            {latest ? 'View latest results' : 'Start assessment'}
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </Button>
        }
      />

      {notices.length > 0 && (
        <div className="mt-6">
          <div className="rounded-lg border border-brand-edge bg-brand-soft px-4 py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-brand-dark">Notices for you</p>
              <button type="button" onClick={markNoticesRead} className="text-[11.5px] font-medium text-brand-dark underline-offset-2 hover:underline">
                Mark all as read
              </button>
            </div>
            <ul className="mt-2 space-y-1.5">
              {notices.map((notice) => (
                <li key={notice.id} className="text-[12.5px] leading-relaxed text-brand-dark">
                  <strong className="font-semibold">{notice.title}.</strong> {notice.body}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {data.assessment.inProgress && (
        <div className="mt-6">
          <Alert tone="info" title="You have an assessment in progress">
            Started {formatDate(data.assessment.inProgress.startedAt, true)}. Your saved answers will be waiting when
            you return.{' '}
            <Link to={`/app/assessment/${data.assessment.inProgress.id}/q/1`} className="font-semibold underline">
              Continue it now
            </Link>
            .
          </Alert>
        </div>
      )}

      {data.reassessment?.due && (
        <div className="mt-4">
          <Alert tone="warn" title="A follow-up assessment is recommended">
            Your programme started on {formatDate(data.program?.createdAt)}. A post-assessment now would show whether
            anything has changed. It is optional — you decide when you are ready.{' '}
            <Link to="/app/post-assessment" className="font-semibold underline">
              See the follow-up assessment
            </Link>
            .
          </Alert>
        </div>
      )}

      {development?.view && (
        <section className="mt-6" aria-labelledby="where-heading">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand">Where you are now</p>
                <h2 id="where-heading" className="mt-1 text-[19px] font-semibold tracking-[-0.015em] text-ink">
                  {development.view.pathway.code} · {development.view.stage.name}
                </h2>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {latest && latest.ranked[0] && latest.ranked[0].slug !== development.view.selectedStrand
                    ? `Your assessment ranks ${latest.ranked[0].code} highest, and you chose ${development.view.pathway.code}. The pathway is built around your choice, starting from your current evidence.`
                    : `You are developing toward ${development.view.pathway.code}, the strand you chose. Stages are completed by evidence, not by time spent.`}
                </p>
              </div>
              <Button to="/app/development" size="sm" variant="secondary">
                Open my journey
                <ArrowRightIcon className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] text-ink">Current readiness</p>
                  <span className="text-[12px] tabular-nums text-muted">{development.view.currentReadiness}%</span>
                </div>
                <div className="mt-1.5"><ScoreBar percent={development.view.currentReadiness} label="Current readiness" /></div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">Match between your answers and {development.view.pathway.code} today.</p>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] text-ink">Pathway progress</p>
                  <span className="text-[12px] tabular-nums text-muted">{development.view.progressPercent}%</span>
                </div>
                <div className="mt-1.5"><ScoreBar percent={development.view.progressPercent} tone="success" label="Pathway progress" /></div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">Evidence from assessment answers, activities and checkpoints.</p>
              </div>
              <div>
                <p className="text-[12.5px] text-ink">Still developing</p>
                {development.view.skillsToImprove.length ? (
                  <ul className="mt-1.5 space-y-1 text-[12px] text-muted">
                    {development.view.skillsToImprove.slice(0, 3).map((skill) => (
                      <li key={skill.key} className="flex items-baseline justify-between gap-2">
                        <span>{skill.label}</span>
                        <span className="tabular-nums">{skill.percent}% / {skill.target}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-[12px] text-muted">No gaps below the stage target right now.</p>
                )}
              </div>
            </div>

            {development.view.nextAction && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-brand-edge bg-brand-soft px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-brand-dark">Do this next</p>
                  <p className="mt-0.5 text-[13.5px] font-medium text-ink">{development.view.nextAction.label}</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{development.view.nextAction.detail}</p>
                </div>
                <Button to={development.view.nextAction.to} size="sm">
                  Open
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}
          </Card>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Assessments completed" value={data.assessment.preSubmitted + data.assessment.postSubmitted} note={`${data.assessment.preSubmitted} pre · ${data.assessment.postSubmitted} post`} />
        <Stat
          label="Strand selected"
          value={data.selectedStrand ? data.selectedStrand.toUpperCase() : '—'}
          note={
            data.selectedStrand
              ? latest?.ranked[0]
                ? `Assessment top match: ${latest.ranked[0].code}`
                : 'Your choice, changeable any time'
              : 'Choose after reviewing results'
          }
        />
        <Stat label="Activities recorded" value={development?.view?.completedActivities ?? data.program?.progress.completed ?? 0} note={data.program ? `${data.program.progress.completed} of ${data.program.progress.total} in your current plan` : 'Build a plan to start'} />
        <Stat label="Support requests" value={data.openTickets} note="Open or in review" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          {latest ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Your latest guidance</h2>
                  <p className="mt-1 text-[13px] text-muted">
                    {latest.type === 'post' ? 'Post-assessment' : 'Pre-assessment'} · {formatDate(latest.submittedAt)} ·
                    questionnaire v{latest.questionnaireVersion ?? '—'}
                  </p>
                </div>
                <Chip tone="brand">Algorithm {latest.algorithmVersion}</Chip>
              </div>

              <ol className="mt-5 space-y-4">
                {topThree.map((strand) => (
                  <li key={strand.slug}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[14px] font-medium text-ink">
                        <span className="mr-2 text-faint">#{strand.rank}</span>
                        {strand.code}
                      </p>
                      <p className="text-[13px] tabular-nums text-muted">
                        {strand.score.toFixed(1)} on the alignment index
                      </p>
                    </div>
                    <div className="mt-1.5">
                      <ScoreBar percent={strand.score} label={`${strand.code} alignment ${strand.score.toFixed(1)}`} />
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                <Button to="/app/results" size="sm">
                  Full results and explanations
                </Button>
                <Button to="/app/strands/compare" variant="secondary" size="sm">
                  Compare strands
                </Button>
                <Button to="/app/history" variant="secondary" size="sm">
                  Assessment history
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={ClipboardListIcon}
              title="No completed assessment yet"
              description="The pre-assessment takes about ten minutes. It asks about interests, strengths, and how you prefer to work — there are no right answers."
              action={
                <Button to="/app/assessment">
                  Start the assessment
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Button>
              }
            />
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2">
              <TargetIcon className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="text-[15px] font-semibold text-ink">Your strand choice</h2>
            </div>
            {data.selectedStrand ? (
              <>
                <p className="mt-3 text-[26px] font-semibold tracking-[-0.02em] text-ink">{data.selectedStrand.toUpperCase()}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  Selecting a strand never locks you in. You can change it after any assessment, and STRANDPATH will
                  rebuild your preparation programme around the new choice.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button to="/app/program" size="sm" variant="secondary">
                    Open programme
                  </Button>
                  {data.program && (
                    <Button to={`/app/strands/${data.program.strandSlug}`} size="sm" variant="ghost">
                      Strand details
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  You have not chosen a strand yet. Review your results, explore alternatives, and choose when you are
                  ready.
                </p>
                <div className="mt-4">
                  <Button to={latest ? '/app/results' : '/app/strands'} size="sm" variant="secondary">
                    {latest ? 'Choose a strand' : 'Explore strands'}
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="text-[15px] font-semibold text-ink">Improvement programme</h2>
            </div>
            {data.program ? (
              <>
                <p className="mt-3 text-[14px] font-medium text-ink">{data.program.name}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">{data.program.goal}</p>
                <div className="mt-3">
                  <ScoreBar percent={data.program.progress.percent} tone="success" label="Programme progress" />
                </div>
                <p className="mt-2 text-[12px] text-muted">
                  {data.program.progress.completed} of {data.program.progress.total} activities complete
                </p>
                <div className="mt-3">
                  <Button to="/app/program" size="sm" variant="secondary">
                    Continue programme
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-[13px] leading-relaxed text-muted">
                  Programmes are generated from your assessment results and your chosen strand, with activities aimed at
                  the areas that scored lower.
                </p>
                <div className="mt-3">
                  <Button to="/app/program" size="sm" variant="secondary">
                    {data.selectedStrand ? 'Generate my programme' : 'See how programmes work'}
                  </Button>
                </div>
              </>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2">
              <MessageCircleIcon className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="text-[15px] font-semibold text-ink">Guidance and help</h2>
            </div>
            <div className="mt-3 space-y-2 text-[13px]">
              <Link to="/app/assistance" className="flex items-center justify-between rounded-md border border-line px-3 py-2 hover:border-brand">
                <span className="text-ink">Strand Assistance</span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-faint" aria-hidden />
              </Link>
              <Link to="/app/support" className="flex items-center justify-between rounded-md border border-line px-3 py-2 hover:border-brand">
                <span className="text-ink">Get help and support requests</span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-faint" aria-hidden />
              </Link>
              <Link to="/app/development" className="flex items-center justify-between rounded-md border border-line px-3 py-2 hover:border-brand">
                <span className="text-ink">My development journey and roadmap</span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-faint" aria-hidden />
              </Link>
              <Link to="/app/progress" className="flex items-center justify-between rounded-md border border-line px-3 py-2 hover:border-brand">
                <span className="text-ink">Progress and reassessment</span>
                <BarChart3Icon className="h-3.5 w-3.5 text-faint" aria-hidden />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {latest?.type === 'pre' && data.assessment.latestPost && (
        <div className="mt-6">
          <Alert tone="success" title="You have completed a follow-up assessment">
            Compare it with your baseline on the{' '}
            <Link to={`/app/results/${data.assessment.latestPost.id}`} className="font-semibold underline">
              post-assessment results
            </Link>
            .
          </Alert>
        </div>
      )}
    </div>
  );
}
