import React, { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { Card, ErrorState, LoadingBlock, PageHeader, ScoreBar, Stat } from '../../components/ui/Primitives';

interface Analytics {
  students: number;
  assessments: { pre: number; post: number };
  completionRate: number;
  recommendationDistribution: Record<string, number>;
  selectionDistribution: Record<string, number>;
  programs: { status: string; n: number }[];
  activities: { status: string; n: number }[];
  activityCompletionRate: number;
  reassessmentRate: number;
}

export function AdminAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Analytics>('/admin/analytics')
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!data) return <LoadingBlock label="Calculating analytics…" />;

  const recommendationTotal = Object.values(data.recommendationDistribution).reduce((a, b) => a + b, 0);
  const selectionTotal = Object.values(data.selectionDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Reports"
        title="Aggregate analytics"
        description="Counts only. No student names, emails or individual answers appear in these reports."
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered students" value={data.students} />
        <Stat label="Assessment completion" value={`${data.completionRate}%`} note={`${data.assessments.pre} pre-assessments`} />
        <Stat label="Reassessment rate" value={`${data.reassessmentRate}%`} note={`${data.assessments.post} post-assessments`} />
        <Stat label="Activity completion" value={`${data.activityCompletionRate}%`} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Top recommendation distribution</h2>
          <p className="mt-1 text-[11.5px] text-muted">Based on each student's most recent pre-assessment.</p>
          {recommendationTotal === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No submitted pre-assessments yet.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {Object.entries(data.recommendationDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([code, count]) => (
                  <li key={code}>
                    <div className="flex justify-between text-[12.5px]">
                      <span className="font-medium text-ink">{code}</span>
                      <span className="tabular-nums text-muted">{count} ({Math.round((count / recommendationTotal) * 100)}%)</span>
                    </div>
                    <div className="mt-1"><ScoreBar percent={(count / recommendationTotal) * 100} label={`${code} ${count}`} /></div>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Student-selected strands</h2>
          <p className="mt-1 text-[11.5px] text-muted">The choice is the student's; a mismatch with the top recommendation is not an error.</p>
          {selectionTotal === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No strand selections yet.</p>
          ) : (
            <ul className="mt-3 space-y-2.5">
              {Object.entries(data.selectionDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([code, count]) => (
                  <li key={code}>
                    <div className="flex justify-between text-[12.5px]">
                      <span className="font-medium text-ink">{code.toUpperCase()}</span>
                      <span className="tabular-nums text-muted">{count} ({Math.round((count / selectionTotal) * 100)}%)</span>
                    </div>
                    <div className="mt-1"><ScoreBar percent={(count / selectionTotal) * 100} tone="success" label={`${code} ${count}`} /></div>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Programmes by status</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {data.programs.length === 0 && <li className="text-muted">No programmes generated yet.</li>}
            {data.programs.map((row) => (
              <li key={row.status} className="flex justify-between">
                <span className="capitalize text-ink">{row.status}</span>
                <span className="tabular-nums text-muted">{row.n}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Programme activities by status</h2>
          <ul className="mt-3 space-y-2 text-[13px]">
            {data.activities.length === 0 && <li className="text-muted">No activities assigned yet.</li>}
            {data.activities.map((row) => (
              <li key={row.status} className="flex justify-between">
                <span className="capitalize text-ink">{row.status.replace('_', ' ')}</span>
                <span className="tabular-nums text-muted">{row.n}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <p className="mt-5 text-[11.5px] leading-relaxed text-faint">
        Aggregate figures are calculated directly from stored records. They describe participation, not learning
        outcomes; no controlled study has been conducted.
      </p>
    </div>
  );
}
