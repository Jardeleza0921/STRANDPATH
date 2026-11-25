import React, { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Alert, Card, Chip, ErrorState, Field, LoadingBlock, PageHeader, Select, TextArea, TextInput } from '../../components/ui/Primitives';

interface AdminActivity {
  id: number;
  slug: string;
  title: string;
  type: string;
  targetCategory: string;
  targetCategoryLabel: string;
  tier: 'foundation' | 'core' | 'stretch';
  difficulty: number;
  minutes: number;
  objectives: string[];
  instructions: string;
  completionCriteria: string;
  check: unknown[] | null;
  active: boolean;
  attached: number;
}

const blank = {
  title: '',
  type: 'practice',
  targetCategory: 'analytical',
  tier: 'core',
  difficulty: 1,
  minutes: 20,
  objectives: '',
  instructions: '',
  completionCriteria: ''
};

export function AdminActivities() {
  const [activities, setActivities] = useState<AdminActivity[] | null>(null);
  const [categories, setCategories] = useState<{ key: string; label: string }[]>([]);
  const [selected, setSelected] = useState<AdminActivity | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get<{ activities: AdminActivity[]; categories: { key: string; label: string }[] }>('/admin/activities')
      .then((data) => {
        setActivities(data.activities);
        setCategories(data.categories);
      })
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  const select = (activity: AdminActivity) => {
    setSelected(activity);
    setForm({
      title: activity.title,
      type: activity.type,
      targetCategory: activity.targetCategory,
      tier: activity.tier,
      difficulty: activity.difficulty,
      minutes: activity.minutes,
      objectives: activity.objectives.join('\n'),
      instructions: activity.instructions,
      completionCriteria: activity.completionCriteria
    });
    setActionError(null);
    setMessage(null);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setActionError(null);
    setMessage(null);
    const payload = {
      title: form.title,
      type: form.type,
      targetCategory: form.targetCategory,
      tier: form.tier,
      difficulty: Number(form.difficulty),
      minutes: Number(form.minutes),
      objectives: form.objectives.split('\n').map((line) => line.trim()).filter(Boolean),
      instructions: form.instructions,
      completionCriteria: form.completionCriteria
    };
    try {
      if (selected) {
        await api.patch(`/admin/activities/${selected.id}`, payload);
        setMessage('Activity updated.');
      } else {
        await api.post('/admin/activities', payload);
        setMessage('Activity created.');
        setForm({ ...blank });
      }
      load();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!activities) return <LoadingBlock label="Loading activities…" />;

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Improvement programme"
        title="Activity library"
        description="Activities are selected into student programmes by dimension and difficulty. Deactivating an activity stops new assignments without affecting existing records."
        actions={<Button size="sm" variant="secondary" onClick={() => { setSelected(null); setForm({ ...blank }); }}>New activity</Button>}
      />

      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}
      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card className="overflow-hidden">
          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-[12.5px]">
              <thead className="sticky top-0 bg-canvas">
                <tr className="border-b border-line text-[11px] uppercase tracking-[0.05em] text-faint">
                  <th scope="col" className="px-3 py-2.5 font-medium">Activity</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Dimension</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Used</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    className={`cursor-pointer border-b border-line/70 last:border-0 hover:bg-canvas ${selected?.id === activity.id ? 'bg-brand-soft/40' : ''}`}
                    onClick={() => select(activity)}
                  >
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-ink">{activity.title}</p>
                      <p className="text-[11px] text-muted">
                        {activity.tier} · {activity.minutes} min {activity.active ? '' : '· inactive'}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-muted">{activity.targetCategoryLabel}</td>
                    <td className="px-3 py-2.5 text-muted">{activity.attached}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-ink">{selected ? `Edit: ${selected.title}` : 'Create an activity'}</h2>
            {selected && (
              <Chip tone={selected.active ? 'success' : 'neutral'}>{selected.active ? 'active' : 'inactive'}</Chip>
            )}
          </div>
          <form onSubmit={save} className="mt-4 space-y-3.5">
            <Field label="Title" htmlFor="a-title" required>
              <TextInput id="a-title" required minLength={4} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dimension" htmlFor="a-category">
                <Select id="a-category" value={form.targetCategory} onChange={(e) => setForm({ ...form, targetCategory: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Tier" htmlFor="a-tier">
                <Select id="a-tier" value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as typeof form.tier })}>
                  <option value="foundation">Foundation</option>
                  <option value="core">Core</option>
                  <option value="stretch">Stretch</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Type" htmlFor="a-type">
                <TextInput id="a-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              </Field>
              <Field label="Difficulty" htmlFor="a-difficulty">
                <TextInput id="a-difficulty" type="number" min={1} max={3} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) })} />
              </Field>
              <Field label="Minutes" htmlFor="a-minutes">
                <TextInput id="a-minutes" type="number" min={5} max={240} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} />
              </Field>
            </div>
            <Field label="Objectives (one per line)" htmlFor="a-objectives">
              <TextArea id="a-objectives" className="min-h-[70px]" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
            </Field>
            <Field label="Steps and instructions" htmlFor="a-instructions" required>
              <TextArea id="a-instructions" className="min-h-[130px]" required minLength={20} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
            </Field>
            <Field label="Completion criteria" htmlFor="a-criteria" required>
              <TextInput id="a-criteria" required value={form.completionCriteria} onChange={(e) => setForm({ ...form, completionCriteria: e.target.value })} />
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={busy}>{busy ? 'Saving…' : selected ? 'Save changes' : 'Create activity'}</Button>
              {selected && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await api.patch(`/admin/activities/${selected.id}`, { active: !selected.active });
                      setSelected({ ...selected, active: !selected.active });
                      load();
                    } catch (err) {
                      setActionError(errorMessage(err));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {selected.active ? 'Deactivate' : 'Reactivate'}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
