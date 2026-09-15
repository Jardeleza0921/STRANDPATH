import React from 'react';
import { Pathway } from '../data/pathways';

export function PathwayMap({ pathway, dense }: {pathway: Pathway;dense?: boolean;}) {
  return (
    <div>
      <div className="flex flex-col items-center">
        <div className="rounded-md border border-brand bg-brand px-6 py-3.5 text-center">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand-edge">SHS strand</p>
          <p className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-white">{pathway.strand}</p>
        </div>
        <span className="h-8 w-px bg-line" aria-hidden="true" />
      </div>

      <p className="mb-4 text-center text-[12px] font-medium uppercase tracking-[0.08em] text-faint">College fields</p>

      <div className={`grid gap-4 ${dense ? '' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
        {pathway.branches.map((b) =>
        <div key={b.field} className="flex h-full flex-col rounded-lg border border-line bg-surface p-5">
            <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">{b.field}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{b.note}</p>

            <div className="my-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Career areas</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <ul className="mt-auto space-y-2">
              {b.careers.map((c) =>
            <li key={c} className="rounded-md bg-canvas px-3 py-2 text-[13px] text-ink">
                  {c}
                </li>
            )}
            </ul>
          </div>
        )}
      </div>
    </div>);

}