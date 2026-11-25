import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, errorMessage } from '../../lib/api';
import { Comparison } from '../../types/api';
import { Button } from '../../components/ui/Button';
import { ComparisonBlock } from '../../components/app/Comparison';
import { ErrorState, LoadingBlock, PageHeader } from '../../components/ui/Primitives';

export function Compare() {
  const [params] = useSearchParams();
  const from = params.get('from');
  const to = params.get('to');
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) {
      setError('Choose two assessments to compare.');
      return;
    }
    api
      .get<{ comparison: Comparison }>(`/progress/compare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((data) => setComparison(data.comparison))
      .catch((err) => setError(errorMessage(err)));
  }, [from, to]);

  if (error) {
    return (
      <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-8">
        <ErrorState message={error} />
        <div className="mt-4">
          <Button to="/app/history" variant="secondary">Back to history</Button>
        </div>
      </div>
    );
  }
  if (!comparison) return <LoadingBlock label="Comparing your assessments…" />;

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Comparison"
        title="Your two assessments, side by side"
        description="Category scores are percentages of the attainable range for each dimension. A change in answers can reflect new experience, a different reading of the question, or both."
      />
      <ComparisonBlock comparison={comparison} />
      <div className="mt-6 flex flex-wrap gap-2">
        <Button to="/app/history" variant="secondary" size="sm">Back to history</Button>
        <Button to="/app/progress" size="sm">Progress overview</Button>
      </div>
    </div>
  );
}
