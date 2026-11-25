import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export function PasswordInput({
  id,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
  ariaDescribedBy
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  ariaDescribedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        aria-describedby={ariaDescribedBy}
        className="sp-input w-full rounded-md py-2.5 pl-3.5 pr-11 text-[14px] text-ink placeholder:text-faint"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-surface2 hover:text-ink"
      >
        {visible ? <EyeOffIcon className="h-4 w-4" aria-hidden /> : <EyeIcon className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

export function passwordScore(password: string): { score: number; label: string; hint: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Za-z]/.test(password) && /[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const hints = [
    'Use at least 8 characters, with a letter and a number.',
    'Add length or a symbol to make it harder to guess.',
    'A little longer would be stronger.',
    'Good password. Consider a phrase you will remember.',
    'Strong password. Keep it private and unique.'
  ];
  const index = Math.min(4, Math.max(0, password ? score : 0));
  return { score: index, label: labels[index], hint: hints[index] };
}

export function PasswordStrength({ password }: { password: string }) {
  const { score, label, hint } = passwordScore(password);
  const tones = ['bg-line', 'bg-danger', 'bg-warn', 'bg-accent', 'bg-success'];
  if (!password) return <p className="mt-1.5 text-[11.5px] text-faint">At least 8 characters, with a letter and a number.</p>;
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${index < score ? tones[score] : 'bg-line'}`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] text-muted">
        <span className="font-medium text-ink">{label}.</span> {hint}
      </p>
    </div>
  );
}
