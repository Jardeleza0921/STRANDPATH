import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRightIcon, ChevronLeftIcon, XIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Progress } from '../../components/ui/Progress';
import { Choice, ScaleChoice } from '../../components/ui/Choice';
import { questions } from '../../data/questions';
import { useAssessment } from '../../contexts/AssessmentContext';

export function Assessment() {
  const { index = '1' } = useParams();
  const navigate = useNavigate();
  const { answers, select, total } = useAssessment();

  const position = Math.min(Math.max(parseInt(index, 10) || 1, 1), total);
  const question = questions[position - 1];
  const selected = answers[question.id] ?? [];
  const multi = question.kind === 'multi';
  const atMax = Boolean(question.maxChoices && selected.length >= question.maxChoices);
  const isLast = position === total;

  const goNext = () => {
    if (isLast) navigate('/app/assessment/review');else
    navigate(`/app/assessment/${position + 1}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[760px] items-center gap-6 px-8 py-4">
          <div className="flex-1">
            <Progress value={position} total={total} />
          </div>
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] text-muted transition-colors duration-150 ease-out hover:text-ink">
            
            <XIcon className="h-4 w-4" aria-hidden="true" />
            Save & exit
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[760px] flex-1 px-8 py-12">
        <p className="text-[13px] font-medium text-brand">{question.section}</p>
        <h1 className="mt-3 text-[30px] font-semibold leading-[1.2] tracking-[-0.025em] text-ink">
          {question.prompt}
        </h1>
        {question.helper && <p className="mt-3 text-[15px] leading-relaxed text-muted">{question.helper}</p>}

        <div className="mt-8">
          {question.kind === 'scale' ?
          <ScaleChoice
            options={question.options}
            value={selected[0] ?? null}
            onSelect={(id) => select(question.id, id, false)} /> :


          <div className="grid gap-3 sm:grid-cols-2">
              {question.options.map((o) =>
            <Choice
              key={o.id}
              label={o.label}
              hint={o.hint}
              multi={multi}
              selected={selected.includes(o.id)}
              disabled={multi && atMax}
              onSelect={() => select(question.id, o.id, multi, question.maxChoices)} />

            )}
            </div>
          }
        </div>

        {multi && question.maxChoices &&
        <p className="mt-4 text-[13px] text-faint" aria-live="polite">
            {selected.length} of {question.maxChoices} selected
          </p>
        }
      </div>

      <div className="sticky bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[760px] items-center justify-between gap-4 px-8 py-4">
          {position > 1 ?
          <Button to={`/app/assessment/${position - 1}`} variant="secondary">
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back
            </Button> :

          <Button to="/app/assessment/intro" variant="secondary">
              <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
          }

          <div className="flex items-center gap-3">
            {selected.length === 0 && <span className="text-[13px] text-faint">Select an answer to continue</span>}
            <Button onClick={goNext} disabled={selected.length === 0}>
              {isLast ? 'Finish' : 'Next'}
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>);

}