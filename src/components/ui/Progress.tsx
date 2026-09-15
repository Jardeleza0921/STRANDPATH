import React from 'react';

interface ProgressProps {
  value: number;
  total: number;
  label?: string;
  compact?: boolean;
}

export function Progress({ value, total, label, compact }: ProgressProps) {
  const percent = Math.round(value / total * 100);
  return (
    <div className="w-full">
      {!compact &&
      <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[13px] font-medium text-ink">{label ?? `Question ${value} of ${total}`}</p>
          <p className="text-[13px] tabular-nums text-muted">{percent}% complete</p>
        </div>
      }
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Assessment progress'}>
        
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }} />
        
      </div>
    </div>);

}