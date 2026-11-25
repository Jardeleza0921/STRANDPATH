import React from 'react';
import { Comparison } from '../../types/api';
import { Card, Chip } from '../ui/Primitives';
import { formatDate } from '../../lib/api';

export function ComparisonBlock({ comparison, compact = false }: { comparison: Comparison; compact?: boolean }) {
  return (
    <section id="comparison" className={compact ? '' : 'mt-8'}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">What changed</h2>
          <p className="mt-1 text-[13px] text-muted">
            {formatDate(comparison.previousDate)} → {formatDate(comparison.currentDate)}
          </p>
        </div>
        {comparison.previousAssessmentId && (
          <Chip>Baseline #{comparison.previousAssessmentId}</Chip>
        )}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-canvas text-[11px] uppercase tracking-[0.05em] text-faint">
                <th scope="col" className="px-4 py-3 font-medium">Dimension</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Earlier</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Now</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {comparison.categories.map((category) => (
                <tr key={category.key} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-2.5 text-ink">{category.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted">{category.before === null ? '—' : `${category.before}%`}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink">{category.after}%</td>
                  <td
                    className={[
                      'px-4 py-2.5 text-right font-medium tabular-nums',
                      category.delta === null ? 'text-faint' : category.delta > 0 ? 'text-success' : category.delta < 0 ? 'text-accent' : 'text-muted'
                    ].join(' ')}
                  >
                    {category.delta === null ? '—' : `${category.delta > 0 ? '+' : ''}${category.delta}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {(comparison.improved.length > 0 || comparison.declined.length > 0) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-success">Higher than before</p>
            <ul className="mt-2 space-y-1 text-[13px] text-ink">
              {comparison.improved.length ? (
                comparison.improved.map((c) => (
                  <li key={c.key}>
                    {c.label} <span className="tabular-nums text-success">+{c.delta}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted">No dimension increased by at least one point.</li>
              )}
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-accent">Lower than before</p>
            <ul className="mt-2 space-y-1 text-[13px] text-ink">
              {comparison.declined.length ? (
                comparison.declined.map((c) => (
                  <li key={c.key}>
                    {c.label} <span className="tabular-nums text-accent">{c.delta}</span>
                  </li>
                ))
              ) : (
                <li className="text-muted">No dimension decreased by at least one point.</li>
              )}
            </ul>
          </Card>
        </div>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-faint">{comparison.note}</p>
    </section>
  );
}
