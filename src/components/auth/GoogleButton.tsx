import React from 'react';
import { Alert } from '../ui/Primitives';
import { useAuthConfig } from '../../hooks/useAuthConfig';

export function GoogleButton({ intent, consent = false }: { intent: 'login' | 'signup'; consent?: boolean }) {
  const { config, error } = useAuthConfig();
  const configured = config?.google.configured === true;

  const start = () => {
    if (!configured) return;
    if (intent === 'signup' && !consent) return;
    const params = new URLSearchParams({ intent });
    if (intent === 'signup') params.set('consent', '1');
    window.location.assign(`/api/auth/google/start?${params.toString()}`);
  };

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={!configured || (intent === 'signup' && !consent)}
        title={
          configured
            ? `Continue with Google to ${intent === 'signup' ? 'create a student account' : 'sign in'}`
            : 'Google sign-in has not been configured on this server'
        }
        className="sp-btn-secondary inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-md px-4 text-[13.5px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6c1.9-5.6 7.1-9.8 13.6-9.8z" />
          <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.6h12.4c-.5 2.9-2.2 5.4-4.7 7l7.5 5.8c4.4-4 6.9-10 6.9-16.9z" />
          <path fill="#FBBC05" d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.6 10.7l7.8-6z" />
          <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.6l-7.5-5.8c-2.1 1.4-4.8 2.3-7.7 2.3-6.5 0-11.7-4.2-13.6-9.9l-7.8 6C6.5 42.6 14.6 48 24 48z" />
        </svg>
        {intent === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
      </button>
      {!configured && (
        <div className="mt-2">
          <Alert tone="warn">
            {error ?? config?.google.note ?? 'Google sign-in is not configured yet.'} Google buttons stay disabled
            instead of pretending to sign you in.
          </Alert>
        </div>
      )}
      {configured && intent === 'signup' && !consent && (
        <p className="mt-1.5 text-[11.5px] text-faint">Accept the privacy notice to enable Google sign-up.</p>
      )}
    </div>
  );
}
