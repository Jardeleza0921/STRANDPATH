import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, Field, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AuthFrame } from '../../components/auth/AuthFrame';
import { PasswordInput } from '../../components/auth/PasswordInput';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { errorMessage } from '../../lib/api';
import { isStaticMode } from '../../lib/mode';

const OAUTH_MESSAGES: Record<string, string> = {
  google_not_configured: 'Google sign-in is not configured on this server yet.',
  google_state: 'That Google sign-in attempt expired or could not be verified. Please try again.',
  google_expired: 'That Google sign-in attempt took too long. Please try again.',
  google_cancelled: 'Google sign-in was cancelled.',
  google_failed: 'Google could not complete the sign-in. Please try again or use your email and password.',
  google_email_unverified: 'Your Google email is not verified, so it cannot be linked automatically.',
  google_suspended: 'This account is suspended. Contact your guidance office.',
  consent_required: 'Please accept the privacy notice before creating an account with Google.'
};

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string; message?: string } };
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const oauthError = params.get('error');
  const resetDone = params.get('reset') === '1';

  useEffect(() => {
    if (!user) return;
    const from = location.state?.from;
    const destination = user.mustChangePassword
      ? '/change-password'
      : from?.startsWith('/admin') && user.role !== 'student'
        ? from
        : from?.startsWith('/app') && user.role === 'student'
          ? from
          : user.role === 'student'
            ? '/app'
            : '/admin';
    navigate(destination, { replace: true });
  }, [user, navigate, location.state?.from]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const signedIn = await login(email.trim(), password, remember);
      const from = location.state?.from;
      if (signedIn.mustChangePassword) navigate('/change-password', { replace: true });
      else if (signedIn.role === 'student') navigate(from?.startsWith('/app') ? from : '/app', { replace: true });
      else navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="Pick up where you left off."
      description="Sign in to continue your assessment, pathway or plan where you stopped. In this browser build your records stay on this device and are not sent to a school database."
    >
      <h2 className="font-display text-[24px] font-bold text-ink">Sign in</h2>
      <p className="mt-1 text-[13px] text-muted">
        {isStaticMode()
          ? 'Sign in to the local account saved in this browser. Nothing is sent to a server.'
          : 'Students and school staff use the same sign-in form.'}
      </p>

      <div className="mt-4 space-y-3">
        {oauthError && <Alert tone="danger">{OAUTH_MESSAGES[oauthError] ?? 'Google sign-in could not be completed.'}</Alert>}
        {resetDone && <Alert tone="success">Your password was reset. Sign in with your new password.</Alert>}
        {location.state?.message && <Alert tone="success">{location.state.message}</Alert>}
        {error && <Alert tone="danger">{error}</Alert>}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-4">
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
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className="block text-[13px] font-medium text-ink">
              Password <span className="text-accent" aria-hidden>*</span>
            </label>
            <Link to="/forgot-password" className="text-[12px] font-medium text-brand hover:text-brand-dark">
              Forgot password?
            </Link>
          </div>
          <div className="mt-1.5">
            <PasswordInput
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-[12.5px] text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
          />
          Remember me for 30 days on this device
        </label>

        <Button type="submit" full size="lg" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
          {!busy && <ArrowRightIcon className="h-4 w-4" aria-hidden />}
        </Button>
      </form>

      {!isStaticMode() && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] uppercase tracking-[0.08em] text-faint">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <GoogleButton intent="login" />
        </>
      )}

      <p className="mt-5 border-t border-line pt-4 text-[13px] text-muted">
        New to STRANDPATH?{' '}
        <Link to="/register" className="font-medium text-brand hover:text-brand-dark">
          Create a student account
        </Link>
      </p>
      <p className="mt-2 text-[11.5px] leading-relaxed text-faint">
        {isStaticMode()
          ? 'This static build has no staff or administrator area and no email recovery. Clearing this browser’s site data deletes the account and its records.'
          : 'Staff accounts are provisioned by the school and must replace their initial password at first sign-in.'}
      </p>
    </AuthFrame>
  );
}
