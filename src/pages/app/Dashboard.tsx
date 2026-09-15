import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ClockIcon, LayersIcon, RouteIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Progress } from '../../components/ui/Progress';
import { useAssessment } from '../../contexts/AssessmentContext';
import { gridStrands } from '../../data/strands';

const shortcuts = [
{
  to: '/app/strands/ict',
  icon: LayersIcon,
  title: 'Explore strands',
  body: 'Read what each of the seven strands involves before or after your assessment.'
},
{
  to: '/app/pathways',
  icon: RouteIcon,
  title: 'Explore pathways',
  body: 'Follow a strand toward related college fields and career areas.'
}];


export function Dashboard() {
  const { answeredCount, total } = useAssessment();
  const started = answeredCount > 0;

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-12">
      <header>
        <p className="text-[13px] text-muted">Tuesday, 14 September</p>
        <h1 className="mt-2 text-[36px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Welcome to StrandPath, Maria.
        </h1>
        <p className="mt-2 text-[17px] text-muted">Let’s discover what may fit you.</p>
      </header>

      <section
        className="mt-10 rounded-lg border border-line bg-surface p-8"
        aria-labelledby="assessment-card">
        
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-lg">
            <Badge tone="brand">{started ? 'In progress' : 'Not started'}</Badge>
            <h2 id="assessment-card" className="mt-4 text-[24px] font-semibold tracking-[-0.02em] text-ink">
              {started ? 'Continue your assessment' : 'Start your assessment'}
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Fifteen questions about your interests, strengths, and how you prefer to work. You can pause and come
              back at any point.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-faint">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              About 10 minutes
            </p>
          </div>

          <div className="w-full max-w-xs shrink-0">
            <Progress value={answeredCount} total={total} label={`${answeredCount} of ${total} answered`} />
            <div className="mt-5">
              <Button to="/app/assessment/intro" full size="lg">
                {started ? 'Continue assessment' : 'Start assessment'}
                <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_1fr]">
        {shortcuts.map(({ to, icon: Icon, title, body }) =>
        <Link
          key={to}
          to={to}
          className="group flex flex-col rounded-lg border border-line bg-surface p-6 transition-colors duration-150 ease-out hover:border-ink/25">
          
            <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            <h2 className="mt-3.5 text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{body}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-medium text-brand">
              Open
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          </Link>
        )}
      </div>

      <section className="mt-10" aria-labelledby="previous">
        <div className="flex items-end justify-between gap-4">
          <h2 id="previous" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
            Previous results
          </h2>
          <Link to="/app/results" className="text-sm font-medium text-brand hover:text-brand-dark">
            View saved result
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          <li className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
            <div>
              <p className="text-[15px] font-medium text-ink">Assessment · 2 September 2026</p>
              <p className="mt-1 text-[13px] text-muted">Strongest matches: ICT, STEM, ABM</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="success">Completed</Badge>
              <Button to="/app/results" variant="secondary" size="sm">
                View
              </Button>
            </div>
          </li>
          <li className="px-6 py-5 text-[14px] text-faint">
            Results are kept so you can compare how your answers change over time.
          </li>
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="quick-strands">
        <h2 id="quick-strands" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
          Jump to a strand
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {gridStrands.map((s) =>
          <Link
            key={s.slug}
            to={`/app/strands/${s.slug}`}
            className="rounded-full border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:border-brand hover:text-brand">
            
              {s.code}
            </Link>
          )}
        </div>
      </section>
    </div>);

}