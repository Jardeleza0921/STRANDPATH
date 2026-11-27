import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  CircleIcon,
  CompassIcon,
  FlagIcon,
  LayersIcon,
  MessageCircleIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon
} from 'lucide-react';
import { errorMessage, formatDate } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  ScoreBar,
  Stat
} from '../../components/ui/Primitives';
import { EVIDENCE_NOTE, READINESS_MEANING } from '../../development';
import type { DevelopmentBundle } from '../../development/load';
import { loadDevelopment } from '../../development/load';

const stageTone = {
  completed: 'success',
  current: 'brand',
  upcoming: 'neutral'
} as const;

export function Development() {
  const [bundle, setBundle] = useState<DevelopmentBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openStage, setOpenStage] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setBundle(null);
    loadDevelopment()
      .then((data) => {
        setBundle(data);
        setOpenStage(data.view?.stage.id ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const recommended = useMemo(() => {
    if (!bundle?.latest?.ranked?.length) return null;
    return bundle.latest.ranked[0];
  }, [bundle]);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!bundle) return <LoadingBlock label="Building your development pathway…" />;

  const { dashboard, view, latest, baseline } = bundle;

  if (!view) {
    const hasAssessment = Boolean(latest);
    return (
      <div className="mx-auto max-w-[960px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <PageHeader
          eyebrow="Development"
          title="My Development Journey"
          description="Choose the strand you want to pursue and STRANDPATH will build a staged plan around it — even if it is not the strand you currently match most closely."
        />
        <div className="mt-6">
          <EmptyState
            icon={CompassIcon}
            title={hasAssessment ? 'Choose the strand you want to pursue' : 'Start with the pre-assessment'}
            description={
              hasAssessment
                ? 'Your results show every strand, not only the top one. Pick the one you want to develop toward and your pathway will start from your current evidence, not from lesson one.'
                : 'The pre-assessment establishes your baseline. Every readiness number and plan after this point is built from real answers and completed work.'
            }
            action={
              <Button to={hasAssessment ? '/app/results' : '/app/assessment'}>
                {hasAssessment ? 'Review results and choose' : 'Take the pre-assessment'}
                <ArrowRightIcon className="h-4 w-4" aria-hidden />
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const topStage = view.stages.find((stage) => stage.status === 'current') ?? view.stages[view.stages.length - 1];
  const isAmbitious = recommended ? recommended.slug !== view.selectedStrand : false;

  return (
    <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow={`${view.pathway.code} · ${view.pathway.name}`}
        title="My Development Journey"
        description={`Build the abilities your chosen strand asks for, one stage at a time. This page shows where you are now, what you have improved, and the single best next step.`}
        actions={
          <>
            <Button to="/app/assistance" variant="secondary" size="sm">
              <MessageCircleIcon className="h-4 w-4" aria-hidden />
              Ask about my pathway
            </Button>
            <Button to="/app/results" variant="secondary" size="sm">
              Change target strand
            </Button>
          </>
        }
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
        <Chip tone="brand">Target: {view.pathway.code}</Chip>
        {recommended && <Chip>Assessment top match: {recommended.code}</Chip>}
        {latest && <Chip>{latest.type === 'post' ? 'Follow-up' : 'Baseline'} · {formatDate(latest.submittedAt)}</Chip>}
        <Chip>{view.completedActivities} activities recorded</Chip>
      </div>

      {isAmbitious && (
        <div className="mt-5">
          <Alert tone="info" title="You chose a strand that is not your top match">
            Your assessment put {recommended?.code} first; you chose {view.pathway.code}. That is allowed, and it is not
            a mistake. Your current evidence for {view.pathway.code} is {view.currentReadiness}/100, so the pathway
            starts with the foundations and builds toward the strand you actually want. Nothing here is a verdict on
            what you can learn.
          </Alert>
        </div>
      )}

      {view.nextAction && (
        <Card className="mt-5 border-brand-edge bg-brand-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 gap-3">
              <FlagIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-dark" aria-hidden />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-dark">Do this next</p>
                <h2 className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-ink">{view.nextAction.label}</h2>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-muted">{view.nextAction.detail}</p>
              </div>
            </div>
            <Button to={view.nextAction.to} size="sm">
              Open
              <ArrowRightIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Current readiness"
          value={`${view.currentReadiness}/100`}
          note={`Match with ${view.pathway.code} from your latest answers`}
        />
        <Stat
          label="Pathway evidence"
          value={`${view.targetReadiness}%`}
          note="Assessment evidence plus completed checkpoints"
        />
        <Stat label="Current stage" value={topStage.stage.name} note={`Target ${topStage.stage.target}% per dimension`} />
        <Stat
          label="Plan activities"
          value={view.remainingActivities > 0 ? `${view.remainingActivities} left` : view.completedActivities > 0 ? 'All done' : 'Not built'}
          note={
            view.remainingActivities > 0
              ? `${view.completedActivities} recorded in total`
              : view.completedActivities > 0
                ? 'Every activity in your plan is complete'
                : 'Build your plan to start practice'
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.015em] text-ink">Two different measurements</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">
                Your match describes today's answers. Your pathway evidence describes what you have actually
                demonstrated. They are not the same thing, and neither one decides your future.
              </p>
            </div>
            <TargetIcon className="h-5 w-5 text-brand" aria-hidden />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-medium text-ink">Current readiness · {view.pathway.code}</p>
                <p className="text-[13px] tabular-nums text-muted">{view.currentReadiness}%</p>
              </div>
              <div className="mt-1.5"><ScoreBar percent={view.currentReadiness} label="Current readiness" /></div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                Weighted alignment between your latest assessment answers and this strand's profile. It can be high
                while your skills are still developing, or lower while you are already building them.
              </p>
            </div>
            <div>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13.5px] font-medium text-ink">Pathway progress · {topStage.stage.name}</p>
                <p className="text-[13px] tabular-nums text-muted">{view.progressPercent}%</p>
              </div>
              <div className="mt-1.5"><ScoreBar percent={view.progressPercent} tone="success" label="Pathway progress" /></div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{EVIDENCE_NOTE}</p>
            </div>
          </div>

          <details className="mt-4 rounded-md border border-line bg-canvas px-4 py-3">
            <summary className="cursor-pointer text-[12.5px] font-medium text-ink">What 100% means here</summary>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{READINESS_MEANING}</p>
            <ul className="mt-2 space-y-1 text-[12px] text-muted">
              <li>Met: {view.criteriaMet.length ? view.criteriaMet.join(', ') : 'nothing yet'}.</li>
              <li>Remaining: {view.criteriaRemaining.length ? view.criteriaRemaining.join(', ') : 'nothing — criteria complete'}.</li>
            </ul>
          </details>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="text-[15px] font-semibold text-ink">
                {view.improvedSkills.length ? 'What has improved' : 'What to build next'}
              </h2>
            </div>
            {view.improvedSkills.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {view.improvedSkills.map((skill) => (
                  <li key={skill.key} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-ink">{skill.label}</span>
                    <Chip tone="success">+{skill.percent} pts</Chip>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                No improvement is recorded yet. Improvement appears after a follow-up assessment, or when a knowledge
                check scores above your assessment evidence. Practice alone is not counted as a score increase.
              </p>
            )}

            {view.skillsToImprove.length > 0 && (
              <div className="mt-4 border-t border-line pt-3">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.05em] text-faint">Still developing</p>
                <ul className="mt-2 space-y-2">
                  {view.skillsToImprove.map((skill) => (
                    <li key={skill.key}>
                      <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                        <span className="text-ink">{skill.label}</span>
                        <span className="tabular-nums text-muted">{skill.percent}% / {skill.target}%</span>
                      </div>
                      <div className="mt-1"><ScoreBar percent={skill.percent} tone="muted" label={skill.label} /></div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <LayersIcon className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="text-[15px] font-semibold text-ink">Transferable practice</h2>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              {view.transferableSkills.length
                ? `Your completed work already covers ${view.transferableSkills.join(', ')}. If you change strands, these carry over instead of restarting from zero.`
                : 'Complete a few activities and the skills you practise will carry over if you change strands later.'}
            </p>
            {baseline && latest && latest.type === 'post' && (
              <p className="mt-2 text-[12px] leading-relaxed text-faint">
                Comparing {formatDate(baseline.submittedAt)} with {formatDate(latest.submittedAt)}.
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button to="/app/progress" variant="secondary" size="sm">Progress history</Button>
              <Button to="/app/post-assessment" variant="ghost" size="sm">Follow-up assessment</Button>
            </div>
          </Card>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="roadmap-heading">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="roadmap-heading" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">Your roadmap</h2>
            <p className="mt-1 text-[13px] text-muted">
              Five stages from foundation to target readiness. Each one names the evidence it needs and the work that
              builds it.
            </p>
          </div>
          <Button to="/app/program" variant="secondary" size="sm">
            <SparklesIcon className="h-4 w-4" aria-hidden />
            {dashboard.program ? 'Open my plan' : 'Build my plan'}
          </Button>
        </div>

        <ol className="mt-4 space-y-3">
          {view.stages.map((stage, index) => {
            const expanded = openStage === stage.stage.id;
            return (
              <li key={stage.stage.id}>
                <Card className={`p-5 ${stage.status === 'current' ? 'border-brand' : ''}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      {stage.status === 'completed' ? (
                        <CheckCircle2Icon className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                      ) : (
                        <CircleIcon className={`mt-0.5 h-5 w-5 shrink-0 ${stage.status === 'current' ? 'text-brand' : 'text-faint'}`} aria-hidden />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[12px] font-semibold tabular-nums text-faint">Stage {index + 1}</p>
                          <Chip tone={stageTone[stage.status]}>
                            {stage.status === 'completed' ? 'Completed' : stage.status === 'current' ? 'Current stage' : 'Upcoming'}
                          </Chip>
                          {stage.demonstrated && <Chip tone="success">Demonstrated — can skip</Chip>}
                        </div>
                        <h3 className="mt-1 text-[16px] font-semibold text-ink">{stage.stage.name}</h3>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{stage.stage.summary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[15px] font-semibold tabular-nums text-ink">{stage.percent}%</p>
                      <p className="text-[11px] text-faint">of this stage</p>
                    </div>
                  </div>

                  <div className="mt-3"><ScoreBar percent={stage.percent} tone={stage.status === 'completed' ? 'success' : 'brand'} label={`${stage.stage.name} progress`} /></div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {stage.requirements.map((requirement) => (
                      <div key={requirement.category} className="rounded-md bg-canvas px-3 py-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-[12.5px] text-ink">{requirement.label}</p>
                          <p className={`text-[11.5px] tabular-nums ${requirement.met ? 'text-success' : 'text-muted'}`}>
                            {requirement.percent}% / {requirement.target}%
                          </p>
                        </div>
                        <div className="mt-1"><ScoreBar percent={requirement.percent} tone={requirement.met ? 'success' : 'muted'} label={requirement.label} /></div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[12px] leading-relaxed text-muted">
                    <span className="font-medium text-ink">Checkpoint:</span> {stage.stage.checkpoint}
                  </p>

                  <button
                    type="button"
                    onClick={() => setOpenStage(expanded ? null : stage.stage.id)}
                    aria-expanded={expanded}
                    className="mt-3 text-[12.5px] font-medium text-brand hover:text-brand-dark"
                  >
                    {expanded ? 'Hide what to practise' : 'Show what to practise'}
                  </button>

                  {expanded && (
                    <ul className="mt-3 space-y-2 border-t border-line pt-3">
                      {stage.stage.modules.map((module) => (
                        <li key={module.title} className="rounded-md border border-line px-3 py-2.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[13px] font-medium text-ink">{module.title}</p>
                            <span className="text-[11px] text-faint">{module.minutes} min</span>
                          </div>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{module.detail}</p>
                        </li>
                      ))}
                      <li className="text-[12px] text-faint">
                        Your plan picks activities from the activity library that develop these dimensions. It starts at
                        the stage your evidence supports, not at the beginning of the list.
                      </li>
                    </ul>
                  )}
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="mt-6 text-[12px] leading-relaxed text-faint">
        Changing strands never erases your work. Your earlier activities stay in your record, skills you already
        practised are reused where the new pathway needs them, and only the plan is rebuilt around the new requirements.
        Read more in <Link to="/methodology" className="font-medium text-brand">the methodology</Link>.
      </p>
    </div>
  );
}
