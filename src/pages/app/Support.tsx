import React, { useEffect, useState } from 'react';
import { LifeBuoyIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { SupportTicket } from '../../types/api';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  Field,
  LoadingBlock,
  PageHeader,
  Select,
  TextArea,
  TextInput
} from '../../components/ui/Primitives';
import { isStaticMode, STATIC_STORAGE_NOTICE } from '../../lib/mode';

const categories = [
  { value: 'account', label: 'Account or sign-in' },
  { value: 'assessment', label: 'Assessment or results' },
  { value: 'improvement-programme', label: 'Improvement programme' },
  { value: 'technical', label: 'Technical problem' },
  { value: 'privacy', label: 'Privacy or data request' },
  { value: 'other', label: 'Something else' }
];

const statusTone = {
  open: 'warn',
  in_review: 'brand',
  resolved: 'success',
  closed: 'neutral'
} as const;

const helpTopics = [
  {
    title: 'Resume an unfinished assessment',
    body: 'Open “Let’s Get Started”. If an attempt is in progress it appears at the top with a Resume button; your saved answers are kept.'
  },
  {
    title: 'Find your results',
    body: 'Your latest submitted attempt is under “Your Suggested Strands”. Every earlier attempt is under “My Previous Assessments”, with the questionnaire and algorithm version used.'
  },
  {
    title: 'Choose or change a strand',
    body: 'On the results page, choose a strand from the ranked list. You can change it after any assessment; your improvement plan is rebuilt around the new choice.'
  },
  {
    title: 'Recover or change a password',
    body: isStaticMode()
      ? 'This static build cannot send email, so password reset is not available. You can change your password from Settings if you remember it. Local records cannot be recovered if the password is lost.'
      : 'Use “Forgot password?” on the sign-in page. If email delivery is configured, a single-use code is sent. Signed-in students can change their password from Settings.'
  },
  {
    title: 'Export or delete your records',
    body: 'Profile → “Export my records” downloads a JSON copy. Settings → “Delete my account” removes the account and its local records from this browser.'
  },
  {
    title: 'Understand a recommendation',
    body: 'Ask Strand Assistance for an explanation, or open “Show evidence” on a ranked strand to see the dimensions and answers that contributed.'
  }
];

