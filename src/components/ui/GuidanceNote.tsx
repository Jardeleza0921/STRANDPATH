import React from 'react';
import { InfoIcon } from 'lucide-react';
import { guidanceNotice } from '../../data/results';

export function GuidanceNote({ compact }: {compact?: boolean;}) {
  return (
    <aside
      className={`flex gap-3 rounded-md border border-brand-edge bg-brand-soft ${compact ? 'p-3.5' : 'p-5'}`}
      aria-label="Guidance notice">
      
      <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" aria-hidden="true" />
      <p className={`text-brand-dark ${compact ? 'text-[13px] leading-relaxed' : 'text-sm leading-relaxed'}`}>
        {guidanceNotice}
      </p>
    </aside>);

}