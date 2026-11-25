import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, Chip, ErrorState, LoadingBlock, PageHeader, Select, TextInput } from '../../components/ui/Primitives';

interface StudentRow {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  gradeLevel: string | null;
  school: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  assessments: number;
  selections: number;
  activePrograms: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  pages: number;
}

export function AdminStudents() {
  const [students, setStudents] = useState<StudentRow[] | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 25, total: 0, pages: 1 });
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = () => {
    setError(null);
    api
      .get<{ students: StudentRow[]; pagination: Pagination }>(
        `/admin/students?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${page}&pageSize=25`
      )
      .then((data) => {
        setStudents(data.students);
        setPagination(data.pagination);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, page]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const from = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = Math.min(pagination.total, pagination.page * pagination.pageSize);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Students"
        title="Student accounts"
        description="Search all registered students with server-side pagination. Opening a student's record is an auditable action; use it only when supporting that student."
      />

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="text-[12px] text-muted">
          Search
          <TextInput
            className="mt-1 min-w-[260px]"
            placeholder="Name, email or school"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="text-[12px] text-muted">
          Status
          <Select className="mt-1" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
        </label>
        <p className="ml-auto text-[12px] text-faint" aria-live="polite">
          {from}–{to} of {pagination.total}
        </p>
      </div>

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}

      {!students ? (
        <LoadingBlock label="Loading students…" />
      ) : students.length === 0 ? (
        <Card className="mt-5 p-6 text-[13px] text-muted">No students match this search.</Card>
      ) : (
        <Card className="mt-5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface2/60 text-[11px] uppercase tracking-[0.05em] text-faint">
                  <th scope="col" className="px-4 py-3 font-medium">Student</th>
                  <th scope="col" className="px-4 py-3 font-medium">Grade / school</th>
                  <th scope="col" className="px-4 py-3 font-medium">Assessments</th>
                  <th scope="col" className="px-4 py-3 font-medium">Selections</th>
                  <th scope="col" className="px-4 py-3 font-medium">Email</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Last sign-in</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-line/70 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{student.name}</p>
                      <p className="text-[11.5px] text-muted">#{student.id} · joined {formatDate(student.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {student.gradeLevel ?? '—'}
                      <br />
                      <span className="text-[11.5px]">{student.school ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-ink">{student.assessments}</td>
                    <td className="px-4 py-3 text-ink">{student.selections}</td>
                    <td className="px-4 py-3">
                      <Chip tone={student.emailVerified ? 'success' : 'warn'}>
                        {student.emailVerified ? 'Confirmed' : 'Unconfirmed'}
                      </Chip>
                    </td>
                    <td className="px-4 py-3">
                      <Chip tone={student.status === 'active' ? 'success' : 'accent'}>{student.status}</Chip>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(student.lastLoginAt, true)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/students/${student.id}`} className="font-medium text-brand hover:text-brand-dark">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-[12px] text-muted">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeftIcon className="h-4 w-4" aria-hidden />
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>
      )}

      <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
        Suspending an account ends its sessions immediately. Students keep their records unless the account is deleted by
        the student from Settings.
      </p>
    </div>
  );
}
