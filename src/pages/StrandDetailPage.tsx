import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { getStrand } from '../data/strands';
import { StrandDetailContent } from '../components/StrandDetailContent';
import { Button } from '../components/ui/Button';

export function StrandDetailPage() {
  const { slug = '' } = useParams();
  const strand = getStrand(slug);

  if (!strand) {
    return (
      <div className="mx-auto max-w-content px-6 py-28">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">Strand not found</h1>
        <p className="mt-3 text-[16px] text-muted">That strand page does not exist in this prototype.</p>
        <div className="mt-6">
          <Button to="/strands">Back to all strands</Button>
        </div>
      </div>);

  }

  return (
    <div className="mx-auto max-w-content px-6 py-12">
      <Link
        to="/strands"
        className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
        
        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        All strands
      </Link>
      <div className="mt-6">
        <StrandDetailContent strand={strand} pathwayHref={`/app/pathways?strand=${strand.slug}`} />
      </div>
    </div>);

}