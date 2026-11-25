import React, { useEffect, useState } from 'react';
import { LifeBuoyIcon, SendIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { AiStatus, ChatMessage, SupportTicket } from '../../types/api';
import { Button } from '../../components/ui/Button';
import {
  Alert,
  Card,
  Chip,
  ErrorState,
  Field,
  LoadingBlock,
  PageHeader,
  Select,
  TextArea,
  TextInput
} from '../../components/ui/Primitives';

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

export function Support() {
  const [tab, setTab] = useState<'agent' | 'requests'>('agent');
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    Promise.all([api.get<{ messages: ChatMessage[]; ai: AiStatus }>('/support/messages'), api.get<AiStatus>('/ai/status')])
      .then(([history, ai]) => {
        setMessages(history.messages);
        setStatus({ ...ai, available: history.ai?.available ?? ai.available });
      })
      .catch((err) => setError(errorMessage(err)));
    loadTickets();
  }, []);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    const optimistic: ChatMessage = { id: Date.now(), role: 'user', content: message, createdAt: new Date().toISOString() };
    setMessages((prev) => [...(prev ?? []), optimistic]);
    setInput('');
    try {
      const data = await api.post<{ message: ChatMessage }>('/support/messages', { message });
      setMessages((prev) => [...(prev ?? []), data.message]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault();
    setSendingTicket(true);
    setTicketError(null);
    setTicketMessage(null);
    try {
      const data = await api.post<{ ticket: SupportTicket }>('/support/tickets', ticketForm);
      setTicketMessage(`Request #${data.ticket.id} created. Your guidance office can now see it.`);
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

  if (error && !messages) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!messages || !status || !tickets) return <LoadingBlock label="Loading support…" />;

  return (
    <div className="mx-auto max-w-[980px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Support"
        title="Get Help"
        description="The Support Agent helps with accounts, navigation and technical problems. Academic guidance lives in the Virtual Coach. Anything that needs a person becomes a support request your guidance office can answer."
      />

      <div className="mt-5 flex gap-2" role="tablist" aria-label="Support sections">
        {[
          { key: 'agent', label: 'Support Agent' },
          { key: 'requests', label: `Support requests (${tickets.filter((t) => t.status === 'open' || t.status === 'in_review').length})` }
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            onClick={() => setTab(item.key as 'agent' | 'requests')}
            className={[
              'rounded-full border px-4 py-1.5 text-[13px] font-medium',
              tab === item.key ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'agent' ? (
        <>
          <div className="mt-4">
            <Alert tone={status.available ? 'info' : 'warn'} title={status.available ? `Support Agent available · ${status.model}` : 'Support Agent is not available'}>
              {status.available
                ? 'This agent answers system questions only. It cannot change your records or see other students.'
                : `${status.note} You can still create a support request below.`}
            </Alert>
          </div>
          {error && <div className="mt-3"><Alert tone="danger">{error}</Alert></div>}

          <Card className="mt-4 p-4 sm:p-5">
            {messages.length === 0 ? (
              <div className="py-8 text-center">
                <LifeBuoyIcon className="mx-auto h-6 w-6 text-faint" aria-hidden />
                <p className="mt-3 text-[15px] font-semibold text-ink">What do you need help with?</p>
                <div className="mx-auto mt-4 flex max-w-lg flex-wrap justify-center gap-2">
                  {['How do I resume my assessment?', 'Where can I find my results?', 'How do I change my password?', 'My page will not load.'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={!status.available}
                      onClick={() => send(suggestion)}
                      className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted hover:border-brand hover:text-brand disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {messages.map((message) => (
                  <li key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className={[
                      'max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-[13.5px] leading-relaxed',
                      message.role === 'user' ? 'bg-ink text-white' : 'border border-line bg-canvas text-ink'
                    ].join(' ')}>
                      {message.content}
                    </div>
                  </li>
                ))}
                {busy && <li className="text-[13px] text-muted" role="status">Thinking…</li>}
              </ul>
            )}
          </Card>

          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
          >
            <label htmlFor="support-input" className="sr-only">Message the Support Agent</label>
            <textarea
              id="support-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!status.available || busy}
              maxLength={1200}
              placeholder="Describe what you are trying to do and what happened…"
              className="min-h-[54px] flex-1 resize-none rounded-md border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-canvas"
            />
            <Button type="submit" disabled={!status.available || busy || !input.trim()}>
              <SendIcon className="h-4 w-4" aria-hidden />
              Send
            </Button>
          </form>
          <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
            The Support Agent never asks for your password. For account recovery or missing records, submit a support
            request.
          </p>
        </>
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
                    onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  />
                </Field>
                <Field label="Category" htmlFor="category">
                  <Select id="category" value={ticketForm.category} onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
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
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  />
                </Field>
                <Field label="Priority" htmlFor="priority">
                  <Select id="priority" value={ticketForm.priority} onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}>
                    <option value="low">Low — not blocking</option>
                    <option value="normal">Normal</option>
                    <option value="high">High — cannot continue</option>
                  </Select>
                </Field>
                <Button type="submit" full disabled={sendingTicket}>
                  {sendingTicket ? 'Sending…' : 'Submit request'}
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
                                onChange={(e) => setReply(e.target.value)}
                                placeholder="Add a reply…"
                                className="min-h-[46px] text-[13px]"
                              />
                              <Button type="button" size="sm" onClick={() => sendReply(ticket.id)} disabled={reply.trim().length < 2}>
                                Reply
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
