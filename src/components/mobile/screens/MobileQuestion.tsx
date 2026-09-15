import React, { useState } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { MobileHeader } from '../MobileHeader';
import { Progress } from '../../ui/Progress';
import { Choice } from '../../ui/Choice';
import { questions } from '../../../data/questions';
import { ScreenProps } from '../nav';

const question = questions[0];

export function MobileQuestion({ go }: ScreenProps) {
  const [selected, setSelected] = useState<string[]>(['build-tech']);
  const max = question.maxChoices ?? 3;
  const atMax = selected.length >= max;

  const toggle = (id: string) =>
  setSelected((prev) =>
  prev.includes(id) ? prev.filter((p) => p !== id) : prev.length >= max ? prev : [...prev, id]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MobileHeader title="Question 6 of 15" onBack={() => go('intro')} onClose={() => go('home')} />

      <div className="shrink-0 px-5 pt-4">
        <Progress value={6} total={15} compact />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand">{question.section}</p>
        <h2 className="mt-2 text-[22px] font-semibold leading-snug tracking-[-0.02em] text-ink">{question.prompt}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted">{question.helper}</p>

        <div className="mt-5 space-y-3">
          {question.options.map((o) =>
          <Choice
            key={o.id}
            label={o.label}
            hint={o.hint}
            multi
            selected={selected.includes(o.id)}
            disabled={atMax}
            onSelect={() => toggle(o.id)} />

          )}
        </div>

        <p className="mt-4 text-[13px] text-faint" aria-live="polite">
          {selected.length} of {max} selected
        </p>
      </div>

      <div className="shrink-0 border-t border-line bg-surface p-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => go('intro')}
            className="flex-1 rounded-md border border-line py-4 text-[15px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas">
            
            Back
          </button>
          <button
            type="button"
            onClick={() => go('progress')}
            disabled={selected.length === 0}
            className="flex flex-[1.4] items-center justify-center gap-2 rounded-md bg-brand py-4 text-[15px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark disabled:bg-brand/40">
            
            Next
            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>);

}