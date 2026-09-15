import React from 'react';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Strand } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface Props {
  strand: Strand;
  pathwayHref: string;
}

function List({ title, items, marker }: {title: string;items: string[];marker?: boolean;}) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((i) =>
        <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
            {marker ?
          <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" /> :

          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden="true" />
          }
            <span>{i}</span>
          </li>
        )}
      </ul>
    </div>);

}

export function StrandDetailContent({ strand, pathwayHref }: Props) {
  return (
    <div>
      <header className="border-b border-line pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{strand.code}</Badge>
          <Badge>{strand.track} track</Badge>
        </div>
        <h1 className="mt-5 max-w-3xl text-[40px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
          {strand.name}
        </h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">{strand.tagline}</p>
      </header>

      <div className="grid gap-14 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-12">
          <section aria-labelledby="overview">
            <h2 id="overview" className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Overview
            </h2>
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">{strand.summary}</p>
          </section>

          <section aria-labelledby="learn">
            <h2 id="learn" className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              What you may learn
            </h2>
            <ul className="mt-4 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
              {strand.learn.map((l) =>
              <li key={l} className="bg-surface px-5 py-4 text-[15px] leading-relaxed text-ink">
                  {l}
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="suited" className="rounded-lg border border-line bg-surface p-7">
            <h2 id="suited" className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Who may enjoy this strand
            </h2>
            <ul className="mt-4 space-y-3">
              {strand.suitedFor.map((s) =>
              <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                  <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span>{s}</span>
                </li>
              )}
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-[13px] text-faint">
              These are common patterns, not requirements. Students who do not recognise themselves here still do
              well in this strand.
            </p>
          </section>

          <section aria-labelledby="pathways-preview">
            <h2 id="pathways-preview" className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
              Where it can lead
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="rounded-lg border border-line bg-surface p-6">
                <List title="Possible college fields" items={strand.collegeFields} />
              </div>
              <div className="rounded-lg border border-line bg-surface p-6">
                <List title="Possible career areas" items={strand.careerAreas} />
              </div>
            </div>
            <p className="mt-4 text-[13px] text-faint">
              These are possible directions, not guaranteed outcomes. Many students move between fields after Grade
              12.
            </p>
          </section>

          <section aria-labelledby="considerations" className="rounded-lg border border-warn/25 bg-warn-soft p-7">
            <h2 id="considerations" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">
              Things to consider
            </h2>
            <ul className="mt-3 space-y-2.5">
              {strand.considerations.map((c) =>
              <li key={c} className="flex gap-2.5 text-[15px] leading-relaxed text-ink">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                  <span>{c}</span>
                </li>
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-lg border border-line bg-surface p-6">
            <List title="Skills commonly used" items={strand.skills} marker />
          </div>

          <div className="rounded-lg border border-line bg-surface p-6">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">Related interests</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {strand.interests.map((i) =>
              <span key={i} className="rounded-full border border-line bg-canvas px-3 py-1.5 text-[13px] text-ink">
                  {i}
                </span>
              )}
            </div>
          </div>

          {strand.subTracks &&
          <div className="rounded-lg border border-line bg-surface p-6">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">Specialisations</h3>
              <ul className="mt-3 space-y-3">
                {strand.subTracks.map((t) =>
              <li key={t.name}>
                    <p className="text-[15px] font-medium text-ink">{t.name}</p>
                    <p className="text-[13px] text-muted">{t.note}</p>
                  </li>
              )}
              </ul>
            </div>
          }

          <Button to={pathwayHref} full size="lg">
            Explore related pathways
            <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          </Button>
        </aside>
      </div>
    </div>);

}