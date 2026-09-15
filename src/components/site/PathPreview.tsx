import React from 'react';
import { ArrowDownIcon } from 'lucide-react';

const rows = [
{ label: 'ICT', note: 'Strong match', tone: 'brand' as const },
{ label: 'STEM', note: 'Good match', tone: 'success' as const },
{ label: 'ABM', note: 'Possible match', tone: 'neutral' as const }];


export function PathPreview() {
  return (
    <div className="rounded-lg border border-line bg-surface p-6" aria-hidden="true">
      <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-faint">Sample guidance</p>

      <div className="mt-4 space-y-2.5">
        {rows.map((r) =>
        <div
          key={r.label}
          className={[
          'flex items-center justify-between rounded-md border px-4 py-3.5',
          r.tone === 'brand' ?
          'border-brand bg-brand-soft' :
          r.tone === 'success' ?
          'border-success/25 bg-success-soft' :
          'border-line bg-canvas'].
          join(' ')}>
          
            <span
            className={`text-[15px] font-semibold tracking-[-0.01em] ${
            r.tone === 'brand' ? 'text-brand-dark' : 'text-ink'}`
            }>
            
              {r.label}
            </span>
            <span
            className={`text-[13px] ${
            r.tone === 'brand' ? 'text-brand' : r.tone === 'success' ? 'text-success' : 'text-muted'}`
            }>
            
              {r.note}
            </span>
          </div>
        )}
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <ArrowDownIcon className="h-4 w-4 text-faint" />
        <span className="h-px flex-1 bg-line" />
      </div>

      <p className="text-[13px] text-muted">Pathways to explore from ICT</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {['Information Technology', 'Computer Science', 'Multimedia Arts', 'UI/UX Design'].map((t) =>
        <span key={t} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[13px] text-ink">
            {t}
          </span>
        )}
      </div>
    </div>);

}