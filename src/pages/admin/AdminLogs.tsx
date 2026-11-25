import React, { useEffect, useState } from 'react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Card, ErrorState, LoadingBlock, PageHeader } from '../../components/ui/Primitives';

interface LogRow {
  id: number;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: string;
  actorRole: string | null;
}

export function AdminLogs() {
  const [logs, setLogs] = useState<LogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ logs: LogRow[] }>('/admin/logs?limit=200')
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;

  return (
    <div className="mx-auto max-w-[1050px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Audit"
        title="Administrative activity log"
        description="Sensitive administrative actions and student-record access are recorded here. Logs are append-only through the application."
      />

      {!logs ? (
        <LoadingBlock label="Loading logs…" />
      ) : logs.length === 0 ? (
        <Card className="mt-5 p-6 text-[13px] text-muted">No administrative activity recorded yet.</Card>
      ) : (
        <Card className="mt-5 overflow-hidden">
          <div className="max-h-[720px] overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[12.5px]">
              <thead className="sticky top-0 bg-canvas">
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.05em] text-faint">
                  <th scope="col" className="px-4 py-3 font-medium">When</th>
                  <th scope="col" className="px-4 py-3 font-medium">Actor</th>
                  <th scope="col" className="px-4 py-3 font-medium">Action</th>
                  <th scope="col" className="px-4 py-3 font-medium">Target</th>
                  <th scope="col" className="px-4 py-3 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-line/70 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2.5 text-muted">{formatDate(log.createdAt, true)}</td>
                    <td className="px-4 py-2.5 text-ink">
                      {log.actor}
                      {log.actorRole && <span className="text-[11px] text-faint"> ({log.actorRole})</span>}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-ink">{log.action}</td>
                    <td className="px-4 py-2.5 text-muted">{log.target ?? '—'}</td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 text-muted">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
