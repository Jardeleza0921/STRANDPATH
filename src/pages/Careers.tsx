import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Strand } from '../types/api';
import { Button } from '../components/ui/Button';
import { Alert, Card, ErrorState, LoadingBlock } from '../components/ui/Primitives';

interface CareerField {
  strandSlug: string;
  strandCode: string;
  field: string;
  careers: string[];
}

export function Careers() {
  const [strands, setStrands] = useState<Strand[] | null>(null);
  const [fields, setFields] = useState<CareerField[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<{ fields: CareerField[]; strands: Strand[] }>('/careers')
      .then((data) => {
        setFields(data.fields);
        setStrands(data.strands);
      })
      .catch(() => setError(true));
  }, []);

  return (
    <>
      <section className="border-b border-line">
        <div className="mx-auto max-w-content px-6 py-20">
          <p className="text-[13px] font-medium text-brand">Careers and college fields</p>
          <h1 className="mt-3 max-w-3xl text-[44px] font-semibold leading-[1.1] tracking-[-0.03em] text-ink">
            What each strand can connect to — described as possibilities.
          </h1>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">
            These college fields and career areas are commonly associated with each strand. They are starting points
            for exploration, not predictions. Programme requirements and costs vary by school.
          </p>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-content px-6 py-16">
          {error ? (
            <ErrorState message="Careers information could not be loaded. Please try again later." />
          ) : !strands ? (
            <LoadingBlock label="Loading career fields…" />
          ) : (
            <div className="space-y-10">
              {strands.map((strand) => {
                const strandFields = fields.filter((f) => f.strandSlug === strand.slug);
                return (
                  <div key={strand.slug}>
                    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                      <div>
                        <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-ink">
                          {strand.code} · {strand.name}
                        </h2>
                        <p className="mt-1 text-[13px] text-muted">{strand.tagline}</p>
                      </div>
                      <Link to={`/strands/${strand.slug}`} className="text-[13px] font-medium text-brand hover:text-brand-dark">
                        Strand details
                      </Link>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      {strandFields.map((field) => (
                        <Card key={`${strand.slug}-${field.field}`} className="p-5">
                          <h3 className="text-[14.5px] font-semibold text-ink">{field.field}</h3>
                          <p className="mt-2 text-[11.5px] uppercase tracking-[0.05em] text-faint">Possible roles</p>
                          <ul className="mt-1.5 space-y-1 text-[13px] text-muted">
                            {field.careers.map((career) => (
                              <li key={career}>{career}</li>
                            ))}
                          </ul>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
              <Alert tone="info" title="Verify before you plan">
                STRANDPATH does not maintain official admission requirements, curriculum guides or scholarship
                information. Confirm details with the specific school or college, or ask your guidance office.
              </Alert>
              <div className="flex flex-wrap gap-3">
                <Button to="/register">Start the assessment</Button>
                <Button to="/strands" variant="secondary">Explore strands</Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
