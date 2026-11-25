import React, { useEffect, useState } from 'react';
import { api, errorMessage } from '../../lib/api';
import { Strand } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { Alert, Card, ErrorState, Field, LoadingBlock, PageHeader, Select, TextArea, TextInput } from '../../components/ui/Primitives';

type AdminStrand = Strand;

const listFields = [
  { key: 'interests', label: 'Areas of interest' },
  { key: 'skills', label: 'Skills used' },
  { key: 'learn', label: 'Subjects and learning expectations' },
  { key: 'suitedFor', label: 'Who may enjoy it' },
  { key: 'collegeFields', label: 'College fields' },
  { key: 'careerAreas', label: 'Career areas' },
  { key: 'considerations', label: 'Considerations' }
] as const;

export function AdminStrands() {
  const [strands, setStrands] = useState<AdminStrand[] | null>(null);
  const [categories, setCategories] = useState<{ key: string; label: string }[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [form, setForm] = useState<AdminStrand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ strands: AdminStrand[]; categories: { key: string; label: string }[] }>('/admin/strands')
      .then((data) => {
        setStrands(data.strands);
        setCategories(data.categories);
        setSelectedSlug(data.strands[0]?.slug ?? '');
        setForm(data.strands[0] ?? null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  const choose = (slug: string) => {
    setSelectedSlug(slug);
    setForm(strands?.find((s) => s.slug === slug) ?? null);
    setMessage(null);
    setActionError(null);
  };

  const updateList = (key: string, value: string) => {
    if (!form) return;
    setForm({ ...form, [key]: value.split('\n').map((line) => line.trim()).filter(Boolean) });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      await api.patch(`/admin/strands/${form.slug}`, {
        code: form.code,
        name: form.name,
        track: form.track,
        tagline: form.tagline,
        summary: form.summary,
        interests: form.interests,
        skills: form.skills,
        learn: form.learn,
        suitedFor: form.suitedFor,
        collegeFields: form.collegeFields,
        careerAreas: form.careerAreas,
        considerations: form.considerations,
        weights: form.weights,
        active: form.active
      });
      setMessage('Strand updated.');
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <div className="px-4 py-10 sm:px-8"><ErrorState message={error} /></div>;
  if (!strands || !form) return <LoadingBlock label="Loading strands…" />;

  const weightTotal = Object.values(form.weights).reduce((sum, value) => sum + Number(value), 0);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Strand management"
        title="Strand information"
        description="Strand descriptions, pathways and the dimension weights used by the recommendation engine. Weights must add up to 1.0."
      />

      {actionError && <div className="mt-4"><Alert tone="danger">{actionError}</Alert></div>}
      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}

      <div className="mt-5">
        <label className="text-[12px] text-muted">
          Strand
          <Select className="mt-1 min-w-[260px]" value={selectedSlug} onChange={(e) => choose(e.target.value)}>
            {strands.map((strand) => (
              <option key={strand.slug} value={strand.slug}>
                {strand.code} — {strand.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <form onSubmit={save} className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Identity</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Code" htmlFor="code">
                <TextInput id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </Field>
              <Field label="Track" htmlFor="track">
                <TextInput id="track" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Name" htmlFor="name">
                <TextInput id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Tagline" htmlFor="tagline">
                <TextInput id="tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Summary" htmlFor="summary">
                <TextArea id="summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
              </Field>
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="h-4 w-4 rounded text-brand"
              />
              Offered by this school (shown to students)
            </label>
          </Card>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Descriptions</h2>
            <p className="mt-1 text-[11.5px] text-muted">One item per line.</p>
            <div className="mt-4 space-y-4">
              {listFields.map((field) => (
                <Field key={field.key} label={field.label} htmlFor={field.key}>
                  <TextArea
                    id={field.key}
                    className="min-h-[90px]"
                    value={(form[field.key] as string[]).join('\n')}
                    onChange={(e) => updateList(field.key, e.target.value)}
                  />
                </Field>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold text-ink">Recommendation weights</h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              How much this strand depends on each dimension. Values between 0 and 1; the total must be 1.0. These are
              professional judgements about strand emphasis and should be reviewed by advisers.
            </p>
            <div className="mt-4 space-y-2.5">
              {categories.map((category) => (
                <label key={category.key} className="flex items-center justify-between gap-3 text-[12.5px] text-ink">
                  <span>{category.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={form.weights[category.key] ?? 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        weights: { ...form.weights, [category.key]: Number(e.target.value) }
                      })
                    }
                    className="w-20 rounded-md border border-line px-2 py-1 text-right text-[12.5px] tabular-nums focus:border-brand focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <p className={`mt-3 text-[12px] font-medium ${Math.abs(weightTotal - 1) <= 0.02 ? 'text-success' : 'text-accent'}`}>
              Total: {weightTotal.toFixed(2)} {Math.abs(weightTotal - 1) <= 0.02 ? '✓' : '— must equal 1.0'}
            </p>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save strand'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
