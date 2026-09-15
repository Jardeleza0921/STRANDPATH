import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GuidanceNote } from '../components/ui/GuidanceNote';
import { steps } from '../data/steps';

export function HowItWorks() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-content px-6 py-20">
          <p className="text-[13px] font-medium text-brand">How it works</p>
          <h1 className="mt-3 max-w-2xl text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
            From self-reflection to a direction worth exploring.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
            StrandPath moves in one direction, step by step. Nothing is scored, ranked, or recorded against you —
            each step simply adds detail to a picture you can read yourself.
          </p>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-content px-6 py-20">
          <ol className="space-y-px overflow-hidden rounded-lg border border-line bg-line">
            {steps.map((s) =>
            <li key={s.number} className="grid gap-6 bg-surface p-8 md:grid-cols-[80px_1fr_1.2fr] md:items-start">
                <span
                className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft text-[15px] font-semibold tabular-nums text-brand"
                aria-hidden="true">
                
                  {s.number}
                </span>
                <div>
                  <h2 className="text-[19px] font-semibold leading-snug tracking-[-0.015em] text-ink">{s.title}</h2>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.description}</p>
                </div>
                <p className="text-[15px] leading-relaxed text-muted md:border-l md:border-line md:pl-8">
                  {s.detail}
                </p>
              </li>
            )}
          </ol>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="mx-auto grid max-w-content gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.025em] text-ink">
              What the assessment asks
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">
              Fifteen questions across four areas. Most are simple selections; a few ask how much a statement sounds
              like you. There are no right answers and nothing is timed.
            </p>
            <div className="mt-8">
              <GuidanceNote />
            </div>
          </div>

          <dl className="grid gap-px self-start overflow-hidden rounded-lg border border-line bg-line">
            {[
            { t: 'Interests', d: 'Activities, subjects, and topics you are drawn to.' },
            { t: 'Strengths', d: 'Skills you already use, including outside the classroom.' },
            { t: 'Work style', d: 'How you learn, handle difficulty, and prefer to work.' },
            { t: 'Preferences', d: 'What you want from the next few years.' }].
            map((row) =>
            <div key={row.t} className="bg-surface px-6 py-5">
                <dt className="text-[15px] font-semibold text-ink">{row.t}</dt>
                <dd className="mt-1 text-[14px] text-muted">{row.d}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto flex max-w-content flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">Start when you are ready.</h2>
          <Button to="/app" size="lg">
            Start exploring
            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </>);

}