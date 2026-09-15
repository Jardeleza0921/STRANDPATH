import React from 'react';

export function LogoMark({ size = 28 }: {size?: number;}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-md bg-brand"
      style={{ width: size, height: size }}
      aria-hidden="true">
      
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 20 20" fill="none">
        <path d="M4 16V9a5 5 0 0 1 5-5h7" stroke="#fff" strokeWidth="2.2" strokeLinecap="square" />
        <rect x="13" y="1" width="6" height="6" fill="#fff" />
      </svg>
    </span>);

}

export function Logo({ inverted, size = 28 }: {inverted?: boolean;size?: number;}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        className={`text-[17px] font-semibold tracking-[-0.02em] ${inverted ? 'text-white' : 'text-ink'}`}>
        
        StrandPath
      </span>
    </span>);

}