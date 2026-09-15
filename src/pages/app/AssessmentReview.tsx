import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { GuidanceNote } from '../../components/ui/GuidanceNote';
import { questions } from '../../data/questions';
import { useAssessment } from '../../contexts/AssessmentContext';

const sectionOrder = ['Interests', 'Strengths', 'Work style', 'Preferences'];

export function AssessmentReview() {
  const { answers, answeredCount, total } = useAssessment();

  return (
    <div className="mx-auto max-w-[760px] px-8 py-14">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
        <CheckIcon className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
      </span>

      <h1 className="mt-6 text-[34px] font-semibold leading-tight tracking-[-0.03em] text-ink">
        That’s everything we need.
      </h1>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">
        You answered {answeredCount} of {total} questions. Review your sections below, or go straight to your
        guidance.
      </p>

      <div className="mt-8 rounded-lg border border-line bg-surface p-6">
        <Progress value={answeredCount} total={total} label={`${answeredCount} of ${total} answered`} />

        <ul className="mt-6 divide-y divide-line">
          {sectionOrder.map((section) => {
            const inSection = questions.filter((q) => q.section === section);
            const done = inSection.filter((q) => (answers[q.id] ?? []).length > 0).length;
            const first = questions.findIndex((q) => q.section === section) + 1;
            return (
              <li key={section} className="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <p className="text-[15px] font-medium text-ink">{section}</p>
                  <p className="text-[13px] text-muted">
                    {done} of {inSection.length} answered
                  </p>
                </div>
                <Link
                  to={`/app/assessment/${first}`}
                  className="text-[13px] font-medium text-brand transition-colors duration-150 ease-out hover:text-brand-dark">
                  
                  Review
                </Link>
              </li>);

          })}
        </ul>
      </div>

      <div className="mt-8">
        <GuidanceNote />
      </div>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-line pt-8">
        <Button to="/app/results" size="lg">
          See my guidance
          <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        </Button>
        <Button to={`/app/assessment/${total}`} variant="secondary" size="lg">
          Back to last question
        </Button>
      </div>
    </div>);

}