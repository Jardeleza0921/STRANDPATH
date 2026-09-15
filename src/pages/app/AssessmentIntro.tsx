import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ChevronLeftIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GuidanceNote } from '../../components/ui/GuidanceNote';

const facts = [
{ label: 'Questions', value: '15' },
{ label: 'Estimated time', value: '10 min' },
{ label: 'Right answers', value: 'None' }];


const sections = [
{ t: 'Interests', d: 'Activities, subjects, and topics you are drawn to.' },
{ t: 'Strengths', d: 'Skills you already use, in and out of class.' },
{ t: 'Work style', d: 'How you learn and how you handle difficulty.' },
{ t: 'Preferences', d: 'What you want from the next few years.' }];


export function AssessmentIntro() {
  return (
    <div className="mx-auto max-w-[760px] px-8 py-12">
      <Link
        to="/app"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
        
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Dashboard
      </Link>

      <h1 className="mt-6 text-[36px] font-semibold leading-tight tracking-[-0.03em] text-ink">
        Before you begin
      </h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">
        This assessment helps describe your interests, strengths, and preferences, then connects them to the SHS
        strands they most closely relate to. Answer as honestly as you can — the more accurate your answers, the more
        useful the guidance.
      </p>

      <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {facts.map((f) =>
        <div key={f.label} className="bg-surface px-6 py-5">
            <dt className="text-[13px] text-faint">{f.label}</dt>
            <dd className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-ink">{f.value}</dd>
          </div>
        )}
      </dl>

      <h2 className="mt-12 text-[19px] font-semibold tracking-[-0.015em] text-ink">What you will answer</h2>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
        {sections.map((s, i) =>
        <li key={s.t} className="flex gap-4 px-6 py-4">
            <span className="text-[13px] font-semibold tabular-nums text-faint">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <p className="text-[15px] font-medium text-ink">{s.t}</p>
              <p className="mt-0.5 text-[14px] text-muted">{s.d}</p>
            </div>
          </li>
        )}
      </ul>

      <div className="mt-10">
        <GuidanceNote />
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-line pt-8">
        <Button to="/app/assessment/1" size="lg">
          Begin
          <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>
        <Button to="/app" variant="secondary" size="lg">
          Not now
        </Button>
      </div>
    </div>);

}