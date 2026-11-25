import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3Icon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Comparison, Programme } from '../../types/api';
import { ComparisonBlock } from '../../components/app/Comparison';
import { Button } from '../../components/ui/Button';
import { Card, Chip, EmptyState, ErrorState, LoadingBlock, PageHeader, ScoreBar, Stat } from '../../components/ui/Primitives';

interface ProgressData {
  series: {
    id: number;
    type: 'pre' | 'post';
    submittedAt: string;
    categories: { key: string; label: string; percent: number }[];
    topStrand: { code: string; score: number } | null;
    selectedStrand: string | null;
  }[];
  comparisons: { currentAssessmentId: number; comparison: Comparison }[];
  programs: Programme[];
  completedActivities: {
    programId: number;
    programName: string;
    title: string;
    category: string;
    completedAt: string;
    checkScore: number | null;
  }[];
  summary: {
    assessments: number;
    preAssessments: number;
    postAssessments: number;
    activitiesCompleted: number;
    programsCompleted: number;
  };
}

export function Progress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<ProgressData>('/progress')
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!data) return <LoadingBlock label="Loading your progress…" />;

  const latest = [...data.series].reverse()[0];
  const latestComparison = data.comparisons[data.comparisons.length - 1]?.comparison;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Progress"
        title="Track My Progress"
        description="Only recorded data appears here: submitted assessments, activity completions, and the differences between attempts."
        actions={<Button to="/app/post-assessment" size="sm" variant="secondary">Take the follow-up</Button>}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Assessments" value={data.summary.assessments} note={`${data.summary.preAssessments} pre · ${data.summary.postAssessments} post`} />
        <Stat label="Activities completed" value={data.summary.activitiesCompleted} />
        <Stat label="Programmes completed" value={data.summary.programsCompleted} />
        <Stat label="Latest alignment" value={latest?.topStrand ? `${latest.topStrand.code} ${latest.topStrand.score.toFixed(0)}` : '—'} />
      </div>

      {!data.series.length ? (
        <div className="mt-8">
          <EmptyState
            icon={BarChart3Icon}
            title="Nothing recorded yet"
            description="Complete an assessment and an activity to start a progress record."
            action={<Button to="/app/assessment">Start the assessment</Button>}
          />
        </div>
      ) : (
        <>
          <Card className="mt-6 p-6">
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">Latest dimension profile</h2>
            <p className="mt-1 text-[12.5px] text-muted">
              {latest?.type === 'post' ? 'Post-assessment' : 'Pre-assessment'} · {formatDate(latest?.submittedAt)}
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {latest?.categories.map((category) => (
                <li key={category.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[13px] text-ink">{category.label}</span>
                    <span className="text-[12px] tabular-nums text-muted">{category.percent}%</span>
                  </div>
                  <div className="mt-1"><ScoreBar percent={category.percent} label={`${category.label} ${category.percent} percent`} /></div>
                </li>
              ))}
            </ul>
          </Card>

          {latestComparison ? (
            <ComparisonBlock comparison={latestComparison} />
          ) : (
            <div className="mt-6 rounded-lg border border-line bg-surface p-5 text-[13px] leading-relaxed text-muted">
              No post-assessment yet, so there is nothing to compare. The post-assessment becomes available once you
              have a baseline; it takes about the same time as the first attempt.
              <div className="mt-3">
                <Button to="/app/post-assessment" size="sm" variant="secondary">See the post-assessment</Button>
              </div>
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">Assessment timeline</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
              {[...data.series].reverse().map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">
                      #{entry.id} · {entry.type === 'post' ? 'Post-assessment' : 'Pre-assessment'}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {formatDate(entry.submittedAt, true)} · top {entry.topStrand ? `${entry.topStrand.code} ${entry.topStrand.score.toFixed(1)}` : '—'}
                      {entry.selectedStrand ? ` · selected ${entry.selectedStrand.toUpperCase()}` : ''}
                    </p>
                  </div>
                  <Button to={`/app/results/${entry.id}`} variant="secondary" size="sm">Open</Button>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {data.programs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">Programmes</h2>
          <ul className="mt-3 space-y-2">
            {data.programs.map((program) => (
              <li key={program.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="text-[13.5px] font-medium text-ink">{program.name}</p>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {program.status} · {program.progress.completed}/{program.progress.total} activities · started {formatDate(program.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip tone={program.status === 'completed' ? 'success' : program.status === 'active' ? 'brand' : 'neutral'}>
                      {program.progress.percent}%
                    </Chip>
                    {program.status === 'active' && (
                      <Button to="/app/program" variant="secondary" size="sm">Open</Button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.completedActivities.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">Completed activities</h2>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {data.completedActivities.map((activity, index) => (
              <li key={`${activity.programId}-${activity.title}-${index}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div>
                  <p className="text-[13.5px] text-ink">{activity.title}</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {activity.category} · {formatDate(activity.completedAt)}
                  </p>
                </div>
                {activity.checkScore !== null && <Chip tone={activity.checkScore >= 60 ? 'success' : 'warn'}>Check {activity.checkScore}%</Chip>}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-faint">
            Activity completion is recorded from student reflections. It shows participation, not measured skill gain;
            only an assessment can show changes in reported answers. See{' '}
            <Link to="/app/history" className="font-medium text-brand">assessment history</Link>.
          </p>
        </section>
      )}
    </div>
  );
}
