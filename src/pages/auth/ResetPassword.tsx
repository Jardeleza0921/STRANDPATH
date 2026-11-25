import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2Icon } from 'lucide-react';
import { Alert, Field, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AuthFrame } from '../../components/auth/AuthFrame';
import { PasswordInput, PasswordStrength } from '../../components/auth/PasswordInput';
import { api, errorMessage } from '../../lib/api';

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/reset', {
        ...(token ? { token } : { email: email.trim(), otp: otp.trim() }),
        password,
        confirmPassword
      });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthFrame
        eyebrow="Password updated"
        title="Your account is secure again."
        description="All other sessions were signed out. Sign in with your new password."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2Icon className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 font-display text-[24px] font-bold text-ink">Password changed</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          A confirmation email is sent when email delivery is configured. If you did not make this change, contact
          your guidance office immediately.
        </p>
        <div className="mt-5">
          <Button onClick={() => navigate('/login?reset=1', { replace: true })} size="lg">
            Sign in with the new password
          </Button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Password recovery"
      title={token ? 'Choose a new password.' : 'Enter your reset code.'}
      description={
        token
          ? 'This link can be used once. After you save a new password, every other signed-in device is signed out.'
          : 'Use the six-digit code from your reset email. Codes expire quickly and stop working after a few failed attempts.'
      }
    >
      <h2 className="font-display text-[24px] font-bold text-ink">{token ? 'Set a new password' : 'Reset your password'}</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        {!token && (
          <>
            <Field label="Email address" htmlFor="email" required>
              <TextInput
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Six-digit code" htmlFor="otp" required>
              <TextInput
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="tracking-[0.3em]"
              />
            </Field>
          </>
        )}
        <Field label="New password" htmlFor="password" required>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />
          <PasswordStrength password={password} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password" required>
          <PasswordInput
            id="confirm-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Button type="submit" full size="lg" disabled={busy}>
          {busy ? 'Saving…' : 'Save new password'}
        </Button>
      </form>
      <p className="mt-5 border-t border-line pt-4 text-[12.5px] text-muted">
        Code expired? <a href="/forgot-password" className="font-medium text-brand hover:text-brand-dark">Request another</a>.
      </p>
    </AuthFrame>
  );
}
