import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';

const principles = [
{
  title: 'Guidance over prediction',
  body: 'StrandPath describes connections between what a student selected and what a strand involves. It does not forecast success, aptitude, or income.'
},
{
  title: 'Explanation over scoring',
  body: 'Every match is accompanied by the reasoning behind it, so a student can judge whether it actually reflects them.'
},
{
  title: 'Language over labels',
  body: 'The goal is to give students words for their own strengths and interests — words they can use in a real conversation.'
},
{
  title: 'Context over certainty',
  body: 'Results include things to consider: school offerings, costs, requirements, and the people whose advice matters.'
}];


export function About() {
  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-content px-6 py-20">
          <p className="text-[13px] font-medium text-brand">About StrandPath</p>
          <h1 className="mt-3 max-w-3xl text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
            Built so students can enter the strand decision prepared, not pressured.
          </h1>
        </div>
      </section>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-content gap-14 px-6 py-20 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.025em] text-ink">Why it exists</h2>
          </div>
          <div className="space-y-4 text-[16px] leading-relaxed text-muted">
            <p className="text-[17px] text-ink">
              Grade 10 students are asked to pick a strand at a point when few have had a structured chance to think
              about what they are good at or what they enjoy.
            </p>
            <p>
              Guidance offices are often responsible for hundreds of students at once, and the conversation that
              would help most — an unhurried one about interests and strengths — is the hardest to schedule. Students
              fall back on what their friends chose or what sounds employable.
            </p>
            <p>
              StrandPath is an attempt to give every student the first half of that conversation on their own time:
              a structured reflection, a set of matches with clear reasoning, and a map of where each strand can
              lead. The second half still belongs to teachers, counsellors, and families.
            </p>
          </div>
        </div>
      </section>

      <section id="philosophy" className="border-b border-line scroll-mt-24">
        <div className="mx-auto max-w-content px-6 py-20">
          <h2 className="text-[30px] font-semibold tracking-[-0.025em] text-ink">Our guidance principles</h2>
          <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
            {principles.map((p) =>
            <div key={p.title} className="bg-canvas p-8">
                <dt className="text-[17px] font-semibold tracking-[-0.01em] text-ink">{p.title}</dt>
                <dd className="mt-2.5 text-[15px] leading-relaxed text-muted">{p.body}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto flex max-w-content flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <h2 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">
              See how StrandPath describes your options.
            </h2>
            <p className="mt-2 text-[15px] text-muted">No account required to try the assessment.</p>
          </div>
          <Button to="/app" size="lg">
            Start exploring
            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </Button>
        </div>
      </section>
    </>);

}