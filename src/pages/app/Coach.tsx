import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageCircleIcon, SendIcon, Trash2Icon } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { AiStatus, ChatMessage } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Alert, Card, ErrorState, LoadingBlock, PageHeader } from '../../components/ui/Primitives';

const suggestions = [
  'Explain my top two strands in simple terms.',
  'Why did my top strand rank highest?',
  'What can I do this month to prepare for my chosen strand?',
  'What is the difference between STEM and ICT?',
  'Which activities in my programme should I start with?'
];

export function Coach() {
  const [params] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [input, setInput] = useState(params.get('prompt') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    Promise.all([api.get<{ messages: ChatMessage[]; ai: AiStatus }>('/coach/messages'), api.get<AiStatus>('/ai/status')])
      .then(([history, ai]) => {
        setMessages(history.messages);
        setStatus({ ...ai, available: history.ai?.available ?? ai.available });
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    const optimistic: ChatMessage = { id: Date.now(), role: 'user', content: message, createdAt: new Date().toISOString() };
    setMessages((prev) => [...(prev ?? []), optimistic]);
    setInput('');
    try {
      const data = await api.post<{ message: ChatMessage }>('/coach/messages', { message });
      setMessages((prev) => [...(prev ?? []), data.message]);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('Clear this conversation? Your assessment records are not affected.')) return;
    try {
      await api.del('/coach/messages');
      setMessages([]);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (error && !messages) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!messages || !status) return <LoadingBlock label="Opening the Virtual Coach…" />;

  const available = status.available;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-[900px] flex-col px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Your coach"
        title="Ask the Virtual Coach"
        description="An AI assistant grounded in your STRANDPATH results. It explains; it does not score, decide, or replace your guidance counsellor."
        actions={
          messages.length > 0 ? (
            <Button variant="secondary" size="sm" onClick={clear}>
              <Trash2Icon className="h-4 w-4" aria-hidden />
              Clear conversation
            </Button>
          ) : undefined
        }
      />

      <div className="mt-4">
        <Alert tone={available ? 'info' : 'warn'} title={available ? `AI connected · ${status.model}` : 'AI is not available right now'}>
          {available ? status.note : status.configured ? status.note : `${status.note} Your scores, recommendations and programme still work without it.`}
        </Alert>
      </div>

      {error && <div className="mt-3"><Alert tone="danger">{error}</Alert></div>}

      <Card className="mt-4 flex-1 p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircleIcon className="mx-auto h-6 w-6 text-faint" aria-hidden />
            <p className="mt-3 text-[15px] font-semibold text-ink">Ask about your results or options</p>
            <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-muted">
              The coach reads your latest assessment, chosen strand and programme progress. It never invents scores and
              will say when something cannot be verified.
            </p>
            <div className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={!available}
                  onClick={() => send(suggestion)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
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
                <div
                  className={[
                    'max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-[13.5px] leading-relaxed',
                    message.role === 'user' ? 'bg-brand text-white' : 'border border-line bg-canvas text-ink'
                  ].join(' ')}
                >
                  {message.content}
                </div>
              </li>
            ))}
            {busy && (
              <li className="flex justify-start">
                <div className="rounded-lg border border-line bg-canvas px-4 py-3 text-[13px] text-muted" role="status">
                  Thinking…
                </div>
              </li>
            )}
          </ul>
        )}
        <div ref={endRef} />
      </Card>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="mt-3 flex items-end gap-2"
      >
        <label htmlFor="coach-input" className="sr-only">
          Message the Virtual Coach
        </label>
        <textarea
          id="coach-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          rows={2}
          maxLength={1200}
          disabled={!available || busy}
          placeholder={available ? 'Ask about your results, a strand, or what to do next…' : 'AI is unavailable — you can still use Support, results and your programme.'}
          className="min-h-[54px] flex-1 resize-none rounded-md border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-canvas"
        />
        <Button type="submit" disabled={!available || busy || !input.trim()}>
          <SendIcon className="h-4 w-4" aria-hidden />
          Send
        </Button>
      </form>
      <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
        AI responses can be wrong or incomplete. Verify school-specific requirements with your guidance office. For
        personal or mental-health concerns, talk to a trusted adult or your school counsellor — this assistant is not a
        counsellor.
      </p>
    </div>
  );
}
