import React, { useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';
import { MobileHeader } from '../MobileHeader';
import { getPathway } from '../../../data/pathways';
import { ScreenProps } from '../nav';
import { useScreenInit } from '../../../useScreenInit.js';

export function MobilePathway({ go }: ScreenProps) {
  const screenInit = useScreenInit();
  const pathway = getPathway('ict');
  const [open, setOpen] = useState<string>(
    typeof screenInit.open === 'string' ? screenInit.open : pathway.branches[0].field
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileHeader title="Pathways" onBack={() => go('strand')} />

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.025em] text-ink">
          Where ICT can lead
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">
          Tap a college field to see the career areas connected to it. These are possible pathways, not guaranteed
          outcomes.
        </p>

        <div className="mt-6 flex flex-col items-center">
          <div className="w-full rounded-md bg-brand px-5 py-4 text-center">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-brand-edge">SHS strand</p>
            <p className="mt-1 text-[18px] font-semibold text-white">ICT</p>
          </div>
          <span className="h-6 w-px bg-line" aria-hidden="true" />
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">College fields</p>
        </div>

        <ul className="mt-4 space-y-3">
          {pathway.branches.map((b) => {
            const expanded = open === b.field;
            return (
              <li key={b.field} className="overflow-hidden rounded-lg border border-line">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? '' : b.field)}
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
                  
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{b.field}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{b.note}</span>
                  </span>
                  <ChevronDownIcon
                    className={`h-5 w-5 shrink-0 text-faint transition-transform duration-200 ease-out ${
                    expanded ? 'rotate-180' : ''}`
                    }
                    aria-hidden="true" />
                  
                </button>

                {expanded &&
                <div className="border-t border-line bg-canvas px-4 py-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Career areas</p>
                    <ul className="mt-2.5 space-y-2">
                      {b.careers.map((c) =>
                    <li key={c} className="rounded-md bg-surface px-3.5 py-2.5 text-[14px] text-ink">
                          {c}
                        </li>
                    )}
                    </ul>
                  </div>
                }
              </li>);

          })}
        </ul>

        <p className="mt-6 rounded-md border border-line bg-canvas p-4 text-[13px] leading-relaxed text-muted">
          Many students enter these fields from other strands too. Use this map to see what exists, then check the
          entry requirements of specific schools.
        </p>
      </div>
    </div>);

}