import React, { useState } from 'react';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { MobileHeader } from '../MobileHeader';
import { getStrand } from '../../../data/strands';
import { ScreenProps } from '../nav';
import { useScreenInit } from '../../../useScreenInit.js';

const tabs = ['Overview', 'Skills', 'Pathways'] as const;

export function MobileStrand({ go }: ScreenProps) {
  const screenInit = useScreenInit();
  const strand = getStrand('ict')!;
  const [tab, setTab] = useState<(typeof tabs)[number]>(
    screenInit.tab as (typeof tabs)[number] | undefined ?? 'Overview'
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileHeader title="ICT" onBack={() => go('results')} />

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <span className="inline-flex rounded-full border border-brand-edge bg-brand-soft px-2.5 py-1 text-[12px] font-medium text-brand-dark">
          TVL track
        </span>
        <h2 className="mt-3 text-[24px] font-semibold leading-tight tracking-[-0.025em] text-ink">{strand.name}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{strand.tagline}</p>

        <div
          role="tablist"
          aria-label="Strand sections"
          className="mt-5 flex gap-1 rounded-md border border-line bg-canvas p-1">
          
          {tabs.map((t) =>
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={[
            'flex-1 rounded-sm py-2.5 text-[13px] font-medium transition-colors duration-150 ease-out',
            tab === t ? 'bg-surface text-ink shadow-card' : 'text-muted'].
            join(' ')}>
            
              {t}
            </button>
          )}
        </div>

        {tab === 'Overview' &&
        <div className="mt-5 space-y-5">
            <p className="text-[15px] leading-relaxed text-ink">{strand.summary}</p>
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">What you may learn</h3>
              <ul className="mt-3 space-y-2">
                {strand.learn.slice(0, 4).map((l) =>
              <li key={l} className="rounded-md border border-line px-4 py-3 text-[14px] leading-snug text-ink">
                    {l}
                  </li>
              )}
              </ul>
            </div>
            <div className="rounded-md border border-warn/25 bg-warn-soft p-4">
              <h3 className="text-[14px] font-semibold text-ink">Things to consider</h3>
              <ul className="mt-2 space-y-1.5">
                {strand.considerations.map((c) =>
              <li key={c} className="text-[13px] leading-relaxed text-ink">
                    · {c}
                  </li>
              )}
              </ul>
            </div>
          </div>
        }

        {tab === 'Skills' &&
        <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">Skills commonly used</h3>
              <ul className="mt-3 space-y-2">
                {strand.skills.map((s) =>
              <li key={s} className="flex gap-2.5 text-[15px] text-ink">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    {s}
                  </li>
              )}
              </ul>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">
                Who may enjoy this strand
              </h3>
              <ul className="mt-3 space-y-2.5">
                {strand.suitedFor.map((s) =>
              <li key={s} className="rounded-md border border-line px-4 py-3 text-[14px] leading-snug text-ink">
                    {s}
                  </li>
              )}
              </ul>
            </div>
          </div>
        }

        {tab === 'Pathways' &&
        <div className="mt-5 space-y-6">
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">
                Possible college fields
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {strand.collegeFields.map((f) =>
              <span key={f} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[13px] text-ink">
                    {f}
                  </span>
              )}
              </div>
            </div>
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">
                Possible career areas
              </h3>
              <ul className="mt-3 space-y-2">
                {strand.careerAreas.map((c) =>
              <li key={c} className="rounded-md bg-canvas px-4 py-3 text-[14px] text-ink">
                    {c}
                  </li>
              )}
              </ul>
            </div>
            <p className="text-[13px] leading-relaxed text-faint">
              These are possible directions, not guaranteed outcomes.
            </p>
          </div>
        }
      </div>

      <div className="shrink-0 border-t border-line bg-surface p-4">
        <button
          type="button"
          onClick={() => go('pathway')}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-brand py-4 text-[16px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
          
          Explore related pathways
          <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
    </div>);

}