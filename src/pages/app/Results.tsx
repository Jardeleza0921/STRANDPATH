import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, DownloadIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { MatchBadge, MatchBar } from '../../components/ui/Badge';
import { GuidanceNote } from '../../components/ui/GuidanceNote';
import { contributingStrengths, relatedInterests, resultMatches } from '../../data/results';

const nextSteps = [
'Read the full strand page for your strongest match',
'Check which of these strands your school actually offers',
'Show these results to your adviser, counsellor, or parents',
'Explore two pathways: one that excites you, one you know least about'];


export function Results() {
  const [top, ...rest] = resultMatches;

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-12">
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <p className="text-[13px] text-muted">Completed 14 September 2026 · 15 of 15 answered</p>
          <h1 className="mt-2 text-[36px] font-semibold leading-tight tracking-[-0.03em] text-ink">
            Your StrandPath results
          </h1>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-muted">
            Based on what you selected, these strands connect most closely to your interests and strengths.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <DownloadIcon className="h-4 w-4" aria-hidden="true" />
            Save PDF
          </Button>
          <Button to="/app/assessment/intro" variant="secondary" size="sm">
            <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
            Retake
          </Button>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">Strongest matches</h2>

          {/* Featured match */}
          <article className="mt-4 rounded-lg border border-brand bg-surface p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-brand">{top.name}</p>
                <h3 className="mt-1.5 text-[26px] font-semibold tracking-[-0.02em] text-ink">
                  Information & Communications Technology
                </h3>
              </div>
              <MatchBadge level={top.level} />
            </div>

            <div className="mt-5">
              <MatchBar level={top.level} percent={top.percent} />
            </div>

            <p className="mt-5 text-[16px] leading-relaxed text-ink">{top.explanation}</p>

            <div className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">
                  Strengths contributing
                </h4>
                <ul className="mt-2.5 space-y-1.5">
                  {top.strengths.map((s) =>
                  <li key={s} className="text-[14px] text-ink">
                      {s}
                    </li>
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Related interests</h4>
                <ul className="mt-2.5 space-y-1.5">
                  {top.interests.map((s) =>
                  <li key={s} className="text-[14px] text-ink">
                      {s}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-md bg-canvas p-5">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Things to explore</h4>
              <ul className="mt-2.5 space-y-2">
                {top.explore.map((e) =>
                <li key={e} className="flex gap-2.5 text-[14px] leading-relaxed text-ink">
                    <span className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                    {e}
                  </li>
                )}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button to={`/app/strands/${top.slug}`}>
                View strand details
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button to={`/app/pathways?strand=${top.slug}`} variant="secondary">
                Explore pathways
              </Button>
            </div>
          </article>

          {/* Other matches */}
          <div className="mt-5 space-y-4">
            {rest.map((m) =>
            <article key={m.slug} className="rounded-lg border border-line bg-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">{m.name}</h3>
                  <MatchBadge level={m.level} />
                </div>
                <div className="mt-4">
                  <MatchBar level={m.level} percent={m.percent} />
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{m.explanation}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...m.strengths, ...m.interests].slice(0, 4).map((t) =>
                <span key={t} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[13px] text-ink">
                      {t}
                    </span>
                )}
                </div>
                <div className="mt-5 flex flex-wrap gap-4 border-t border-line pt-4">
                  <Link
                  to={`/app/strands/${m.slug}`}
                  className="text-sm font-medium text-brand transition-colors duration-150 ease-out hover:text-brand-dark">
                  
                    View strand details
                  </Link>
                  <Link
                  to={`/app/pathways?strand=${m.slug}`}
                  className="text-sm font-medium text-muted transition-colors duration-150 ease-out hover:text-ink">
                  
                    Explore pathways
                  </Link>
                </div>
              </article>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-8 lg:self-start">
          <GuidanceNote />

          <section className="rounded-lg border border-line bg-surface p-6" aria-labelledby="strength-profile">
            <h2 id="strength-profile" className="text-[15px] font-semibold text-ink">
              Your strength profile
            </h2>
            <ul className="mt-4 space-y-3">
              {contributingStrengths.map((s) =>
              <li key={s.label} className="flex items-center justify-between gap-3">
                  <span className="text-[14px] text-ink">{s.label}</span>
                  <span
                  className={`text-[12px] font-medium ${
                  s.level === 'High' ? 'text-brand' : s.level === 'Moderate' ? 'text-muted' : 'text-faint'}`
                  }>
                  
                    {s.level}
                  </span>
                </li>
              )}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-[12px] leading-relaxed text-faint">
              Descriptive only. These labels reflect what you selected today, not a measure of ability.
            </p>
          </section>

          <section className="rounded-lg border border-line bg-surface p-6" aria-labelledby="interests">
            <h2 id="interests" className="text-[15px] font-semibold text-ink">
              Interests you selected
            </h2>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {relatedInterests.map((i) =>
              <span key={i} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[13px] text-ink">
                  {i}
                </span>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-surface p-6" aria-labelledby="next-steps">
            <h2 id="next-steps" className="text-[15px] font-semibold text-ink">
              Suggested next steps
            </h2>
            <ol className="mt-4 space-y-3">
              {nextSteps.map((s, i) =>
              <li key={s} className="flex gap-3 text-[14px] leading-relaxed text-ink">
                  <span className="text-[13px] font-semibold tabular-nums text-faint">{i + 1}</span>
                  {s}
                </li>
              )}
            </ol>
          </section>
        </aside>
      </div>
    </div>);

}