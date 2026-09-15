import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { MobileBottomNav } from '../MobileBottomNav';
import { MatchBadge, MatchBar } from '../../ui/Badge';
import { resultMatches } from '../../../data/results';
import { ScreenProps } from '../nav';

export function MobileResults({ go }: ScreenProps) {
  const [top, ...rest] = resultMatches;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-5">
        <p className="text-[13px] text-muted">Completed 14 September 2026</p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Your StrandPath results
        </h1>

        <p className="mt-4 rounded-md border border-brand-edge bg-brand-soft p-4 text-[13px] leading-relaxed text-brand-dark">
          These results are guidance to help you explore your options — not a final decision. Discuss them with a
          teacher, counsellor, or parent.
        </p>

        <h2 className="mt-7 text-[15px] font-semibold text-ink">Strongest matches</h2>

        <article className="mt-3 rounded-lg border border-brand p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">{top.name}</h3>
            <MatchBadge level={top.level} />
          </div>
          <div className="mt-4">
            <MatchBar level={top.level} percent={top.percent} />
          </div>
          <p className="mt-4 text-[14px] leading-relaxed text-ink">{top.explanation}</p>

          <div className="mt-4 border-t border-line pt-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Strengths contributing</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {top.strengths.map((s) =>
              <span key={s} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[12px] text-ink">
                  {s}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => go('strand')}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-brand py-3.5 text-[15px] font-medium text-white transition-colors duration-150 ease-out hover:bg-brand-dark">
            
            View strand details
            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </article>

        <div className="mt-4 space-y-3">
          {rest.map((m) =>
          <article key={m.slug} className="rounded-lg border border-line p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-semibold tracking-[-0.015em] text-ink">{m.name}</h3>
                <MatchBadge level={m.level} />
              </div>
              <div className="mt-3">
                <MatchBar level={m.level} percent={m.percent} />
              </div>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">{m.explanation}</p>
              <button
              type="button"
              onClick={() => go('strand')}
              className="mt-4 text-[14px] font-medium text-brand transition-colors duration-150 ease-out hover:text-brand-dark">
              
                View strand details
              </button>
            </article>
          )}
        </div>

        <section className="mt-6 rounded-lg border border-line p-5" aria-labelledby="m-next">
          <h2 id="m-next" className="text-[15px] font-semibold text-ink">
            Suggested next steps
          </h2>
          <ol className="mt-3 space-y-2.5">
            {top.explore.map((e, i) =>
            <li key={e} className="flex gap-3 text-[14px] leading-relaxed text-ink">
                <span className="text-[13px] font-semibold tabular-nums text-faint">{i + 1}</span>
                {e}
              </li>
            )}
          </ol>
        </section>

        <button
          type="button"
          onClick={() => go('pathway')}
          className="mt-5 flex w-full items-center justify-center rounded-md border border-line py-3.5 text-[15px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas">
          
          Explore pathways
        </button>
      </div>

      <MobileBottomNav active="results" go={go} />
    </div>);

}