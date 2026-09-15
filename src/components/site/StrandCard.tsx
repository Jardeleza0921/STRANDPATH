import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { Strand } from '../../types';

export function StrandCard({ strand, base = '/strands' }: {strand: Strand;base?: string;}) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold uppercase tracking-wide text-brand">{strand.code}</span>
        <span className="text-[12px] text-faint">{strand.track}</span>
      </div>

      <h3 className="mt-3 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">{strand.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{strand.tagline}</p>

      <dl className="mt-5 space-y-3 border-t border-line pt-5 text-[13px]">
        <div>
          <dt className="text-faint">Areas of interest</dt>
          <dd className="mt-1 text-ink">{strand.interests.slice(0, 3).join(' · ')}</dd>
        </div>
        <div>
          <dt className="text-faint">Example skills</dt>
          <dd className="mt-1 text-ink">{strand.skills.slice(0, 3).join(' · ')}</dd>
        </div>
        <div>
          <dt className="text-faint">Possible pathways</dt>
          <dd className="mt-1 text-ink">{strand.collegeFields.slice(0, 3).join(' · ')}</dd>
        </div>
      </dl>

      <Link
        to={`${base}/${strand.slug}`}
        className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-medium text-brand transition-colors duration-150 ease-out hover:text-brand-dark">
        
        View strand details
        <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>);

}