export function Support() {
  const [tab, setTab] = useState<'help' | 'requests'>('help');
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [openTicket, setOpenTicket] = useState<number | null>(null);
  const [reply, setReply] = useState('');
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'assessment', message: '', priority: 'normal' });
  const [ticketMessage, setTicketMessage] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [sendingTicket, setSendingTicket] = useState(false);

  const loadTickets = () => {
    api
      .get<{ tickets: SupportTicket[] }>('/support/tickets')
      .then((data) => setTickets(data.tickets))
      .catch((err) => setTicketError(errorMessage(err)));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendingTicket(true);
    setTicketError(null);
    setTicketMessage(null);
    try {
      const data = await api.post<{ ticket: SupportTicket }>('/support/tickets', ticketForm);
      setTicketMessage(
        isStaticMode()
          ? `Request #${data.ticket.id} saved in this browser. It is not sent anywhere — show it to your guidance office directly.`
          : `Request #${data.ticket.id} created. Your guidance office can now see it.`
      );
      setTicketForm({ subject: '', category: 'assessment', message: '', priority: 'normal' });
      loadTickets();
      setOpenTicket(data.ticket.id);
    } catch (err) {
      setTicketError(errorMessage(err));
    } finally {
      setSendingTicket(false);
    }
  };

  const sendReply = async (ticketId: number) => {
    if (reply.trim().length < 2) return;
    try {
      await api.post(`/support/tickets/${ticketId}/messages`, { body: reply });
      setReply('');
      loadTickets();
    } catch (err) {
      setTicketError(errorMessage(err));
    }
  };

  if (!tickets) return <LoadingBlock label="Loading support…" />;

  return (
    <div className="mx-auto max-w-[980px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Support"
        title="Get Help"
        description="Answers to common account and assessment questions, plus a record of anything you want to raise with your guidance office. Academic guidance lives in Strand Assistance."
      />

      {isStaticMode() && (
        <div className="mt-4">
          <Alert tone="info" title="This static build keeps support requests on your device">
            {STATIC_STORAGE_NOTICE} Requests are a private record you can show to your school; they are not transmitted.
          </Alert>
        </div>
      )}

      <div className="mt-5 flex gap-2" role="tablist" aria-label="Support sections">
        {[
          { key: 'help', label: 'Help topics' },
          { key: 'requests', label: `Support requests (${tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_review').length})` }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key as 'help' | 'requests')}
            className={[
              'rounded-full border px-4 py-1.5 text-[13px] font-medium',
              tab === item.key ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'help' ? (
        <div className="mt-4 space-y-3">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <LifeBuoyIcon className="h-4 w-4 text-brand" aria-hidden />
              <h2 className="text-[15px] font-semibold text-ink">Common questions</h2>
            </div>
            <dl className="mt-3 divide-y divide-line">
              {helpTopics.map((topic) => (
                <div key={topic.title} className="py-3">
                  <dt className="text-[13.5px] font-medium text-ink">{topic.title}</dt>
                  <dd className="mt-1 text-[12.5px] leading-relaxed text-muted">{topic.body}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Ask about a strand, course or career</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Strand Assistance explains recommendations, compares strands, lists college directions and suggests skills
              to build. It works offline from a local knowledge base.
            </p>
            <div className="mt-3">
              <Button to="/app/assistance" size="sm">
                Open Strand Assistance
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">New support request</h2>
            <Card className="mt-3 p-5">
              <form onSubmit={submitTicket} className="space-y-3.5">
                {ticketMessage && <Alert tone="success">{ticketMessage}</Alert>}
                {ticketError && <Alert tone="danger">{ticketError}</Alert>}
                <Field label="Subject" htmlFor="subject" required>
                  <TextInput
                    id="subject"
                    required
                    minLength={4}
                    maxLength={160}
                    value={ticketForm.subject}
                    onChange={(event) => setTicketForm({ ...ticketForm, subject: event.target.value })}
                  />
                </Field>
                <Field label="Category" htmlFor="category">
                  <Select id="category" value={ticketForm.category} onChange={(event) => setTicketForm({ ...ticketForm, category: event.target.value })}>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="What happened?" htmlFor="message" hint="Include the page and what you expected to see." required>
                  <TextArea
                    id="message"
                    required
                    minLength={10}
                    maxLength={4000}
                    value={ticketForm.message}
                    onChange={(event) => setTicketForm({ ...ticketForm, message: event.target.value })}
                  />
                </Field>
                <Field label="Priority" htmlFor="priority">
                  <Select id="priority" value={ticketForm.priority} onChange={(event) => setTicketForm({ ...ticketForm, priority: event.target.value })}>
                    <option value="low">Low — not blocking</option>
                    <option value="normal">Normal</option>
                    <option value="high">High — cannot continue</option>
                  </Select>
                </Field>
                <Button type="submit" full disabled={sendingTicket}>
                  {sendingTicket ? 'Saving…' : 'Save request'}
                </Button>
              </form>
            </Card>
          </div>

          <div>
            <h2 className="text-[16px] font-semibold text-ink">Your requests</h2>
            {tickets.length === 0 ? (
              <Card className="mt-3 p-5 text-[13px] text-muted">No support requests yet.</Card>
            ) : (
              <ul className="mt-3 space-y-3">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Card className="p-4">
                      <button
                        type="button"
                        onClick={() => setOpenTicket(openTicket === ticket.id ? null : ticket.id)}
                        className="flex w-full items-start justify-between gap-3 text-left"
                        aria-expanded={openTicket === ticket.id}
                      >
                        <div>
                          <p className="text-[13.5px] font-medium text-ink">#{ticket.id} · {ticket.subject}</p>
                          <p className="mt-0.5 text-[11.5px] text-muted">
                            {ticket.category} · updated {formatDate(ticket.updatedAt, true)}
                          </p>
                        </div>
                        <Chip tone={statusTone[ticket.status]}>{ticket.status.replace('_', ' ')}</Chip>
                      </button>

                      {openTicket === ticket.id && (
                        <div className="mt-3 border-t border-line pt-3">
                          <ul className="space-y-2.5">
                            {ticket.messages.map((message) => (
                              <li key={message.id} className="rounded-md bg-canvas px-3 py-2.5">
                                <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-faint">
                                  {message.authorName} · {message.authorRole} · {formatDate(message.createdAt, true)}
                                </p>
                                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{message.body}</p>
                              </li>
                            ))}
                          </ul>
                          {ticket.status !== 'closed' && (
                            <div className="mt-3 flex items-end gap-2">
                              <label htmlFor={`reply-${ticket.id}`} className="sr-only">Reply</label>
                              <TextArea
                                id={`reply-${ticket.id}`}
                                rows={2}
                                value={reply}
                                onChange={(event) => setReply(event.target.value)}
                                placeholder="Add a note for your guidance office…"
                                className="min-h-[46px] text-[13px]"
                              />
                              <Button type="button" size="sm" onClick={() => sendReply(ticket.id)} disabled={reply.trim().length < 2}>
                                Add
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
