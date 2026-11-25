import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightIcon, HistoryIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { AssessmentSummary } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Card, Chip, EmptyState, ErrorState, LoadingBlock, PageHeader, Select } from '../../components/ui/Primitives';

export function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AssessmentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    api
      .get<{ assessments: AssessmentSummary[] }>('/assessments')
      .then((data) => {
        setItems(data.assessments);
        const submitted = data.assessments.filter((a) => a.status === 'submitted');
        if (submitted.length >= 2) {
          setTo(String(submitted[0].id));
          setFrom(String(submitted[1].id));
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const submitted = useMemo(() => (items ?? []).filter((a) => a.status === 'submitted'), [items]);

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!items) return <LoadingBlock label="Loading your history…" />;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Your records"
        title="My Previous Assessments"
        description="Every attempt is stored separately with the questionnaire and algorithm version used. Nothing is overwritten."
        actions={<Button to="/app/assessment" size="sm">Start a new assessment</Button>}
      />

      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={HistoryIcon}
            title="No assessments yet"
            description="Your first completed assessment will appear here."
            action={<Button to="/app/assessment">Start the pre-assessment</Button>}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-canvas text-[11px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-4 py-3 font-medium">Assessment</th>
                    <th scope="col" className="px-4 py-3 font-medium">Date</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Top alignment</th>
                    <th scope="col" className="px-4 py-3 font-medium">Selected</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">#{item.id} · {item.type === 'post' ? 'Post-assessment' : 'Pre-assessment'}</p>
                        <p className="mt-0.5 text-[11.5px] text-faint">
                          v{item.questionnaireVersion ?? '—'} · {item.algorithmVersion}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">{formatDate(item.submittedAt ?? item.startedAt, true)}</td>
                      <td className="px-4 py-3">
                        <Chip tone={item.status === 'submitted' ? 'success' : 'warn'}>
                          {item.status === 'submitted' ? 'Completed' : 'In progress'}
                        </Chip>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {item.topStrand ? `${item.topStrand.code} · ${item.topStrand.score.toFixed(1)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-ink">{item.selectedStrand ? item.selectedStrand.toUpperCase() : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {item.status === 'submitted' ? (
                          <Link to={`/app/results/${item.id}`} className="font-medium text-brand hover:text-brand-dark">
                            Results
                          </Link>
                        ) : (
                          <Link to={`/app/assessment/${item.id}/q/1`} className="font-medium text-brand hover:text-brand-dark">
                            Continue
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Card className="mt-6 p-5">
            <h2 className="text-[15px] font-semibold text-ink">Compare two attempts</h2>
            <p className="mt-1 text-[13px] text-muted">
              Differences are calculated from the stored scores of both attempts. The comparison does not claim that any
              activity caused a change.
            </p>
            {submitted.length < 2 ? (
              <p className="mt-3 text-[13px] text-faint">
                You need at least two submitted assessments to compare. Complete a post-assessment to see changes.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="text-[12px] text-muted">
                  From
                  <Select className="mt-1 min-w-[200px]" value={from} onChange={(e) => setFrom(e.target.value)}>
                    {submitted.map((a) => (
                      <option key={a.id} value={a.id}>
                        #{a.id} · {a.type} · {formatDate(a.submittedAt)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="text-[12px] text-muted">
                  To
                  <Select className="mt-1 min-w-[200px]" value={to} onChange={(e) => setTo(e.target.value)}>
                    {submitted.map((a) => (
                      <option key={a.id} value={a.id}>
                        #{a.id} · {a.type} · {formatDate(a.submittedAt)}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button
                  size="sm"
                  disabled={!from || !to || from === to}
                  onClick={() => navigate(`/app/compare?from=${from}&to=${to}`)}
                >
                  Compare
                  <ArrowRightIcon className="h-4 w-4" aria-hidden />
                </Button>
                {from === to && <p className="text-[12px] text-faint">Choose two different attempts.</p>}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
