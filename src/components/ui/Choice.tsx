import React from 'react';
import { CheckIcon } from 'lucide-react';

interface ChoiceProps {
  label: string;
  hint?: string;
  selected: boolean;
  multi?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export function Choice({ label, hint, selected, multi, disabled, onSelect }: ChoiceProps) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      disabled={disabled && !selected}
      onClick={onSelect}
      className={[
      'group flex w-full items-start gap-3 rounded-md border p-4 text-left',
      'transition-[border-color,background-color] duration-150 ease-out',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
      selected ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-ink/25',
      disabled && !selected ? 'cursor-not-allowed opacity-45 hover:border-line' : ''].
      join(' ')}>
      
      <span
        className={[
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border',
        multi ? 'rounded-sm' : 'rounded-full',
        selected ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-transparent'].
        join(' ')}
        aria-hidden="true">
        
        {multi ?
        <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> :

        <span className={`h-2 w-2 rounded-full ${selected ? 'bg-white' : 'bg-transparent'}`} />
        }
      </span>
      <span className="min-w-0">
        <span className={`block text-[15px] leading-snug ${selected ? 'font-medium text-brand-dark' : 'text-ink'}`}>
          {label}
        </span>
        {hint && <span className="mt-1 block text-[13px] leading-snug text-muted">{hint}</span>}
      </span>
    </button>);

}

interface ScaleProps {
  options: {id: string;label: string;}[];
  value: string | null;
  onSelect: (id: string) => void;
}

export function ScaleChoice({ options, value, onSelect }: ScaleProps) {
  return (
    <div role="radiogroup" className="rounded-md border border-line bg-surface p-2">
      <div className="grid grid-cols-5 gap-2">
        {options.map((o) => {
          const selected = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(o.id)}
              className={[
              'flex flex-col items-center gap-2 rounded-md px-2 py-4 text-center',
              'transition-[background-color,color] duration-150 ease-out',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              selected ? 'bg-brand text-white' : 'text-muted hover:bg-canvas'].
              join(' ')}>
              
              <span className={`text-lg font-semibold tabular-nums ${selected ? 'text-white' : 'text-ink'}`}>
                {o.id}
              </span>
              <span className="text-[12px] leading-tight">{o.label}</span>
            </button>);

        })}
      </div>
    </div>);

}