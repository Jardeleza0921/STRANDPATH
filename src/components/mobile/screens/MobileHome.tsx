import React from 'react';
import { ArrowRightIcon, LayersIcon, RouteIcon } from 'lucide-react';
import { LogoMark } from '../../ui/Logo';
import { Progress } from '../../ui/Progress';
import { MobileBottomNav } from '../MobileBottomNav';
import { ScreenProps } from '../nav';

export function MobileHome({ go }: ScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
        <div className="flex items-center justify-between">
          <LogoMark size={30} />
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[12px] font-medium text-white"
            aria-hidden="true">
            
            MR
          </span>
        </div>

        <h1 className="mt-6 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Welcome to StrandPath, Maria.
        </h1>
        <p className="mt-1.5 text-[15px] text-muted">Let’s discover what may fit you.</p>

        <section className="mt-6 rounded-lg border border-brand bg-brand-soft p-5" aria-labelledby="m-assess">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand">In progress</p>
          <h2 id="m-assess" className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-ink">
            Continue your assessment
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-brand-dark/80">
            6 of 15 answered · about 6 minutes left
          </p>
          <div className="mt-4">
            <Progress value={6} total={15} compact />
          </div>
          <button
            type="button"
            onClick={() => go('intro')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-brand py-4 text-[15px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
            
            Continue
            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
          { id: 'strand' as const, icon: LayersIcon, label: 'Explore strands', note: '7 strands' },
          { id: 'pathway' as const, icon: RouteIcon, label: 'Explore pathways', note: 'Strand → career' }].
          map(({ id, icon: Icon, label, note }) =>
          <button
            key={id}
            type="button"
            onClick={() => go(id)}
            className="flex flex-col items-start rounded-lg border border-line p-4 text-left transition-colors duration-150 ease-out hover:border-ink/25">
            
              <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
              <span className="mt-3 text-[15px] font-medium leading-snug text-ink">{label}</span>
              <span className="mt-1 text-[12px] text-faint">{note}</span>
            </button>
          )}
        </div>

        <section className="mt-7" aria-labelledby="m-previous">
          <h2 id="m-previous" className="text-[15px] font-semibold text-ink">
            Previous results
          </h2>
          <button
            type="button"
            onClick={() => go('results')}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-lg border border-line p-4 text-left transition-colors duration-150 ease-out hover:border-ink/25">
            
            <span>
              <span className="block text-[14px] font-medium text-ink">2 September 2026</span>
              <span className="mt-0.5 block text-[13px] text-muted">ICT · STEM · ABM</span>
            </span>
            <ArrowRightIcon className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
          </button>
        </section>

        <p className="mt-7 rounded-md border border-line bg-canvas p-4 text-[13px] leading-relaxed text-muted">
          StrandPath gives guidance to explore, not a final decision. Talk your results through with a teacher,
          counsellor, or parent.
        </p>
      </div>

      <MobileBottomNav active="home" go={go} />
    </div>);

}