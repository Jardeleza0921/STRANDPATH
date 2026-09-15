import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const flows = [
{
  title: 'Public website',
  note: 'Marketing and information',
  steps: [
  { label: 'Landing', to: '/landing' },
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Explore strands', to: '/strands' },
  { label: 'Strand detail', to: '/strands/ict' },
  { label: 'About', to: '/about' }]

},
{
  title: 'Web application',
  note: 'Assessment, results, exploration',
  steps: [
  { label: 'Dashboard', to: '/app' },
  { label: 'Assessment intro', to: '/app/assessment/intro' },
  { label: 'Questions', to: '/app/assessment/1' },
  { label: 'Progress', to: '/app/assessment/review' },
  { label: 'Results', to: '/app/results' },
  { label: 'Strand detail', to: '/app/strands/ict' },
  { label: 'Pathways', to: '/app/pathways' }]

},
{
  title: 'Mobile application',
  note: '390 × 844 · 10 screens',
  steps: [
  { label: 'Interactive phone', to: '/mobile' },
  { label: 'All frames', to: '/mobile/all' }]

},
{
  title: 'Design system',
  note: 'Colours, type, components',
  steps: [{ label: 'Open design system', to: '/design-system' }]
}];


export function Cover() {
  return (
    <div className="min-h-full w-full bg-canvas">
      <div className="mx-auto max-w-content px-6 py-20">
        <Logo size={32} />

        <h1 className="mt-10 max-w-3xl text-[56px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink">
          StrandPath
        </h1>
        <p className="mt-4 max-w-2xl text-[20px] leading-relaxed text-muted">
          A student guidance platform that helps Senior High School students explore suitable strands and possible
          college and career directions — based on their interests, skills, strengths, and preferences.
        </p>
        <p className="mt-6 max-w-2xl border-l-2 border-brand pl-5 text-[17px] leading-relaxed text-ink">
          StrandPath doesn’t choose a student’s future for them. It helps them understand their options and find a
          direction worth exploring.
        </p>

        <div className="mt-16 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-2">
          {flows.map((f) =>
          <section key={f.title} className="bg-surface p-8">
              <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{f.title}</h2>
              <p className="mt-1 text-[13px] text-faint">{f.note}</p>

              <ol className="mt-5 space-y-2">
                {f.steps.map((s, i) =>
              <li key={s.to} className="flex items-center gap-3">
                    <span className="text-[12px] tabular-nums text-faint">{String(i + 1).padStart(2, '0')}</span>
                    <Link
                  to={s.to}
                  className="group inline-flex flex-1 items-center justify-between gap-3 rounded-md border border-line px-4 py-3 text-[15px] text-ink transition-colors duration-150 ease-out hover:border-brand hover:text-brand">
                  
                      {s.label}
                      <ArrowRightIcon className="h-4 w-4 text-faint transition-colors duration-150 ease-out group-hover:text-brand" aria-hidden="true" />
                    </Link>
                  </li>
              )}
              </ol>
            </section>
          )}
        </div>

        <p className="mt-10 text-[13px] leading-relaxed text-faint">
          Prototype only. Assessment answers are not scored — the results screen shows a scripted example so the
          guidance experience can be reviewed end to end.
        </p>
      </div>
    </div>);

}
