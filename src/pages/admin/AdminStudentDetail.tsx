import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { AssessmentSummary, SupportTicket } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Alert, Card, Chip, ErrorState, LoadingBlock, PageHeader, ScoreBar, Select } from '../../components/ui/Primitives';

interface RecordData {
  student: { id: number; name: string; email: string; status: 'active' | 'suspended'; createdAt: string; lastLoginAt: string | null };
  profile: {
    gradeLevel: string | null;
    school: string | null;
    city: string | null;
    interests: string | null;
    strengths: string | null;
    goals: string | null;
    learningPreference: string | null;
    careerInterest: string | null;
    selectedStrand: string | null;
    consentAt: string | null;
  } | null;
  assessments: AssessmentSummary[];
  programs: { id: number; name: string; status: string; strand: string; createdAt: string; progress: { total: number; completed: number; percent: number } }[];
  tickets: SupportTicket[];
}

export function AdminStudentDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState<RecordData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null);
    api
      .get<RecordData>(`/admin/students/${id}`)
      .then(setData)
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, [id]);

  const setStatus = async (status: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await api.patch(`/admin/students/${id}`, { status });
      load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!data) return <LoadingBlock label="Loading student record…" />;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <Link to="/admin/students" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        All students
      </Link>
      <PageHeader
        eyebrow="Student record"
        title={data.student.name}
        description={`${data.student.email} · joined ${formatDate(data.student.createdAt)} · consent ${data.profile?.consentAt ? formatDate(data.profile.consentAt) : 'not recorded'}`}
        actions={
          user?.role === 'admin' ? (
            <div className="flex items-center gap-2">
              <Select value={data.student.status} onChange={(e) => setStatus(e.target.value)} disabled={busy} aria-label="Account status">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
            </div>
          ) : (
            <Chip tone={data.student.status === 'active' ? 'success' : 'accent'}>{data.student.status}</Chip>
          )
        }
      />

      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Profile</h2>
          <dl className="mt-3 space-y-2 text-[13px]">
            {[
              ['Grade', data.profile?.gradeLevel],
              ['School', data.profile?.school],
              ['City', data.profile?.city],
              ['Selected strand', data.profile?.selectedStrand?.toUpperCase() ?? null],
              ['Interests', data.profile?.interests],
              ['Strengths', data.profile?.strengths],
              ['Goals', data.profile?.goals],
              ['Learning preference', data.profile?.learningPreference],
              ['Career interest', data.profile?.careerInterest]
            ].map(([label, value]) => (
              <div key={label as string}>
                <dt className="text-[11.5px] uppercase tracking-[0.04em] text-faint">{label}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-ink">{value || '—'}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Assessments</h2>
            {data.assessments.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">No assessments started.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {data.assessments.map((assessment) => (
                  <li key={assessment.id} className="py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink">
                        #{assessment.id} · {assessment.type} · {assessment.status}
                      </p>
                      <span className="text-[11.5px] text-muted">{formatDate(assessment.submittedAt ?? assessment.startedAt, true)}</span>
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      Top: {assessment.topStrand ? `${assessment.topStrand.code} ${assessment.topStrand.score.toFixed(1)}` : '—'}
                      {assessment.selectedStrand ? ` · selected ${assessment.selectedStrand.toUpperCase()}` : ''}
                      {' · '}v{assessment.questionnaireVersion ?? '—'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Programmes</h2>
            {data.programs.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">No programmes.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {data.programs.map((program) => (
                  <li key={program.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-[13px] text-ink">{program.name}</p>
                      <span className="text-[11.5px] text-muted">{program.status} · {program.progress.completed}/{program.progress.total}</span>
                    </div>
                    <div className="mt-1"><ScoreBar percent={program.progress.percent} tone="success" label="Programme progress" /></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Support requests</h2>
            {data.tickets.length === 0 ? (
              <p className="mt-2 text-[13px] text-muted">No requests.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-[13px]">
                {data.tickets.map((ticket) => (
                  <li key={ticket.id} className="flex flex-wrap items-center justify-between gap-2">
                    <Link to="/admin/tickets" className="text-ink hover:text-brand">
                      #{ticket.id} · {ticket.subject}
                    </Link>
                    <Chip>{ticket.status}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Alert tone="info">
          Access to this record was logged with your staff account, including the date and time.
        </Alert>
      </div>
      <div className="mt-4">
        <Button to="/admin/students" variant="secondary" size="sm">Back to students</Button>
      </div>
    </div>
  );
}
