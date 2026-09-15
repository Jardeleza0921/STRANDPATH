import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { getStrand } from '../../data/strands';
import { StrandDetailContent } from '../../components/StrandDetailContent';
import { Button } from '../../components/ui/Button';

export function AppStrandDetail() {
  const { slug = 'ict' } = useParams();
  const strand = getStrand(slug);

  if (!strand) {
    return (
      <div className="mx-auto max-w-[1000px] px-8 py-16">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-ink">Strand not found</h1>
        <div className="mt-5">
          <Button to="/app">Back to dashboard</Button>
        </div>
      </div>);

  }

  return (
    <div className="mx-auto max-w-[1000px] px-8 py-10">
      <Link
        to="/app/results"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
        
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        Back to results
      </Link>
      <div className="mt-5">
        <StrandDetailContent strand={strand} pathwayHref={`/app/pathways?strand=${strand.slug}`} />
      </div>
    </div>);

}