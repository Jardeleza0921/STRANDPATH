import React, { useEffect, useState } from 'react';
import { AlertTriangleIcon, ArrowRightIcon, BookOpenIcon, FlaskConicalIcon, ShieldCheckIcon } from 'lucide-react';
import { PageHeader } from '../components/ui/Primitives';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { isStaticMode } from '../lib/mode';
import { QuestionnaireMeta } from '../types/api';

const SECTIONS = [
  { id: 'design', label: 'Questionnaire design' },
  { id: 'algorithm', label: 'Scoring & algorithm' },
  { id: 'recommendations', label: 'Recommendation methodology' },
  { id: 'software', label: 'Software validation' },
  { id: 'educational', label: 'Educational validation' },
  { id: 'examples', label: 'Worked examples' },
  { id: 'status', label: 'Validation status' }
];

const DIMENSION_COPY: Record<string, string> = {
  scientific: 'Interest in investigation, evidence, living systems and the physical world.',
  analysis: 'Comfort with reasoning through unfamiliar problems and structuring information.',
  numerical: 'Confidence with numbers, measurement, patterns and quantitative evidence.',
  technical: 'Interest in building, troubleshooting and understanding digital or mechanical systems.',
  creative: 'Preference for making, designing, performing and imagining alternatives.',
  communication: 'Interest in language, writing, speaking and explaining ideas to different audiences.',
  social: 'Motivation to understand people, support communities and work with groups.',
  business: 'Interest in organising work, enterprise, logistics and practical decision-making.',
  practical: 'Preference for hands-on, applied work with tangible materials and tools.',
  persistence: 'Self-direction, follow-through and willingness to keep improving.'
};

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[12px] text-ink">{children}</code>;
}

function Block({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-md border border-line bg-panel p-4 font-mono text-[12px] leading-relaxed text-panel-ink">
      <code>{children}</code>
    </pre>
  );
}

