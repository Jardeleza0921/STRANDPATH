import React, { useEffect, useState } from 'react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { Alert, Card, Chip, ErrorState, Field, LoadingBlock, PageHeader, Select, TextArea, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';

interface Version {
  id: number;
  version: string;
  title: string;
  status: 'draft' | 'active' | 'archived';
  notes: string | null;
  createdAt: string;
  activatedAt: string | null;
  questionCount: number;
  enabledCount: number;
  submissionCount: number;
}

interface AdminQuestion {
  id: number;
  code: string;
  section: string;
  dimension: string | null;
  prompt: string;
  helper: string | null;
  kind: string;
  maxChoices: number | null;
  weight: number;
  enabled: boolean;
  validationStatus: string;
  options: { id: number; code: string; label: string; hint: string | null; scores: Record<string, number> }[];
}

const newQuestionExample = {
  code: 'q21',
  section: 'Readiness',
  dimension: 'readiness',
  kind: 'single',
  prompt: 'Which statement describes you best right now?',
  helper: 'There is no correct answer.',
  maxChoices: null,
  weight: 1,
  options: [
    { code: 'a', label: 'I want to explore broadly', scores: { analytical: 1, social: 1 } },
    { code: 'b', label: 'I have a specific goal already', scores: { persistence: 2 } }
  ]
};

