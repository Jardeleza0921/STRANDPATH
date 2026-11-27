import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, MailCheckIcon } from 'lucide-react';
import { Alert, Field, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AuthFrame } from '../../components/auth/AuthFrame';
import { api, errorMessage } from '../../lib/api';
import { isStaticMode } from '../../lib/mode';
import { EmailStatus } from '../../types/api';

interface ForgotResponse {
  ok: boolean;
  message: string;
  delivery: string;
  email: EmailStatus;
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotResponse | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setResult(await api.post<ForgotResponse>('/auth/forgot', { email: email.trim() }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const delivered = result.delivery === 'smtp';
    return (
      <AuthFrame
        eyebrow="Password recovery"
        title="Check your inbox if the address is registered."
        description="For privacy, this page gives the same answer whether or not an account exists."
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <MailCheckIcon className="h-6 w-6" aria-hidden />
        </div>
        <h2 className="mt-4 font-display text-[24px] font-bold text-ink">Request received</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">{result.message}</p>

        {delivered ? (
          <div className="mt-4">
            <Alert tone="success">
              Email is configured on this server. If the address belongs to an account, a six-digit code and a
              one-time link were sent. They expire shortly after they are requested.
            </Alert>
          </div>
        ) : (
          <div className="mt-4">
            <Alert tone="warn" title={isStaticMode() ? 'This account cannot send email' : 'Email delivery is not active'}>
              {result.email.note}{' '}
              {isStaticMode()
                ? 'A forgotten local password cannot be recovered, because there is no server or email service. You can create a new account in this browser.'
                : 'No message can be delivered until an administrator configures SMTP, so do not wait for an email. Staff can reset a password from the server with a fresh OTP once email is working.'}
            </Alert>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button to={`/reset-password?email=${encodeURIComponent(email)}`} size="lg">
            I have a code
          </Button>
          <Button to="/login" variant="secondary" size="lg">
            Back to sign in
          </Button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Password recovery"
      title="It happens. Let's get you back in."
      description="Enter the email address on your account and we will send a single-use reset code."
    >
      <h2 className="font-display text-[24px] font-bold text-ink">Forgot your password?</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">
        The code expires quickly, can be used once, and existing sessions are signed out after a reset.
      </p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Email address" htmlFor="email" required>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.edu.ph"
          />
        </Field>
        <Button type="submit" full size="lg" disabled={busy}>
          {busy ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>
      <p className="mt-5 border-t border-line pt-4 text-[13px] text-muted">
        <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-brand-dark">
          <ArrowLeftIcon className="h-3.5 w-3.5" aria-hidden />
          Back to sign in
        </Link>
      </p>
    </AuthFrame>
  );
}
