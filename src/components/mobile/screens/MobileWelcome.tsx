import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { LogoMark } from '../../ui/Logo';
import { ScreenProps } from '../nav';

export function MobileWelcome({ go }: ScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 pt-10">
      <LogoMark size={44} />

      <h1 className="mt-8 text-[38px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink">
        Find a direction that fits you.
      </h1>
      <p className="mt-4 text-[16px] leading-relaxed text-muted">
        Explore your strengths, interests, and possible pathways before choosing your next step.
      </p>

      <ul className="mt-8 space-y-3">
        {[
        { n: '01', t: 'Answer 15 short questions' },
        { n: '02', t: 'See which strands may fit you' },
        { n: '03', t: 'Explore where they can lead' }].
        map((s) =>
        <li key={s.n} className="flex items-center gap-3 rounded-md border border-line px-4 py-3.5">
            <span className="text-[13px] font-semibold tabular-nums text-brand">{s.n}</span>
            <span className="text-[15px] text-ink">{s.t}</span>
          </li>
        )}
      </ul>

      <div className="mt-auto space-y-3 pt-8">
        <button
          type="button"
          onClick={() => go('home')}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-md bg-brand text-[16px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
          
          Start exploring
          <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => go('login')}
          className="flex h-14 w-full items-center justify-center rounded-md border border-line text-[16px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas">
          
          I already have an account
        </button>
        <p className="pt-1 text-center text-[12px] text-faint">
          StrandPath offers guidance, not decisions.
        </p>
      </div>
    </div>);

}