import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, MailWarningIcon, PaletteIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { api, errorMessage } from '../../lib/api';
import { Alert, Card, Field, PageHeader, TextInput } from '../../components/ui/Primitives';
import { Button } from '../../components/ui/Button';
import { PasswordInput, PasswordStrength } from '../../components/auth/PasswordInput';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';
import { AuthConfig } from '../../types/api';
import { useAuthConfig } from '../../hooks/useAuthConfig';
import { isStaticMode, STATIC_STORAGE_NOTICE } from '../../lib/mode';

export function Settings() {
  const { user, logout, refresh } = useAuth();
  const { theme } = useTheme();
  const { config } = useAuthConfig();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState<AuthConfig['email'] | null>(null);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setEmailStatus(config?.email ?? null);
  }, [config]);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/auth/password', { currentPassword, newPassword });
      setPasswordMessage('Password changed. Other devices have been signed out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const resendVerification = async () => {
    setVerifyBusy(true);
    setVerifyMessage(null);
    try {
      const result = await api.post<{ verification: { emailSent: boolean; emailDelivery: string } }>(
        '/auth/resend-verification'
      );
      setVerifyMessage(
        result.verification.emailSent || result.verification.emailDelivery === 'test'
          ? 'A new confirmation email is on its way.'
          : 'The server cannot send email right now. Ask your administrator to configure SMTP.'
      );
      await refresh();
    } catch (err) {
      setVerifyMessage(errorMessage(err));
    } finally {
      setVerifyBusy(false);
    }
  };

  const deleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setDeleteError(null);
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Type DELETE to confirm.');
      return;
    }
    if (!window.confirm('This permanently deletes your account, assessments, plan and support requests. Continue?')) return;
    setDeleting(true);
    try {
      await api.del('/account', { password: deletePassword });
      await logout().catch(() => undefined);
      navigate('/', { replace: true });
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Choose a colour theme and light or dark appearance, manage email confirmation and your password, and review privacy controls. Nothing here changes your assessment results."
      />

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-2">
          <PaletteIcon className="h-4 w-4 text-brand" aria-hidden />
          <h2 className="text-[15px] font-semibold text-ink">Color theme</h2>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          Four balanced light-and-dark palettes. {isStaticMode()
            ? 'Your choice is saved in this browser.'
            : 'Your choice is saved to your account and follows you to other devices.'}{' '}
          Current: <strong className="text-ink capitalize">{theme}</strong>.
        </p>
        <div className="mt-4">
          <ThemeSwitcher variant="full" />
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <div className="flex items-center gap-2">
          {user?.emailVerified ? (
            <CheckCircle2Icon className="h-4 w-4 text-success" aria-hidden />
          ) : (
            <MailWarningIcon className="h-4 w-4 text-warn" aria-hidden />
          )}
          <h2 className="text-[15px] font-semibold text-ink">Email confirmation</h2>
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          {isStaticMode()
            ? 'This build has no email service and no email confirmation step. Your local account is active immediately, but a forgotten password cannot be reset by email.'
            : user?.emailVerified
              ? `${user.email} is confirmed. Password reset and security notices will reach this address.`
              : `${user?.email} is not confirmed yet. You can still use STRANDPATH, but password recovery depends on a confirmed address.`}
        </p>
        {verifyMessage && (
          <div className="mt-3">
            <Alert tone="info">{verifyMessage}</Alert>
          </div>
        )}
        {!isStaticMode() && !user?.emailVerified && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={resendVerification} disabled={verifyBusy} size="sm">
              {verifyBusy ? 'Sending…' : 'Resend confirmation email'}
            </Button>
            <Button to="/verify-email" variant="secondary" size="sm">
              I have a code
            </Button>
          </div>
        )}
        {!isStaticMode() && emailStatus && !emailStatus.configured && (
          <p className="mt-3 text-[11.5px] leading-relaxed text-faint">
            Server email status: {emailStatus.note}
          </p>
        )}
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[15px] font-semibold text-ink">Change password</h2>
        <p className="mt-1 text-[12.5px] text-muted">
          Signed in as {user?.email}. Changing your password signs out other devices.
        </p>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          {passwordMessage && <Alert tone="success">{passwordMessage}</Alert>}
          {passwordError && <Alert tone="danger">{passwordError}</Alert>}
          <Field label="Current password" htmlFor="current-password" required>
            <PasswordInput
              id="current-password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              required
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password" htmlFor="new-password" required>
              <PasswordInput
                id="new-password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <PasswordStrength password={newPassword} />
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
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Updating…' : 'Change password'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[15px] font-semibold text-ink">Privacy and data</h2>
        {isStaticMode() ? (
          <>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
              <li>• {STATIC_STORAGE_NOTICE}</li>
              <li>• Strand Assistance runs in this browser from a local knowledge base. No question or answer is sent to an AI service.</li>
              <li>• Passwords are stored as salted PBKDF2 hashes, never as plain text, but local browser storage is not a secure multi-user authentication system.</li>
              <li>• You can export a JSON copy of your records from the Profile page at any time.</li>
              <li>• Deleting your account removes its records from this browser.</li>
            </ul>
          </>
        ) : (
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-muted">
            <li>• Your profile, answers, scores, plan and support requests are stored in the school's STRANDPATH database.</li>
            <li>• Only you and authorised guidance staff can view your records. Staff access is logged.</li>
            <li>• Strand Assistance runs in your browser and receives no more than the records already shown on this page.</li>
            <li>• You can export a copy of your records from the Profile page at any time.</li>
            <li>• Retention follows your school's policy; ask the guidance office for the current period.</li>
          </ul>
        )}
      </Card>

      <Card className="mt-5 border-danger/30 p-6">
        <h2 className="text-[15px] font-semibold text-danger">Delete my account</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
          This permanently removes {isStaticMode() ? 'this account and its records from this browser' : 'your account and all associated assessment records, plan progress and support requests'}.
          It cannot be undone. Consider exporting your records first.
        </p>
        <form onSubmit={deleteAccount} className="mt-4 space-y-3">
          {deleteError && <Alert tone="danger">{deleteError}</Alert>}
          <Field label="Password" htmlFor="delete-password" required>
            <PasswordInput id="delete-password" value={deletePassword} onChange={setDeletePassword} required />
          </Field>
          <Field label="Type DELETE to confirm" htmlFor="delete-confirm" required>
            <TextInput id="delete-confirm" value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} required />
          </Field>
          <Button type="submit" variant="secondary" disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete account permanently'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
