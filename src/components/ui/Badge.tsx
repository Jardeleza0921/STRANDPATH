import React from 'react';
import { MatchLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'success' | 'warn' | 'accent';
}

const tones = {
  neutral: 'bg-canvas text-muted border-line',
  brand: 'bg-brand-soft text-brand-dark border-brand-edge',
  success: 'bg-success-soft text-success border-success/20',
  warn: 'bg-warn-soft text-warn border-warn/20',
  accent: 'bg-accent-soft text-accent border-accent/20'
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[12px] font-medium leading-none ${tones[tone]}`}>
      
      {children}
    </span>);

}

const matchCopy: Record<MatchLevel, {label: string;tone: 'brand' | 'success' | 'neutral';}> = {
  strong: { label: 'Strong match', tone: 'brand' },
  good: { label: 'Good match', tone: 'success' },
  possible: { label: 'Possible match', tone: 'neutral' }
};

export function MatchBadge({ level }: {level: MatchLevel;}) {
  const { label, tone } = matchCopy[level];
  return <Badge tone={tone}>{label}</Badge>;
}

export function MatchBar({ level, percent }: {level: MatchLevel;percent: number;}) {
  const fill = level === 'strong' ? 'bg-brand' : level === 'good' ? 'bg-success' : 'bg-faint';
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${matchCopy[level].label}, ${percent} out of 100 alignment`}>
        
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${percent}%` }} />
      </div>
      <span className="w-9 text-right text-[13px] font-medium tabular-nums text-muted">{percent}</span>
    </div>);

}