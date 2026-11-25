import React from 'react';
import { AlertCircleIcon, Loader2Icon } from 'lucide-react';

export function Card({
  children,
  className = '',
  as: Tag = 'div'
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={`sp-card ${className}`}>{children}</Tag>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] font-medium text-brand">{eyebrow}</p>}
        <h1 className="mt-1.5 text-[32px] font-semibold leading-tight tracking-[-0.03em] text-ink lg:text-[36px]">
          {title}
        </h1>
        {description && <div className="mt-2.5 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  required
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-accent" aria-hidden="true"> *</span>}
      </label>
      {hint && <p className="mt-1 text-[12px] leading-relaxed text-muted">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const inputClass =
  'sp-input w-full rounded-md px-3.5 py-2.5 text-[14px] text-ink placeholder:text-faint disabled:bg-canvas disabled:text-muted';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input {...rest} className={`${inputClass} ${className}`} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea {...rest} className={`${inputClass} min-h-[110px] resize-y leading-relaxed ${className}`} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <select {...rest} className={`${inputClass} ${className}`}>
      {children}
    </select>
  );
}

const alertTones = {
  info: 'border-brand-edge bg-brand-soft text-brand-dark',
  success: 'border-success/20 bg-success-soft text-success',
  warn: 'border-warn/25 bg-warn-soft text-warn',
  danger: 'border-danger/25 bg-danger-soft text-danger'
};

export function Alert({
  tone = 'info',
  title,
  children,
  className = ''
}: {
  tone?: keyof typeof alertTones;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={`rounded-md border px-4 py-3.5 text-[13px] leading-relaxed ${alertTones[tone]} ${className}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-1' : ''}>{children}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface/70 px-6 py-14 text-center">
      {Icon && <Icon className="h-6 w-6 text-faint" />}
      <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
      {description && <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-[14px] text-muted" role="status">
      <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-danger/25 bg-danger-soft px-4 py-3.5 text-[13px] text-danger">
      <div className="flex items-start gap-2">
        <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">{message}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="mt-1.5 font-semibold underline underline-offset-2">
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="sp-card px-5 py-4">
      <p className="text-[12px] font-medium uppercase tracking-[0.05em] text-faint">{label}</p>
      <p className="mt-1.5 text-[24px] font-semibold leading-none tracking-[-0.02em] text-ink">{value}</p>
      {note && <p className="mt-1.5 text-[12px] text-muted">{note}</p>}
    </div>
  );
}

const barTones = {
  brand: 'bg-brand',
  success: 'bg-success',
  accent: 'bg-accent',
  muted: 'bg-faint'
};

export function ScoreBar({
  percent,
  tone = 'brand',
  label
}: {
  percent: number;
  tone?: keyof typeof barTones;
  label?: string;
}) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line"
      role="img"
      aria-label={label ?? `${Math.round(value)} percent`}
    >
      <div className={`h-full rounded-full ${barTones[tone]}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Chip({
  children,
  tone = 'neutral'
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warn' | 'accent';
}) {
  const tones = {
    neutral: 'border-line bg-canvas text-muted',
    brand: 'border-brand-edge bg-brand-soft text-brand-dark',
    success: 'border-success/20 bg-success-soft text-success',
    warn: 'border-warn/20 bg-warn-soft text-warn',
    accent: 'border-accent/20 bg-accent-soft text-accent'
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-line bg-canvas px-4 py-3 text-[12px] leading-relaxed text-muted">{children}</p>
  );
}
