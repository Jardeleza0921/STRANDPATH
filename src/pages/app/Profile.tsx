import React, { useEffect, useState } from 'react';
import { DownloadIcon } from 'lucide-react';
import { api, errorMessage, formatDate } from '../../lib/api';
import { User } from '../../types/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Alert, Card, Field, LoadingBlock, PageHeader, Select, TextArea, TextInput } from '../../components/ui/Primitives';

export function Profile() {
  const { user, profile, refresh, setProfile } = useAuth();
  const [form, setForm] = useState({
    name: '',
    gradeLevel: '',
    school: '',
    city: '',
    interests: '',
    strengths: '',
    goals: '',
    learningPreference: '',
    careerInterest: ''
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name,
      gradeLevel: profile?.gradeLevel ?? '',
      school: profile?.school ?? '',
      city: profile?.city ?? '',
      interests: profile?.interests ?? '',
      strengths: profile?.strengths ?? '',
      goals: profile?.goals ?? '',
      learningPreference: profile?.learningPreference ?? '',
      careerInterest: profile?.careerInterest ?? ''
    });
  }, [user, profile]);

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const data = await api.put<{ user: User; profile: typeof profile }>('/profile', form);
      setProfile(data.profile);
      await refresh();
      setMessage('Profile saved.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    setError(null);
    try {
      const data = await api.get<Record<string, unknown>>('/profile/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `strandpath-records-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!user) return <LoadingBlock />;

  return (
    <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="These details personalise how Strand Assistance explains your results and shape the activities suggested for you. Only fill in what you are comfortable sharing."
        actions={
          <Button variant="secondary" size="sm" onClick={exportData}>
            <DownloadIcon className="h-4 w-4" aria-hidden />
            Export my records
          </Button>
        }
      />

      <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-muted">
        <span className="rounded-full border border-line bg-surface px-3 py-1">{user.email}</span>
        <span className="rounded-full border border-line bg-surface px-3 py-1 capitalize">{user.role}</span>
        {profile?.consentAt && <span className="rounded-full border border-line bg-surface px-3 py-1">Consent recorded {formatDate(profile.consentAt)}</span>}
        {profile?.selectedStrand && <span className="rounded-full border border-success/20 bg-success-soft px-3 py-1 text-success">Selected {profile.selectedStrand.toUpperCase()}</span>}
      </div>

      {message && <div className="mt-4"><Alert tone="success">{message}</Alert></div>}
      {error && <div className="mt-4"><Alert tone="danger">{error}</Alert></div>}

      <form onSubmit={save} className="mt-5 space-y-5">
        <Card className="p-6">
          <h2 className="text-[15px] font-semibold text-ink">Basic information</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name">
              <TextInput id="name" value={form.name} onChange={(e) => update('name', e.target.value)} required minLength={2} maxLength={80} />
            </Field>
            <Field label="Grade level" htmlFor="grade">
              <Select id="grade" value={form.gradeLevel} onChange={(e) => update('gradeLevel', e.target.value)}>
                <option value="">Not set</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </Select>
            </Field>
            <Field label="School" htmlFor="school">
              <TextInput id="school" value={form.school} onChange={(e) => update('school', e.target.value)} maxLength={120} />
            </Field>
            <Field label="City or municipality" htmlFor="city">
              <TextInput id="city" value={form.city} onChange={(e) => update('city', e.target.value)} maxLength={120} />
            </Field>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            STRANDPATH does not ask for birth dates, addresses, ID numbers or other sensitive identifiers. Email is used
            only for signing in.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-[15px] font-semibold text-ink">Interests and goals (optional)</h2>
          <div className="mt-4 space-y-4">
            <Field label="Interests" htmlFor="interests" hint="Subjects, activities or topics you return to.">
              <TextArea id="interests" value={form.interests} onChange={(e) => update('interests', e.target.value)} maxLength={500} className="min-h-[80px]" />
            </Field>
            <Field label="Strengths you notice in yourself" htmlFor="strengths">
              <TextArea id="strengths" value={form.strengths} onChange={(e) => update('strengths', e.target.value)} maxLength={500} className="min-h-[80px]" />
            </Field>
            <Field label="Goals for the next two years" htmlFor="goals">
              <TextArea id="goals" value={form.goals} onChange={(e) => update('goals', e.target.value)} maxLength={500} className="min-h-[80px]" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="How you prefer to learn" htmlFor="learning">
                <TextInput id="learning" value={form.learningPreference} onChange={(e) => update('learningPreference', e.target.value)} maxLength={120} placeholder="e.g. hands-on, with examples" />
              </Field>
              <Field label="Career interest (if any)" htmlFor="career">
                <TextInput id="career" value={form.careerInterest} onChange={(e) => update('careerInterest', e.target.value)} maxLength={200} />
              </Field>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</Button>
        </div>
      </form>
    </div>
  );
}
