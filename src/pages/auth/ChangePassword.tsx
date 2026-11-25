import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Field } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { AuthFrame } from '../../components/auth/AuthFrame';
import { PasswordInput, PasswordStrength } from '../../components/auth/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import { api, errorMessage } from '../../lib/api';

export function ChangePassword() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const forced = user?.mustChangePassword === true;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('The two new passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/password', { currentPassword, newPassword: password });
      await refresh();
      const destination = user?.role === 'student' ? '/app' : '/admin';
      navigate(forced ? `${destination}?passwordChanged=1` : destination, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame
      eyebrow={forced ? 'First sign-in' : 'Account security'}
      title={forced ? 'Replace your initial password.' : 'Choose a new password.'}
      description={
        forced
          ? 'School-provisioned accounts start with a temporary password supplied by your administrator. Replace it now to protect your account.'
          : 'Changing your password signs out every other device. Your current session stays signed in.'
      }
    >
      <h2 className="font-display text-[24px] font-bold text-ink">
        {forced ? 'Set your own password' : 'Change password'}
      </h2>
      <p className="mt-1 text-[13px] text-muted">Signed in as {user?.email}</p>

      {forced && (
        <div className="mt-4">
          <Alert tone="warn" title="This step is required">
            You cannot open the dashboard until your initial password is replaced. Use the temporary password from
            your administrator as the current password.
          </Alert>
        </div>
      )}

      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Current password" htmlFor="current" required>
          <PasswordInput
            id="current"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />
        </Field>
        <Field label="New password" htmlFor="new" required>
          <PasswordInput id="new" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} required />
          <PasswordStrength password={password} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" required>
          <PasswordInput
            id="confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </Field>
        <Button type="submit" full size="lg" disabled={busy}>
          {busy ? 'Saving…' : forced ? 'Save password and continue' : 'Change password'}
        </Button>
      </form>

      <p className="mt-5 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">
        Use at least 8 characters with a letter and a number. A longer phrase you can remember is stronger than a short
        password with symbols.
      </p>
    </AuthFrame>
  );
}
