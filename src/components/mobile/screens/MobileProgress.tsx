import React from 'react';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { MobileHeader } from '../MobileHeader';
import { Progress } from '../../ui/Progress';
import { ScreenProps } from '../nav';

const sections = [
{ t: 'Interests', done: 4, total: 4 },
{ t: 'Strengths', done: 4, total: 4 },
{ t: 'Work style', done: 4, total: 4 },
{ t: 'Preferences', done: 3, total: 3 }];


export function MobileProgress({ go }: ScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileHeader title="Your progress" onBack={() => go('question')} onClose={() => go('home')} />

      <div className="flex-1 overflow-y-auto px-5 py-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckIcon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        </span>

        <h2 className="mt-5 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink">
          15 of 15 answered
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          You have completed every section. Review any part before seeing your guidance.
        </p>

        <div className="mt-6 rounded-lg border border-line p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-[14px] font-medium text-ink">Overall</p>
            <p className="text-[14px] tabular-nums text-brand">100% complete</p>
          </div>
          <div className="mt-3">
            <Progress value={15} total={15} compact />
          </div>

          <ul className="mt-5 divide-y divide-line">
            {sections.map((s) =>
            <li key={s.t} className="flex items-center justify-between py-3">
                <span className="text-[14px] text-ink">{s.t}</span>
                <span className="inline-flex items-center gap-2 text-[13px] text-muted">
                  {s.done}/{s.total}
                  <CheckIcon className="h-4 w-4 text-success" aria-hidden="true" />
                </span>
              </li>
            )}
          </ul>
        </div>

        <p className="mt-6 rounded-md border border-brand-edge bg-brand-soft p-4 text-[13px] leading-relaxed text-brand-dark">
          These results are guidance to help you explore your options. Your final decision should consider your
          goals, circumstances, school offerings, and guidance from teachers, parents, or counsellors.
        </p>
      </div>

      <div className="shrink-0 border-t border-line bg-surface p-4">
        <button
          type="button"
          onClick={() => go('results')}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-4 text-[16px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
          
          See my guidance
          <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
    </div>);

}