export function Methodology() {
  const [meta, setMeta] = useState<QuestionnaireMeta | null>(null);

  useEffect(() => {
    api.get<QuestionnaireMeta>('/questionnaire/active').then(setMeta).catch(() => undefined);
  }, []);

  const dimensionCounts = new Map<string, number>();
  for (const question of meta?.questions ?? []) {
    for (const option of question.options) {
      for (const key of Object.keys(option.scores)) {
        dimensionCounts.set(key, (dimensionCounts.get(key) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        eyebrow="Documentation"
        title="Assessment Methodology & System Validation"
        description="How STRANDPATH turns answers into guidance, what the software verifies, and what has not yet been validated. Written for students, advisers and capstone reviewers."
        actions={
          <Button to={meta ? '/login' : '/register'} variant="secondary" size="sm">
            Try the assessment
            <ArrowRightIcon className="h-4 w-4" aria-hidden />
          </Button>
        }
      />

      <div className="mt-6 rounded-lg border border-warn/30 bg-warn-soft px-5 py-4 text-[13px] leading-relaxed text-warn">
        <p className="flex items-start gap-2 font-semibold">
          <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          An honest boundary: software validation is complete; educational validation is not.
        </p>
        <p className="mt-1.5">
          The questionnaire is a reviewed technical draft. It has not been pilot-tested, reliability-tested or
          endorsed by an expert panel, so STRANDPATH describes results as structured guidance — never a diagnosis, a
          probability of success, or a limit on what a student may study.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">On this page</p>
          <nav aria-label="Methodology sections" className="mt-2 space-y-0.5">
            {SECTIONS.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded px-2 py-1.5 text-[12.5px] text-muted transition-colors hover:bg-brand-soft hover:text-brand-dark"
              >
                {section.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 rounded-md border border-line bg-surface2/40 p-3 text-[11.5px] leading-relaxed text-muted">
            <p className="font-semibold text-ink">Live configuration</p>
            <p className="mt-1">Questionnaire version: {meta?.version ?? 'loading…'}</p>
            <p>Algorithm version: {meta?.algorithmVersion ?? 'strandpath-fit-1.0.0'}</p>
            <p>Items: {meta?.questions.length ?? '—'}</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <section id="design" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-[24px] font-bold text-ink">
              <BookOpenIcon className="h-5 w-5 text-brand" aria-hidden /> A. Questionnaire design
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">
              STRANDPATH measures how a student's interests, self-reported strengths and working preferences relate to
              the seven Senior High School strands. It is a guidance instrument for reflection and conversation, not an
              entrance examination. The active questionnaire has{' '}
              <strong className="text-ink">{meta?.questions.length ?? 20} items</strong> across{' '}
              <strong className="text-ink">{meta?.sections.length ?? 6} sections</strong>: interests, strengths, work
              style, talents, preferences and readiness.
            </p>

            <div className="mt-4 overflow-hidden rounded-lg border border-line">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface2/60 text-[11px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-3 py-2.5 font-medium">Dimension</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">What it reflects</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Options scored</th>
                  </tr>
                </thead>
                <tbody>
                  {(meta?.categories ?? []).map((category) => (
                    <tr key={category.key} className="border-b border-line/70 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-ink">{category.label}</td>
                      <td className="px-3 py-2.5 text-muted">
                        {DIMENSION_COPY[category.key] ?? category.description}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-muted">{dimensionCounts.get(category.key) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mt-5 text-[15px] font-semibold text-ink">Question formats and response coding</h3>
            <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-muted">
              <li>
                <strong className="text-ink">Single choice</strong> — one option; each option contributes 0–3 points to
                one or more dimensions.
              </li>
              <li>
                <strong className="text-ink">Limited multi-select</strong> — a fixed maximum number of choices; the
                declared maximum is enforced by both the browser and the server.
              </li>
              <li>
                <strong className="text-ink">Five-point scale</strong> — agreement/comfort statements coded 0–3 across
                the dimension the item targets.
              </li>
              <li>
                Each item carries a weight. All weights are currently <Code>1.0</Code> because there is no pilot
                evidence that would justify unequal weights. Weights can only change through a new questionnaire
                version.
              </li>
            </ul>

            <h3 className="mt-5 text-[15px] font-semibold text-ink">Versioning</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
              Active questionnaire versions are immutable through the application. Editing requires cloning a version
              into a draft, then activating it. Every assessment permanently stores the questionnaire version and
              algorithm version used, alongside a denormalised copy of its scores and explanations. Older results stay
              explainable after the instrument changes.
            </p>
          </section>

          <section id="algorithm" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-[24px] font-bold text-ink">
              <FlaskConicalIcon className="h-5 w-5 text-brand" aria-hidden /> B. Scoring and algorithm
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Algorithm <Code>strandpath-fit-1.0.0</Code> is a deterministic weighted-alignment model. It uses no random
              numbers, no model-generated scoring, and no hidden modifiers. Identical valid answers under the same
              version always produce identical scores and rankings.
            </p>

            <h3 className="mt-4 text-[15px] font-semibold text-ink">1. Raw dimension score</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              For dimension <em>d</em>, sum the points contributed by every selected option, multiplied by that item's
              weight:
            </p>
            <Block>{`raw(d) = Σ over answered items i  ( optionPoints(i, d) × weight(i) )`}</Block>

            <h3 className="mt-4 text-[15px] font-semibold text-ink">2. Attainable maximum and normalisation</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              The maximum uses the best attainable contribution per item. For a multi-select limited to <em>k</em>{' '}
              choices, it sums the <em>k</em> highest option values for that dimension — an upper bound, so scaled
              scores stay conservative:
            </p>
            <Block>{`max(d) = Σ over items  ( weight(i) × bestAttainable(i, d) )

scaled(d) = clamp( raw(d) / max(d), 0, 1 )`}</Block>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              The percentage a student sees is <Code>scaled × 100</Code>: the share of the attainable range for that
              dimension, not a percentage of questions answered correctly.
            </p>

            <h3 className="mt-4 text-[15px] font-semibold text-ink">3. Strand alignment</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-muted">
              Each strand stores a weight vector over the ten dimensions. Weights are non-negative and must sum to 1.0;
              the admin API rejects a vector that does not.
            </p>
            <Block>{`alignment(strand) = 100 × Σ over dimensions  ( scaled(d) × strandWeight(strand, d) )

where Σ strandWeight(strand, ·) = 1.0`}</Block>

            <h3 className="mt-4 text-[15px] font-semibold text-ink">4. Match bands and ranking</h3>
            <div className="mt-2 overflow-hidden rounded-lg border border-line">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface2/60 text-[11px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-3 py-2.5 font-medium">Alignment</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Label shown</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Meaning</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 tabular-nums text-ink">≥ 60</td><td className="px-3 py-2.5">Strong connection</td><td className="px-3 py-2.5">Many answers point toward this strand</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 tabular-nums text-ink">48–59.9</td><td className="px-3 py-2.5">Good connection</td><td className="px-3 py-2.5">Substantial overlap with your answers</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 tabular-nums text-ink">38–47.9</td><td className="px-3 py-2.5">Some connection</td><td className="px-3 py-2.5">Worth exploring, with other evidence</td></tr>
                  <tr><td className="px-3 py-2.5 tabular-nums text-ink">&lt; 38</td><td className="px-3 py-2.5">Worth exploring</td><td className="px-3 py-2.5">Less overlap today; interest can still grow</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              All seven active strands are ranked exactly once, descending by alignment, with the strand code as a
              stable tie-break. When the top two are within a close margin — or several are tied — the result includes
              an explicit warning that the ordering should not be over-interpreted.
            </p>

            <h3 className="mt-4 text-[15px] font-semibold text-ink">5. Pseudocode</h3>
            <Block>{`function scoreAssessment(questionnaire, answers):
  answers = validate(questionnaire, answers)        # reject missing/unknown
  raw[d] = 0; max[d] = 0
  for item in questionnaire.items:
      selected = answers[item.code]
      for d in dimensions:
          raw[d] += item.weight * optionPoints(item, selected, d)
          max[d] += item.weight * bestAttainable(item, d)
  scaled[d] = clamp(raw[d] / max[d], 0, 1)
  for strand in activeStrands:
      alignment[strand] = 100 * Σ(scaled[d] * strand.weights[d])
  ranked = sort(alignment, descending, tiebreak=strand.code)
  strengths = top 3 scaled dimensions
  development = lowest 2 scaled dimensions
  return { scaled, ranked, strengths, development, warnings }`}</Block>

            <h3 className="mt-4 text-[15px] font-semibold text-ink">6. Worked illustration</h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              Illustrative numbers only: suppose the technology dimension has raw 4.8 out of an attainable 6.0, giving{' '}
              <Code>scaled = 0.80</Code>; communication has <Code>0.40</Code>; analysis <Code>0.70</Code>. With
              simplified weights (technology 0.30, analysis 0.20, communication 0.10, remaining dimensions contributing
              0.15 in total):
            </p>
            <Block>{`alignment = 100 × (0.80×0.30 + 0.70×0.20 + 0.40×0.10 + 0.15)
          = 100 × (0.24 + 0.14 + 0.04 + 0.15)
          = 57.0   → “Good connection”`}</Block>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              The real strand vectors are stored in the database and visible in the administrator area; the complete
              set is exercised by automated tests.
            </p>
          </section>

          <section id="recommendations" className="scroll-mt-24">
            <h2 className="font-display text-[24px] font-bold text-ink">C. Recommendation methodology</h2>
            <ul className="mt-2 space-y-2 text-[13.5px] leading-relaxed text-muted">
              <li>
                <strong className="text-ink">From answers to suggestions.</strong> Alignment scores are computed for
                every active strand, so students always see all seven options — not only a single "winner".
              </li>
              <li>
                <strong className="text-ink">Explanations.</strong> For each strand, the engine reports the
                highest-weighted dimensions, the actual option labels the student chose as evidence, and the
                dimensions that are least developed relative to that strand's emphasis.
              </li>
              <li>
                <strong className="text-ink">Strengths and development areas.</strong> Strengths are the three highest
                scaled dimensions. Development areas are the two lowest, framed as skills that can be practised, never
                as deficits or labels.
              </li>
              <li>
                <strong className="text-ink">Student choice.</strong> No recommendation is binding. The student selects
                a strand after reviewing results and may change it after any assessment. The improvement programme is
                built from the student's chosen strand, not automatically from the top recommendation.
              </li>
              <li>
                <strong className="text-ink">No AI model is in the scoring path.</strong> Strand Assistance explains a
                stored result with a local, rule-based guidance engine, but it never computes, edits or overrides a
                score.
              </li>
            </ul>
          </section>

          <section id="software" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-display text-[24px] font-bold text-ink">
              <ShieldCheckIcon className="h-5 w-5 text-brand" aria-hidden /> D. Software validation (implemented)
            </h2>
            {isStaticMode() && (
              <p className="mt-3 rounded-md border border-line bg-surface2/50 p-3 text-[12.5px] leading-relaxed text-muted">
                This table describes the optional server deployment. The GitHub Pages build has no server: scoring and
                records stay in your browser, and the server-side controls below do not apply to it.
              </p>
            )}
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface2/60 text-[11px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-3 py-2.5 font-medium">Area</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">What is enforced</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Required fields</td><td className="px-3 py-2.5">Name, valid email, password rules, privacy consent, and profile limits validated on the server and mirrored in forms.</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Answer validity</td><td className="px-3 py-2.5">Every answer must reference a known question and option from the active version; single/multi cardinality is checked; unknown or disabled items are rejected.</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Completeness</td><td className="px-3 py-2.5">Submission is blocked while any item is unanswered; the response names the missing question codes.</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Duplicate submissions</td><td className="px-3 py-2.5">A submitted attempt cannot be submitted again; edits after submission are refused. Drafts save idempotently.</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Scoring integrity</td><td className="px-3 py-2.5">Pure functions with bounded output; database snapshots of scores, recommendations and versions; no client-supplied score is ever accepted.</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Authentication</td><td className="px-3 py-2.5">scrypt hashing, HTTP-only session cookies, remember-me expiry, forced first-password change, hashed single-use OTPs with attempt limits.</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Authorization</td><td className="px-3 py-2.5">Server-side role checks; students receive 404 for another student's records; staff access is audit-logged; suspended accounts lose sessions.</td></tr>
                  <tr><td className="px-3 py-2.5 text-ink">Database</td><td className="px-3 py-2.5">Foreign keys and cascades, unique email constraint, primary keys on score rows, WAL journal, additive migrations.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="educational" className="scroll-mt-24">
            <h2 className="font-display text-[24px] font-bold text-ink">E. Educational questionnaire validation (not complete)</h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Technical correctness does not make an instrument educationally valid. The following steps are
              <strong className="text-ink"> still required</strong> before results could be described as validated:
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-muted">
              <li>Expert review by guidance counsellors and subject specialists for content relevance and coverage.</li>
              <li>Readability and clarity testing with Grade 10–12 students, including multilingual consideration.</li>
              <li>A pilot administration with a defined sample, followed by item analysis and refinement.</li>
              <li>Reliability analysis (for example internal consistency) and, where defensible, construct evidence.</li>
              <li>Documented revision, re-validation, and version notes before replacing the active questionnaire.</li>
            </ol>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
              Until then, the application labels the instrument <Code>technical-draft</Code> and tells students that
              results are structured guidance to discuss with a person, not a measurement of their worth or potential.
            </p>
          </section>

          <section id="examples" className="scroll-mt-24">
            <h2 className="font-display text-[24px] font-bold text-ink">F. Testing examples</h2>
            <div className="mt-3 overflow-hidden rounded-lg border border-line">
              <table className="w-full border-collapse text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface2/60 text-[11px] uppercase tracking-[0.05em] text-faint">
                    <th scope="col" className="px-3 py-2.5 font-medium">Case</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Input</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Expected outcome</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Determinism</td><td className="px-3 py-2.5">Same complete answer set scored twice</td><td className="px-3 py-2.5">Byte-identical ranking and dimension scores</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Technology-heavy profile</td><td className="px-3 py-2.5">Consistent choice of technical/building/analysis options</td><td className="px-3 py-2.5">ICT ranks first in the automated fixture</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">People-heavy profile</td><td className="px-3 py-2.5">Consistent choice of communication/community options</td><td className="px-3 py-2.5">HUMSS ranks first in the automated fixture</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Missing answer</td><td className="px-3 py-2.5">19 of 20 items answered</td><td className="px-3 py-2.5">400 response naming the missing item; nothing is stored as submitted</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Unknown option</td><td className="px-3 py-2.5">Option code not in the active version</td><td className="px-3 py-2.5">Validation error; attempt remains a draft</td></tr>
                  <tr className="border-b border-line/70"><td className="px-3 py-2.5 text-ink">Isolation</td><td className="px-3 py-2.5">Student B requests Student A's assessment id</td><td className="px-3 py-2.5">404; no data or existence leak</td></tr>
                  <tr><td className="px-3 py-2.5 text-ink">Expired OTP</td><td className="px-3 py-2.5">Reset code used after expiry</td><td className="px-3 py-2.5">400; password unchanged; a fresh code is required</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[12.5px] leading-relaxed text-faint">
              These cases are part of the automated suite (engine, API, authentication), not hypothetical examples.
            </p>
          </section>

          <section id="status" className="scroll-mt-24">
            <h2 className="font-display text-[24px] font-bold text-ink">G. Validation status</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-success/25 bg-success-soft p-4 text-[12.5px] leading-relaxed text-success">
                <p className="font-semibold">Implemented and tested</p>
                <p className="mt-1">Deterministic scoring, response validation, versioning, access control, data isolation, OTP security, account provisioning checks, production build.</p>
              </div>
              <div className="rounded-md border border-warn/30 bg-warn-soft p-4 text-[12.5px] leading-relaxed text-warn">
                <p className="font-semibold">Pending external work</p>
                <p className="mt-1">Pilot study, reliability analysis, expert sign-off, real SMTP delivery test with the school's provider, Google OAuth client registration, and AI provider review.</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">
              Questions about the instrument, consent or retention should go to the school guidance office. The
              engineering documentation, schema and deployment notes are in the project README.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button to="/strands" variant="secondary" size="sm">Explore the strands</Button>
              <Button to="/register" size="sm">Create a student account</Button>
            </div>
          </section>
        </div>
      </div>

      <p className="mt-10 border-t border-line pt-5 text-[11.5px] leading-relaxed text-faint">
        STRANDPATH · Algorithm strandpath-fit-1.0.0 · Questionnaire {meta?.version ?? '1.0'} · Technical draft, not a
        validated psychometric instrument. Last reviewed for this build.
      </p>
    </div>
  );
}
