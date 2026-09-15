import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, CompassIcon, LayersIcon, RouteIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PathPreview } from '../components/site/PathPreview';
import { StrandCard } from '../components/site/StrandCard';
import { gridStrands } from '../data/strands';
import { steps } from '../data/steps';

const pillars = [
{
  icon: CompassIcon,
  title: 'It starts with you',
  body: 'The questions are about your interests, strengths, and how you like to work — not about test scores or grades.'
},
{
  icon: LayersIcon,
  title: 'Every strand explained plainly',
  body: 'What you would study, the skills involved, who tends to enjoy it, and what to consider before choosing.'
},
{
  icon: RouteIcon,
  title: 'Pathways, not promises',
  body: 'See how a strand connects to college fields and career areas, described as possibilities you can explore.'
}];


export function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-content items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          <div>
            <h1 className="text-[52px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink lg:text-[64px]">
              Find a direction
              <br />
              that fits you.
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-muted">
              Explore your strengths, interests, and possible pathways before choosing your next step. StrandPath
              helps Senior High School students understand which strands may suit them — and where those strands can
              lead.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button to="/app" size="lg">
                Start exploring
                <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              </Button>
              <Button to="/how-it-works" variant="secondary" size="lg">
                Learn more
              </Button>
            </div>

            <p className="mt-6 text-[13px] text-faint">
              Free for students · No score, no ranking · Takes about 10 minutes
            </p>
          </div>

          <PathPreview />
        </div>
      </section>

      {/* What is StrandPath */}
      <section className="border-b border-line bg-surface" aria-labelledby="what-is">
        <div className="mx-auto max-w-content px-6 py-20">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-[13px] font-medium text-brand">What is StrandPath?</p>
              <h2
                id="what-is"
                className="mt-3 max-w-md text-[34px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink">
                
                A guided way to think through the strand decision.
              </h2>
            </div>
            <div>
              <p className="max-w-2xl text-[17px] leading-relaxed text-ink">
                Choosing a Senior High School strand is one of the first big decisions a student makes about their
                future, and it is often made quickly, with limited information. StrandPath slows that moment down.
              </p>
              <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">
                Students answer a short set of questions about what they enjoy, what they are good at, and how they
                prefer to work. StrandPath then shows which strands connect to those answers, explains why, and opens
                up the college fields and career areas each one can lead toward.
              </p>

              <dl className="mt-10 grid gap-8 sm:grid-cols-3">
                {pillars.map(({ icon: Icon, title, body }) =>
                <div key={title}>
                    <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
                    <dt className="mt-3 text-[15px] font-semibold text-ink">{title}</dt>
                    <dd className="mt-1.5 text-[14px] leading-relaxed text-muted">{body}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-line" aria-labelledby="how">
        <div className="mx-auto max-w-content px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[13px] font-medium text-brand">How StrandPath works</p>
              <h2 id="how" className="mt-3 text-[34px] font-semibold tracking-[-0.025em] text-ink">
                Five steps, in order.
              </h2>
            </div>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark">
              
              See the full process
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-5">
            {steps.map((s) =>
            <li key={s.number} className="flex flex-col bg-canvas p-6">
                <span className="text-[13px] font-semibold tabular-nums text-brand">{s.number}</span>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">{s.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{s.description}</p>
              </li>
            )}
          </ol>
        </div>
      </section>

      {/* Why self-understanding matters */}
      <section className="border-b border-line bg-surface" aria-labelledby="why">
        <div className="mx-auto grid max-w-content gap-14 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="text-[13px] font-medium text-brand">Why self-understanding matters</p>
            <h2 id="why" className="mt-3 text-[34px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink">
              Most students are asked to choose before they are asked to reflect.
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed text-muted">
              Strands are often picked based on what friends chose, what parents suggest, or what seems safest.
              Those inputs matter — but they work better once a student can describe what they enjoy and what they
              are good at in their own words.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-muted">
              StrandPath is built around that reflection. The result is not a verdict; it is vocabulary a student can
              bring into a conversation with a teacher, counsellor, or parent.
            </p>
          </div>

          <div className="grid gap-px self-start overflow-hidden rounded-lg border border-line bg-line">
            {[
            { q: 'Who am I?', a: 'How you learn, work, and handle difficulty.' },
            { q: 'What am I good at?', a: 'Skills you already use, in and out of class.' },
            { q: 'What interests me?', a: 'Subjects and activities you return to.' },
            { q: 'Which strands may fit me?', a: 'Matches, with the reasoning shown.' },
            { q: 'What pathways can I explore?', a: 'College fields and career areas to look into.' }].
            map((row) =>
            <div key={row.q} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 bg-surface px-6 py-5">
                <p className="w-56 text-[15px] font-semibold text-ink">{row.q}</p>
                <p className="flex-1 text-[14px] text-muted">{row.a}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explore strands */}
      <section className="border-b border-line" aria-labelledby="strands">
        <div className="mx-auto max-w-content px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[13px] font-medium text-brand">Explore SHS strands</p>
              <h2 id="strands" className="mt-3 text-[34px] font-semibold tracking-[-0.025em] text-ink">
                Seven strands, described plainly.
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-muted">
                Read what each strand involves before you take the assessment — or after, to compare it with your
                matches.
              </p>
            </div>
            <Button to="/strands" variant="secondary">
              View all strands
            </Button>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {gridStrands.slice(0, 3).map((s) =>
            <StrandCard key={s.slug} strand={s} />
            )}
          </div>
        </div>
      </section>

      {/* Guidance philosophy */}
      <section className="bg-ink" aria-labelledby="philosophy">
        <div className="mx-auto max-w-content px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="text-[13px] font-medium text-brand-edge">How guidance works here</p>
              <h2
                id="philosophy"
                className="mt-4 max-w-2xl text-[38px] font-semibold leading-[1.15] tracking-[-0.03em] text-white">
                
                StrandPath doesn’t choose a student’s future for them.
              </h2>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/70">
                It helps them understand their options and find a direction worth exploring. Results are always
                phrased as guidance, never as instruction.
              </p>
            </div>

            <div className="space-y-4 self-center">
              <div className="rounded-md border border-white/15 p-5">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/45">
                  What StrandPath never says
                </p>
                <p className="mt-2.5 text-[17px] text-white/50 line-through decoration-white/30">
                  You should choose ICT.
                </p>
              </div>
              <div className="rounded-md border border-brand bg-brand/20 p-5">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-brand-edge">
                  What StrandPath says instead
                </p>
                <p className="mt-2.5 text-[17px] leading-relaxed text-white">
                  ICT appears to be a strong match based on the interests and strengths you selected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-content flex-col items-start gap-8 px-6 py-20 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-[32px] font-semibold leading-tight tracking-[-0.025em] text-ink">
              Ready to see what may fit you?
            </h2>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">
              Around 10 minutes, 15 questions, and a set of matches you can talk through with someone you trust.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button to="/app" size="lg">
              Start exploring
              <ArrowRightIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            </Button>
            <Button to="/strands" variant="secondary" size="lg">
              Browse strands first
            </Button>
          </div>
        </div>
      </section>
    </>);

}