import React, { useEffect, useState } from 'react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { SupportTicket } from '../../types/api';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Select,
  TextArea
} from '../../components/ui/Primitives';

interface TicketRow {
  id: number;
  subject: string;
  category: string;
  status: SupportTicket['status'];
  priority: SupportTicket['priority'];
  studentName: string;
  studentEmail: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

const statusTone = {
  open: 'warn',
  in_review: 'brand',
  resolved: 'success',
  closed: 'neutral'
} as const;

export function AdminTickets() {
  const [tickets, setTickets] = useState<TicketRow[] | null>(null);
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ticket, setTicket] = useState<(SupportTicket & { student?: { id: number; name: string; email: string } }) | null>(null);
  const [reply, setReply] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError(null);
    api
      .get<{ tickets: TicketRow[] }>(`/admin/tickets${filter ? `?status=${filter}` : ''}`)
      .then((data) => {
        setTickets(data.tickets);
        setSelectedId((current) => current ?? data.tickets[0]?.id ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, [filter]);

  useEffect(() => {
    if (!selectedId) {
      setTicket(null);
      return;
    }
    api
      .get<{ ticket: SupportTicket & { student?: { id: number; name: string; email: string } } }>(`/admin/tickets/${selectedId}`)
      .then((data) => setTicket(data.ticket))
      .catch((err) => setActionError(errorMessage(err)));
  }, [selectedId]);

  const patch = async (payload: Record<string, unknown>) => {
    if (!ticket) return;
    setBusy(true);
    setActionError(null);
    try {
      const data = await api.patch<{ ticket: SupportTicket }>(`/admin/tickets/${ticket.id}`, payload);
      setTicket({ ...data.ticket, student: ticket.student });
      load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!ticket || reply.trim().length < 2) return;
    setBusy(true);
    setActionError(null);
    try {
      const data = await api.post<{ ticket: SupportTicket }>(`/admin/tickets/${ticket.id}/messages`, { body: reply });
      setTicket({ ...data.ticket, student: ticket.student });
      setReply('');
      load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1150px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Support"
        title="Support requests"
        description="Student requests, classified and tracked. Replies are visible to the student and recorded with your staff account."
        actions={
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </Select>
        }
      />

      {error && <div className="mt-4"><ErrorState message={error} onRetry={load} /></div>}
      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}

      {!tickets ? (
        <LoadingBlock label="Loading support requests…" />
      ) : tickets.length === 0 ? (
        <Card className="mt-5 p-6 text-[13px] text-muted">No support requests with this filter.</Card>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
          <Card className="max-h-[640px] overflow-y-auto">
            <ul className="divide-y divide-line">
              {tickets.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className={`w-full px-4 py-3 text-left ${selectedId === row.id ? 'bg-brand-soft/50' : 'hover:bg-canvas'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-medium text-ink">#{row.id} · {row.subject}</p>
                      <Chip tone={statusTone[row.status]}>{row.status.replace('_', ' ')}</Chip>
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted">
                      {row.studentName} · {row.category} · {formatDate(row.updatedAt)}
                    </p>
                    {row.priority === 'high' && <p className="mt-1 text-[11px] font-medium text-accent">High priority</p>}
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            {!ticket ? (
              <p className="text-[13px] text-muted">Select a request to read it.</p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                  <div>
                    <h2 className="text-[16px] font-semibold text-ink">#{ticket.id} · {ticket.subject}</h2>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {ticket.student?.name} ({ticket.student?.email}) · {ticket.category} · opened {formatDate(ticket.createdAt, true)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Select value={ticket.status} onChange={(e) => patch({ status: e.target.value })} disabled={busy} aria-label="Ticket status">
                      <option value="open">Open</option>
                      <option value="in_review">In review</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Select>
                    <Select value={ticket.priority} onChange={(e) => patch({ priority: e.target.value })} disabled={busy} aria-label="Ticket priority">
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                </div>

                <ul className="mt-4 space-y-3">
                  {ticket.messages.map((message) => (
                    <li
                      key={message.id}
                      className={`rounded-md px-3.5 py-2.5 ${message.authorRole === 'student' ? 'bg-canvas' : 'border border-brand-edge bg-brand-soft'}`}
                    >
                      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint">
                        {message.authorName} · {message.authorRole} · {formatDate(message.createdAt, true)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{message.body}</p>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 border-t border-line pt-4">
                  <label htmlFor="admin-reply" className="text-[12px] font-medium text-ink">Reply to the student</label>
                  <TextArea
                    id="admin-reply"
                    className="mt-1.5 min-h-[90px]"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Explain what you found and what happens next…"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm" onClick={sendReply} disabled={busy || reply.trim().length < 2}>
                      {busy ? 'Sending…' : 'Send reply'}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
