import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2Icon, MailCheckIcon } from 'lucide-react';
import { Alert, Field, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AuthFrame } from '../../components/auth/AuthFrame';
import { api, errorMessage } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>(token ? 'checking' : 'idle');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    api
      .post('/auth/verify-email', { token })
      .then(async () => {
        setStatus('done');
        setMessage('Your email address is confirmed. Your account is fully verified.');
        await refresh();
      })
      .catch((err) => {
        setStatus('error');
        setMessage(errorMessage(err));
      });
  }, [token, refresh]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await api.post('/auth/verify-email', { email: email.trim(), otp: otp.trim() });
      setStatus('done');
      setMessage('Your email address is confirmed. Your account is fully verified.');
      await refresh();
    } catch (err) {
      setStatus('error');
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await api.post<{ verification: { emailSent: boolean } }>('/auth/resend-verification');
      setMessage(
        result.verification.emailSent
          ? 'A new confirmation email is on its way.'
          : 'This server cannot send email yet. Ask your administrator to configure SMTP.'
      );
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      eyebrow="Email confirmation"
      title="Confirm the address on your account."
      description="A verified email keeps password recovery and security notices working."
    >
      {status === 'checking' ? (
        <div className="py-6 text-center">
          <p className="text-[14px] text-muted" role="status">Confirming your email…</p>
        </div>
      ) : status === 'done' ? (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2Icon className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 font-display text-[24px] font-bold text-ink">Email confirmed</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {user ? (
              <Button to={user.role === 'student' ? '/app' : '/admin'} size="lg">
                Continue
              </Button>
            ) : (
              <Button to="/login" size="lg">
                Sign in
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
            <MailCheckIcon className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 font-display text-[24px] font-bold text-ink">Enter your confirmation code</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Use the six-digit code from the confirmation email. Codes expire after one hour and stop working after a
            few failed attempts.
          </p>
          {message && (
            <div className="mt-4">
              <Alert tone={status === 'error' ? 'danger' : 'info'}>{message}</Alert>
            </div>
          )}
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Email address" htmlFor="verify-email" required>
              <TextInput
                id="verify-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label="Six-digit code" htmlFor="verify-otp" required>
              <TextInput
                id="verify-otp"
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
            <Button type="submit" full size="lg" disabled={busy}>
              {busy ? 'Checking…' : 'Confirm email'}
            </Button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4 text-[12.5px]">
            {user ? (
              <button type="button" onClick={resend} disabled={busy} className="font-medium text-brand hover:text-brand-dark">
                Resend confirmation email
              </button>
            ) : (
              <Link to="/login" className="font-medium text-brand hover:text-brand-dark">
                Sign in to resend
              </Link>
            )}
            <Link to="/forgot-password" className="text-muted hover:text-ink">
              Forgot password?
            </Link>
          </div>
        </>
      )}
    </AuthFrame>
  );
}
