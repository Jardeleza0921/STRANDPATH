import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Card, Chip, ErrorState, LoadingBlock, PageHeader, Stat } from '../../components/ui/Primitives';

interface Overview {
  counts: {
    students: number;
    activeStudents: number;
    submitted: number;
    pre: number;
    post: number;
    activePrograms: number;
    completedPrograms: number;
    completedActivities: number;
    openTickets: number;
    assessmentCompletionRate: number;
    selectionRate: number;
    verifiedStudents: number;
    unverifiedStudents: number;
    suspendedStudents: number;
    newStudents7d: number;
    newStudents30d: number;
    postParticipants: number;
    studentsWithPrograms: number;
    highPriorityTickets: number;
  };
  recentLogs: { id: number; action: string; target: string | null; createdAt: string; actor: string }[];
  recentAssessments: { id: number; type: string; submittedAt: string; student: string }[];
  recentRegistrations: { id: number; name: string; email: string; verified: boolean; createdAt: string }[];
}

export function AdminOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Overview>('/admin/overview')
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!data) return <LoadingBlock label="Loading administration overview…" />;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Administration"
        title="System overview"
        description="Aggregate activity from the school's STRANDPATH deployment. Individual records are only visible inside student pages and every access is logged."
        actions={<Link to="/admin/students" className="text-[13px] font-medium text-brand hover:text-brand-dark">Manage students →</Link>}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Students" value={data.counts.students} note={`${data.counts.activeStudents} active · ${data.counts.suspendedStudents} suspended`} />
        <Stat label="Pre-assessments" value={data.counts.pre} note={`${data.counts.assessmentCompletionRate}% of students`} />
        <Stat label="Follow-ups" value={data.counts.post} note={`${data.counts.postParticipants} students reassessed`} />
        <Stat label="Open support requests" value={data.counts.openTickets} note={`${data.counts.highPriorityTickets} high priority`} />
        <Stat label="Verified emails" value={data.counts.verifiedStudents} note={`${data.counts.unverifiedStudents} awaiting confirmation`} />
        <Stat label="New in 7 days" value={data.counts.newStudents7d} note={`${data.counts.newStudents30d} in 30 days`} />
        <Stat label="Students with a plan" value={data.counts.studentsWithPrograms} note={`${data.counts.activePrograms} active programmes`} />
        <Stat label="Activities completed" value={data.counts.completedActivities} note={`${data.counts.completedPrograms} programmes completed`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Recent submissions</h2>
          {data.recentAssessments.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No submitted assessments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.recentAssessments.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="text-[13px] text-ink">{item.student}</span>
                  <span className="text-[12px] text-muted">
                    {item.type} · {formatDate(item.submittedAt, true)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">Newest students</h2>
            <Link to="/admin/students" className="text-[12px] font-medium text-brand">View all</Link>
          </div>
          {data.recentRegistrations.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No student accounts yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {data.recentRegistrations.map((student) => (
                <li key={student.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] text-ink">{student.name}</span>
                    <span className="block truncate text-[11.5px] text-muted">{student.email}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Chip tone={student.verified ? 'success' : 'warn'}>{student.verified ? 'Confirmed' : 'Unconfirmed'}</Chip>
                    <span className="text-[11.5px] text-faint">{formatDate(student.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-ink">Recent administrative activity</h2>
            <Link to="/admin/logs" className="text-[12px] font-medium text-brand">View all</Link>
          </div>
          {data.recentLogs.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No administrative actions logged yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.recentLogs.map((log) => (
                <li key={log.id} className="text-[12px] text-muted">
                  <Chip>{log.action}</Chip>{' '}
                  <span className="text-ink">{log.actor}</span>
                  {log.target ? ` · ${log.target}` : ''} · {formatDate(log.createdAt, true)}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

    </div>
  );
}
