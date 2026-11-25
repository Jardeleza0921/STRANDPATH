import React, { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { AiStatus } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Alert, Card, ErrorState, Field, LoadingBlock, PageHeader, TextArea, TextInput } from '../../components/ui/Primitives';

interface SettingsData {
  settings: {
    aiEnabled: boolean;
    aiGrounding: { strands?: boolean; activities?: boolean; assessment?: boolean; careers?: boolean };
    retentionMonths: number;
    supportEmail: string;
    notice: string;
  };
  ai: AiStatus;
  questionnaire: { version: string; status: string; activated_at: string | null } | null;
  staff: { id: number; name: string; email: string; role: string }[];
}

export function AdminSettings() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [form, setForm] = useState<SettingsData['settings'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get<SettingsData>('/admin/settings')
      .then((result) => {
        setData(result);
        setForm(result.settings);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.put('/admin/settings', form);
      setMessage('Settings saved.');
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!data || !form) return <LoadingBlock label="Loading settings…" />;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Configuration"
        title="AI and system settings"
        description="AI is optional. Model credentials live only in server environment variables and are never editable or visible here."
      />

      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}
      {error && <div className="mt-4"><Alert tone="danger">{error}</Alert></div>}

      <div className="mt-5">
        <Alert tone={data.ai.configured ? 'success' : 'warn'} title={data.ai.configured ? `AI provider connected · ${data.ai.provider}` : 'AI provider not configured'}>
          {data.ai.configured ? (
            <span>
              Model: <code>{data.ai.model}</code>. Key source: <code>{data.ai.keySource}</code>. The key itself is never
              exposed to the browser or this page.
            </span>
          ) : (
            <span>
              Set <code>AI_API_KEY</code> (or <code>OPENAI_API_KEY</code>), optionally <code>AI_MODEL</code> and{' '}
              <code>AI_BASE_URL</code>, then restart the server. Coach and Support Agent chat stay disabled until then;
              all other features work.
            </span>
          )}
        </Alert>
      </div>

      <form onSubmit={save} className="mt-5 space-y-5">
        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">AI availability</h2>
          <label className="mt-3 flex items-center gap-2.5 text-[13px] text-ink">
            <input
              type="checkbox"
              checked={form.aiEnabled}
              onChange={(e) => setForm({ ...form, aiEnabled: e.target.checked })}
              className="h-4 w-4 rounded text-brand"
            />
            Enable AI features for students
          </label>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            Turning this off disables both chat endpoints immediately, even if a key is configured. Scores and
            programmes are unaffected.
          </p>

          <h3 className="mt-5 text-[13px] font-semibold text-ink">Approved context sources</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {[
              { key: 'strands', label: 'Strand descriptions and pathways' },
              { key: 'assessment', label: 'The student’s own assessment summary' },
              { key: 'activities', label: 'Programme activities' },
              { key: 'careers', label: 'College and career fields' }
            ].map((source) => (
              <label key={source.key} className="flex items-start gap-2 text-[12.5px] text-ink">
                <input
                  type="checkbox"
                  checked={Boolean((form.aiGrounding as Record<string, boolean>)[source.key])}
                  onChange={(e) =>
                    setForm({ ...form, aiGrounding: { ...form.aiGrounding, [source.key]: e.target.checked } })
                  }
                  className="mt-0.5 h-3.5 w-3.5 rounded text-brand"
                />
                {source.label}
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[15px] font-semibold text-ink">Privacy and support</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Record retention (months)" htmlFor="retention" hint="Stated to students; deletion is manual until a retention job is configured.">
              <TextInput
                id="retention"
                type="number"
                min={1}
                max={120}
                value={form.retentionMonths}
                onChange={(e) => setForm({ ...form, retentionMonths: Number(e.target.value) })}
              />
            </Field>
            <Field label="Support contact email" htmlFor="support-email">
              <TextInput
                id="support-email"
                value={form.supportEmail}
                onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Notice shown in the admin area" htmlFor="notice" hint="Optional. For example, a data-privacy contact or review deadline.">
              <TextArea id="notice" className="min-h-[80px]" value={form.notice} onChange={(e) => setForm({ ...form, notice: e.target.value })} />
            </Field>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
        </div>
      </form>

      <Card className="mt-5 p-5">
        <h2 className="text-[15px] font-semibold text-ink">Active questionnaire</h2>
        <p className="mt-2 text-[13px] text-muted">
          {data.questionnaire
            ? `Version ${data.questionnaire.version} · activated ${data.questionnaire.activated_at ? new Date(data.questionnaire.activated_at).toLocaleString() : 'unknown'}`
            : 'No active questionnaire version.'}
        </p>
        <p className="mt-2 text-[11.5px] text-faint">
          Manage versions under Questionnaire. Active versions are immutable; completed assessments keep the version
          they were scored with.
        </p>
      </Card>

      <Card className="mt-5 p-5">
        <h2 className="text-[15px] font-semibold text-ink">Staff accounts</h2>
        <ul className="mt-2 space-y-1.5 text-[13px]">
          {data.staff.map((person) => (
            <li key={person.id} className="flex flex-wrap justify-between gap-2">
              <span className="text-ink">{person.name} <span className="text-muted">({person.email})</span></span>
              <span className="capitalize text-muted">{person.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
          Guidance reviewers can see student records and support requests; only administrators can change settings,
          questionnaires, strands and activities.
        </p>
      </Card>
    </div>
  );
}
