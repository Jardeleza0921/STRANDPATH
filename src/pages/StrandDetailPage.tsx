import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { Strand } from '../types/api';
import { StrandDetailContent } from '../components/StrandDetailContent';
import { Button } from '../components/ui/Button';
import { ErrorState, LoadingBlock } from '../components/ui/Primitives';

export function StrandDetailPage() {
  const { slug = '' } = useParams();
  const [strand, setStrand] = useState<Strand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setStrand(null);
    setMissing(false);
    api
      .get<{ strand: Strand }>(`/strands/${slug}`)
      .then((data) => setStrand(data.strand))
      .catch((err) => {
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 404) setMissing(true);
        else setError(errorMessage(err));
      });
  }, [slug]);

  if (error) return <div className="mx-auto max-w-content px-6 py-20"><ErrorState message={error} /></div>;
  if (missing) {
    return (
      <div className="mx-auto max-w-content px-6 py-28">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">Strand not found</h1>
        <p className="mt-3 text-[16px] text-muted">That strand is not currently offered or does not exist.</p>
        <div className="mt-6">
          <Button to="/strands">Back to all strands</Button>
        </div>
      </div>
    );
  }
  if (!strand) return <LoadingBlock label="Loading strand…" />;

  return (
    <div className="mx-auto max-w-content px-6 py-12">
      <Link to="/strands" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" aria-hidden />
        All strands
      </Link>
      <div className="mt-6">
        <StrandDetailContent strand={strand} pathwayHref={`/careers`} />
      </div>
    </div>
  );
}