export function AdminQuestionnaire() {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState({ version: '', title: '', cloneFrom: '' });
  const [addJson, setAddJson] = useState(JSON.stringify(newQuestionExample, null, 2));
  const [busy, setBusy] = useState(false);

  const loadVersions = () => {
    setError(null);
    api
      .get<{ versions: Version[] }>('/admin/questionnaires')
      .then((data) => {
        setVersions(data.versions);
        const active = data.versions.find((v) => v.status === 'active');
        setSelectedId((current) => current ?? active?.id ?? data.versions[0]?.id ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(loadVersions, []);

  useEffect(() => {
    if (!selectedId) return;
    api
      .get<{ questions: AdminQuestion[] }>(`/admin/questionnaires/${selectedId}`)
      .then((data) => setQuestions(data.questions))
      .catch((err) => setActionError(errorMessage(err)));
  }, [selectedId]);

  const selected = versions?.find((v) => v.id === selectedId) ?? null;
  const isDraft = selected?.status === 'draft';

  const run = async (fn: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(success);
      loadVersions();
      if (selectedId) {
        const data = await api.get<{ questions: AdminQuestion[] }>(`/admin/questionnaires/${selectedId}`);
        setQuestions(data.questions);
      }
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Assessment management"
        title="Questionnaire versions"
        description="Active versions are immutable so completed assessments stay interpretable. To change questions, create a draft, edit it, then activate it."
      />

      {error && <div className="mt-4"><ErrorState message={error} onRetry={loadVersions} /></div>}
      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}
      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}

      {!versions ? (
        <LoadingBlock label="Loading questionnaire versions…" />
      ) : (
        <>
          <Card className="mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line bg-canvas text-[11px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-4 py-3 font-medium">Version</th>
                    <th scope="col" className="px-4 py-3 font-medium">Status</th>
                    <th scope="col" className="px-4 py-3 font-medium">Questions</th>
                    <th scope="col" className="px-4 py-3 font-medium">Submissions</th>
                    <th scope="col" className="px-4 py-3 font-medium">Created</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <tr key={version.id} className={`border-b border-line/70 last:border-0 ${version.id === selectedId ? 'bg-brand-soft/40' : ''}`}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => setSelectedId(version.id)} className="text-left">
                          <p className="font-medium text-ink">v{version.version}</p>
                          <p className="text-[11.5px] text-muted">{version.title}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Chip tone={version.status === 'active' ? 'success' : version.status === 'draft' ? 'warn' : 'neutral'}>{version.status}</Chip>
                      </td>
                      <td className="px-4 py-3 text-muted">{version.enabledCount} enabled / {version.questionCount}</td>
                      <td className="px-4 py-3 text-muted">{version.submissionCount}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(version.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {version.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => run(() => api.post(`/admin/questionnaires/${version.id}/activate`), `Version ${version.version} is now active.`)}
                          >
                            Activate
                          </Button>
                        )}
                        {version.status === 'active' && <span className="text-[11.5px] text-faint">Read-only</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="mt-5 p-5">
            <h2 className="text-[15px] font-semibold text-ink">Create a new draft version</h2>
            <p className="mt-1 text-[12.5px] text-muted">Cloning the active version is the safest way to make a revision.</p>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-[140px_1fr_200px_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                run(
                  () =>
                    api.post('/admin/questionnaires', {
                      version: draftForm.version,
                      title: draftForm.title,
                      cloneFrom: draftForm.cloneFrom ? Number(draftForm.cloneFrom) : undefined
                    }),
                  'Draft version created.'
                ).then(() => setDraftForm({ version: '', title: '', cloneFrom: '' }));
              }}
            >
              <Field label="Version" htmlFor="new-version" required>
                <TextInput id="new-version" required value={draftForm.version} onChange={(e) => setDraftForm({ ...draftForm, version: e.target.value })} placeholder="1.1-draft" />
              </Field>
              <Field label="Title" htmlFor="new-title" required>
                <TextInput id="new-title" required value={draftForm.title} onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })} />
              </Field>
              <Field label="Clone from" htmlFor="clone-from">
                <Select id="clone-from" value={draftForm.cloneFrom} onChange={(e) => setDraftForm({ ...draftForm, cloneFrom: e.target.value })}>
                  <option value="">Blank</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>v{v.version} ({v.status})</option>
                  ))}
                </Select>
              </Field>
              <Button type="submit" disabled={busy}>Create draft</Button>
            </form>
          </Card>

          {selected && (
            <Card className="mt-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-ink">v{selected.version} · {questions.length} questions</h2>
                <Chip tone={isDraft ? 'warn' : 'neutral'}>{isDraft ? 'Editable draft' : 'Read-only'}</Chip>
              </div>
              {selected.notes && <p className="mt-2 text-[12px] leading-relaxed text-muted">{selected.notes}</p>}

              <ul className="mt-4 divide-y divide-line">
                {questions.map((question) => (
                  <li key={question.id} className="py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11.5px] font-semibold text-faint">{question.code}</span>
                      <Chip>{question.section}</Chip>
                      <Chip>{question.kind}</Chip>
                      <Chip tone={question.enabled ? 'success' : 'neutral'}>{question.enabled ? 'enabled' : 'disabled'}</Chip>
                      <span className="text-[11px] text-faint">{question.validationStatus}</span>
                    </div>
                    {isDraft ? (
                      <div className="mt-2">
                        <TextInput
                          aria-label={`Prompt for ${question.code}`}
                          defaultValue={question.prompt}
                          onBlur={(event) => {
                            if (event.target.value !== question.prompt) {
                              run(() => api.patch(`/admin/questions/${question.id}`, { prompt: event.target.value }), `${question.code} updated.`);
                            }
                          }}
                        />
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12px] text-muted">
                          <label className="inline-flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={question.enabled}
                              onChange={(event) =>
                                run(() => api.patch(`/admin/questions/${question.id}`, { enabled: event.target.checked }), `${question.code} ${event.target.checked ? 'enabled' : 'disabled'}.`)
                              }
                              className="h-3.5 w-3.5 rounded text-brand"
                            />
                            Enabled
                          </label>
                          <span>{question.options.length} options</span>
                          <button
                            type="button"
                            className="text-accent hover:underline"
                            onClick={() => {
                              if (window.confirm(`Delete question ${question.code}?`)) {
                                run(() => api.del(`/admin/questions/${question.id}`), `${question.code} deleted.`);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[13.5px] text-ink">{question.prompt}</p>
                    )}
                  </li>
                ))}
              </ul>

              {isDraft && (
                <div className="mt-5 border-t border-line pt-4">
                  <h3 className="text-[13px] font-semibold text-ink">Add a question (JSON)</h3>
                  <p className="mt-1 text-[11.5px] text-muted">
                    Scores map dimension keys to points 0–5. Valid keys: scientific, analytical, numerical, technical,
                    creative, communication, social, enterprise, practical, persistence.
                  </p>
                  <TextArea className="mt-2 min-h-[220px] font-mono text-[12px]" value={addJson} onChange={(e) => setAddJson(e.target.value)} />
                  <div className="mt-2">
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        let payload: unknown;
                        try {
                          payload = JSON.parse(addJson);
                        } catch {
                          setActionError('The question JSON is not valid.');
                          return;
                        }
                        run(() => api.post(`/admin/questionnaires/${selected.id}/questions`, payload), 'Question added to the draft.');
                      }}
                    >
                      Add question
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          <Alert tone="warn" title="Validation is not implied" className="mt-5">
            Editing a questionnaire version is a technical change. It does not validate the instrument. Pilot testing,
            adviser review and reliability analysis are separate academic work and should be documented before any
            version is described as validated.
          </Alert>
        </>
      )}
    </div>
  );
}
