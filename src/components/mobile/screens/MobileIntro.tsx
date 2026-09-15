import React from 'react';
import { ArrowRightIcon, ClockIcon, ListChecksIcon, ShieldCheckIcon } from 'lucide-react';
import { MobileHeader } from '../MobileHeader';
import { ScreenProps } from '../nav';

const points = [
{ icon: ListChecksIcon, t: '15 questions', d: 'Interests, strengths, work style, and preferences.' },
{ icon: ClockIcon, t: 'About 10 minutes', d: 'Pause any time — your answers are kept.' },
{ icon: ShieldCheckIcon, t: 'No right answers', d: 'Nothing here is scored, ranked, or graded.' }];


export function MobileIntro({ go }: ScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileHeader title="Assessment" onBack={() => go('home')} />

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink">Before you begin</h2>
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">
          You will answer short questions about what you enjoy and what you are good at. StrandPath then shows which
          strands relate most closely to your answers, and why.
        </p>

        <ul className="mt-6 space-y-3">
          {points.map(({ icon: Icon, t, d }) =>
          <li key={t} className="flex gap-3.5 rounded-md border border-line p-4">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="text-[15px] font-medium text-ink">{t}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{d}</p>
              </div>
            </li>
          )}
        </ul>

        <p className="mt-6 rounded-md border border-brand-edge bg-brand-soft p-4 text-[13px] leading-relaxed text-brand-dark">
          Your results are guidance to help you explore your options — not a final decision about your future.
        </p>
      </div>

      <div className="shrink-0 border-t border-line bg-surface p-4">
        <button
          type="button"
          onClick={() => go('question')}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-4 text-[16px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
          
          Begin
          <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
    </div>);

}