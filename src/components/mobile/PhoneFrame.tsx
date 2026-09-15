import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
  label?: string;
}

export function PhoneFrame({ children, label }: PhoneFrameProps) {
  return (
    <figure className="m-0 flex flex-col items-center">
      <div
        className="relative flex flex-col overflow-hidden rounded-[36px] border border-line bg-surface"
        style={{ width: 390, height: 844 }}>
        
        {/* Status bar */}
        <div className="flex h-11 shrink-0 items-center justify-between px-7 pt-1 text-[13px] font-semibold text-ink">
          <span className="tabular-nums">9:41</span>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="flex items-end gap-[2px]">
              <span className="h-1.5 w-[3px] rounded-sm bg-ink" />
              <span className="h-2 w-[3px] rounded-sm bg-ink" />
              <span className="h-2.5 w-[3px] rounded-sm bg-ink" />
              <span className="h-3 w-[3px] rounded-sm bg-ink/30" />
            </span>
            <span className="ml-1 h-3 w-6 rounded-[3px] border border-ink/40 p-[2px]">
              <span className="block h-full w-2/3 rounded-[1px] bg-ink" />
            </span>
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>

        {/* Home indicator */}
        <div className="flex h-6 shrink-0 items-center justify-center">
          <span className="h-1 w-[134px] rounded-full bg-ink/25" aria-hidden="true" />
        </div>
      </div>
      {label && <figcaption className="mt-4 text-[13px] font-medium text-muted">{label}</figcaption>}
    </figure>);

}