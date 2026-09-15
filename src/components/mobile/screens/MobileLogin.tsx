import React from 'react';
import { MobileHeader } from '../MobileHeader';
import { ScreenProps } from '../nav';

function Field({ label, placeholder, type = 'text' }: {label: string;placeholder: string;type?: string;}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-line bg-surface px-4 py-3.5 text-[15px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
      
    </label>);

}

export function MobileLogin({ go }: ScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileHeader title="Sign in" onBack={() => go('welcome')} />

      <div className="flex-1 overflow-y-auto px-6 py-7">
        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink">
          Save your results
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Signing in is optional. You can take the assessment without an account — an account only lets you save and
          revisit results.
        </p>

        <div className="mt-7 space-y-5">
          <Field label="School email" placeholder="you@school.edu.ph" type="email" />
          <Field label="Password" placeholder="••••••••" type="password" />
        </div>

        <button
          type="button"
          onClick={() => go('home')}
          className="mt-7 flex h-14 w-full items-center justify-center rounded-md bg-brand text-[16px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
          
          Sign in
        </button>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[12px] text-faint">or</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <button
          type="button"
          onClick={() => go('home')}
          className="flex h-14 w-full items-center justify-center rounded-md border border-line text-[16px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas">
          
          Continue without an account
        </button>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
          StrandPath does not collect grades or share answers with your school.
        </p>
      </div>
    </div>);

}