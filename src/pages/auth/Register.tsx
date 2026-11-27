import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, MailCheckIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Field, Select, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AuthFrame } from '../../components/auth/AuthFrame';
import { PasswordInput, PasswordStrength } from '../../components/auth/PasswordInput';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { errorMessage, api } from '../../lib/api';
import { VerificationState } from '../../types/api';
import { isStaticMode } from '../../lib/mode';

export function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gradeLevel: 'Grade 10',
    school: '',
    consent: false
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        gradeLevel: form.gradeLevel,
        school: form.school,
        consent: form.consent
      });
      setVerification(result.verification ?? null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResendMessage(null);
    try {
      const result = await api.post<{ verification: VerificationState }>('/auth/resend-verification');
      setResendMessage(
        result.verification.emailSent
          ? 'A new confirmation email is on its way. Check your inbox and spam folder.'
          : 'This server cannot send email yet, so no message was sent. Ask your administrator to configure SMTP.'
      );
    } catch (err) {
      setResendMessage(errorMessage(err));
    }
  };

  if (verification) {
    return (
      <AuthFrame
        eyebrow="Account created"
        title="One small step: confirm your email."
        description="Email confirmation keeps your account recoverable and makes sure password resets reach you."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <MailCheckIcon className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 font-display text-[24px] font-bold text-ink">You're in, {form.name.split(' ')[0]}.</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          We created your student account and signed you in. Your answers save as you go, so you can start the
          assessment now. Your records stay in this browser.
        </p>

        <div className="mt-4 space-y-3">
          {verification.emailSent ? (
            <Alert tone="success">
              A confirmation email was sent to <strong>{form.email}</strong>. The link and six-digit code expire in one
              hour.
            </Alert>
          ) : (
            <Alert tone="info" title={isStaticMode() ? 'No email needed for a local account' : 'Email delivery is not available yet'}>
              {verification.note ??
                'This build cannot send email, so no confirmation message was sent. Your account is ready to use on this device.'}
            </Alert>
          )}
          {resendMessage && <Alert tone="info">{resendMessage}</Alert>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button to="/app" size="lg">
            Go to my dashboard
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button onClick={resend} variant="secondary" size="lg">
            Resend confirmation
          </Button>
        </div>

        <p className="mt-5 border-t border-line pt-4 text-[12px] text-muted">
          Wrong email address? Ask your guidance office to correct it. You can keep using the account meanwhile.
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Student registration"
      title="Start with a clearer picture of yourself."
      description="About ten minutes, no right answers, and nothing is timed. You can pause at any question and come back later."
      wide
    >
      <h2 className="font-display text-[24px] font-bold text-ink">Create your student account</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required>
            <TextInput
              id="name"
              required
              minLength={2}
              maxLength={80}
              value={form.name}
              onChange={(event) => update('name', event.target.value)}
              placeholder="Maria Santos"
            />
          </Field>
          <Field label="Email address" htmlFor="email" required>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => update('email', event.target.value)}
              placeholder="you@school.edu.ph"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" required>
            <PasswordInput
              id="password"
              value={form.password}
              onChange={(value) => update('password', value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <PasswordStrength password={form.password} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm-password" required>
            <PasswordInput
              id="confirm-password"
              value={form.confirmPassword}
              onChange={(value) => update('confirmPassword', value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="mt-1.5 text-[11.5px] text-danger">Passwords do not match yet.</p>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grade level" htmlFor="grade">
            <Select id="grade" value={form.gradeLevel} onChange={(event) => update('gradeLevel', event.target.value)}>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
              <option>Grade 12</option>
            </Select>
          </Field>
          <Field label="School" htmlFor="school">
            <TextInput
              id="school"
              maxLength={120}
              value={form.school}
              onChange={(event) => update('school', event.target.value)}
              placeholder="School name"
            />
          </Field>
        </div>

        <label className="flex items-start gap-3 rounded-md border border-line bg-surface2/40 p-3.5 text-[12px] leading-relaxed text-muted">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(event) => update('consent', event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand focus:ring-brand"
            required
          />
          <span>
            I understand that STRANDPATH stores my profile, assessment answers and results to provide guidance. I can
            export or delete my data from Settings. This consent is recorded with my account, in line with the
            Philippine Data Privacy Act (RA 10173).{' '}
            {isStaticMode()
              ? 'In this browser-only build, no school staff can access these records.'
              : 'Authorised school guidance staff may review them to support me.'}
          </span>
        </label>

        {isStaticMode() && (
          <Alert tone="info" title="This account lives in this browser">
            Your account, answers and results are stored only on this device. There is no school database, cross-device
            sign-in or email recovery. You can export your records from the Profile page.
          </Alert>
        )}

        <Button type="submit" full size="lg" disabled={busy || !form.consent || form.password !== form.confirmPassword}>
          {busy ? 'Creating account…' : 'Create account'}
          {!busy && <ArrowRightIcon className="h-4 w-4" aria-hidden />}
        </Button>

        {!isStaticMode() && (
          <>
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] uppercase tracking-[0.08em] text-faint">or</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <GoogleButton intent="signup" consent={form.consent} />
          </>
        )}
      </form>

      <p className="mt-5 border-t border-line pt-4 text-[13px] text-muted">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-brand hover:text-brand-dark">
          Sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
