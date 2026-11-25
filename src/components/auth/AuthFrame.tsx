import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2Icon, LockIcon, SparklesIcon } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';

export function AuthFrame({
  eyebrow,
  title,
  description,
  children,
  wide
}: {
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`mx-auto grid max-w-content gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-14 ${wide ? 'lg:grid-cols-[1fr_560px]' : 'lg:grid-cols-[1fr_470px]'}`}>
      <div className="sp-panel hidden rounded-lg p-9 lg:flex lg:flex-col lg:justify-between">
        <div>
          <Link to="/" aria-label="StrandPath home" className="inline-flex">
            <Logo inverted size={30} />
          </Link>
          <p className="mt-10 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-panel-muted">{eyebrow}</p>
          <h1 className="mt-3 max-w-md font-display text-[34px] font-bold leading-[1.16] text-panel-ink">{title}</h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-panel-muted">{description}</p>
        </div>
        <ul className="mt-10 space-y-3 text-[12.5px] leading-relaxed text-panel-muted">
          <li className="flex items-start gap-2.5">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-panel-ink/80" aria-hidden />
            Passwords are hashed on the server. Sessions use an HTTP-only cookie.
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-panel-ink/80" aria-hidden />
            Only you and authorised guidance staff can see your records. Staff access is logged.
          </li>
          <li className="flex items-start gap-2.5">
            <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-panel-ink/80" aria-hidden />
            Your assessment results never lock you into a strand. The choice stays yours.
          </li>
        </ul>
      </div>

      <div className="min-w-0">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link to="/" className="lg:hidden" aria-label="StrandPath home">
            <Logo size={24} />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] font-medium text-faint">Theme</span>
            <ThemeSwitcher />
          </div>
        </div>
        <div className="mb-4 lg:hidden">
          <p className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
          <h1 className="mt-2 font-display text-[27px] font-bold leading-[1.18] text-ink">{title}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">{description}</p>
        </div>
        <div className="sp-card p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
