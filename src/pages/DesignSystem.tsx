import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangleIcon, CheckCircle2Icon, ChevronLeftIcon, InfoIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge, MatchBadge, MatchBar } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Choice, ScaleChoice } from '../components/ui/Choice';
import { StrandCard } from '../components/site/StrandCard';
import { Logo } from '../components/ui/Logo';
import { getStrand } from '../data/strands';

const colors = [
{ name: 'Canvas', value: '#FAF9F6', token: 'canvas', text: 'text-ink' },
{ name: 'Surface', value: '#FFFFFF', token: 'surface', text: 'text-ink' },
{ name: 'Ink', value: '#15181E', token: 'ink', text: 'text-white' },
{ name: 'Muted', value: '#5B6373', token: 'muted', text: 'text-white' },
{ name: 'Faint', value: '#8A91A0', token: 'faint', text: 'text-white' },
{ name: 'Line', value: '#E5E3DD', token: 'line', text: 'text-ink' },
{ name: 'Brand', value: '#2549C7', token: 'brand', text: 'text-white' },
{ name: 'Brand dark', value: '#1B379B', token: 'brand-dark', text: 'text-white' },
{ name: 'Brand soft', value: '#ECEFFC', token: 'brand-soft', text: 'text-ink' },
{ name: 'Accent', value: '#C4661C', token: 'accent', text: 'text-white' },
{ name: 'Success', value: '#1F7A54', token: 'success', text: 'text-white' },
{ name: 'Warning', value: '#9A6B0C', token: 'warn', text: 'text-white' }];


const type = [
{ name: 'Display', spec: '56 / 60 · Semibold · -3.5%', cls: 'text-[56px] leading-[1.05] font-semibold tracking-[-0.035em]' },
{ name: 'H1', spec: '40 / 44 · Semibold · -3%', cls: 'text-[40px] leading-[1.1] font-semibold tracking-[-0.03em]' },
{ name: 'H2', spec: '30 / 36 · Semibold · -2.5%', cls: 'text-[30px] leading-[1.2] font-semibold tracking-[-0.025em]' },
{ name: 'H3', spec: '19 / 26 · Semibold · -1.5%', cls: 'text-[19px] leading-[1.35] font-semibold tracking-[-0.015em]' },
{ name: 'Body', spec: '16 / 26 · Regular', cls: 'text-[16px] leading-relaxed' },
{ name: 'Small', spec: '13 / 20 · Regular', cls: 'text-[13px] leading-5' },
{ name: 'Button', spec: '15 / 20 · Medium', cls: 'text-[15px] font-medium' },
{ name: 'Label', spec: '12 / 16 · Semibold · uppercase', cls: 'text-[12px] font-semibold uppercase tracking-[0.06em]' }];


const spacing = [4, 8, 12, 16, 24, 32, 48, 64, 80];

function Section({ title, description, children }: {title: string;description?: string;children: React.ReactNode;}) {
  return (
    <section className="border-t border-line py-14">
      <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
      {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>}
      <div className="mt-8">{children}</div>
    </section>);

}

export function DesignSystem() {
  const ict = getStrand('ict')!;

  return (
    <div className="min-h-full w-full bg-canvas">
      <div className="mx-auto max-w-content px-6 py-12">
        <Link
          to="/cover"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
          
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Prototype map
        </Link>

        <header className="mt-8 pb-10">
          <Logo size={30} />
          <h1 className="mt-6 text-[40px] font-semibold tracking-[-0.03em] text-ink">Design system</h1>
          <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-muted">
            One flat, minimalist system shared by the public website, the web application, and the mobile app. Light
            surfaces, dark text, a single brand colour, restrained radii, and no decorative effects.
          </p>
        </header>

        <Section title="Colour" description="A restrained educational palette: one brand colour, one accent, neutrals, and two semantic states.">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {colors.map((c) =>
            <div key={c.name} className="overflow-hidden rounded-md border border-line">
                <div className={`flex h-20 items-end p-3 ${c.text}`} style={{ backgroundColor: c.value }}>
                  <span className="text-[12px] font-medium">{c.name}</span>
                </div>
                <div className="bg-surface px-3 py-2.5">
                  <p className="text-[12px] tabular-nums text-ink">{c.value}</p>
                  <p className="text-[11px] text-faint">{c.token}</p>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="Typography" description="Inter across all three products. Tight tracking on headings, generous line height on body copy.">
          <div className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
            {type.map((t) =>
            <div key={t.name} className="grid gap-4 px-6 py-6 md:grid-cols-[160px_1fr] md:items-baseline">
                <div>
                  <p className="text-[14px] font-medium text-ink">{t.name}</p>
                  <p className="text-[12px] text-faint">{t.spec}</p>
                </div>
                <p className={`truncate text-ink ${t.cls}`}>Find a direction that fits you.</p>
              </div>
            )}
          </div>
        </Section>

        <Section title="Spacing & radius" description="A 4px base scale. Corners stay restrained: 6px on controls, 10–12px on cards, 16–20px on containers.">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Spacing scale</p>
              <ul className="mt-5 space-y-3">
                {spacing.map((s) =>
                <li key={s} className="flex items-center gap-4">
                    <span className="w-10 text-[13px] tabular-nums text-muted">{s}</span>
                    <span className="h-3 rounded-sm bg-brand-soft" style={{ width: s * 2 }} />
                  </li>
                )}
              </ul>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Radius</p>
              <div className="mt-5 flex flex-wrap gap-4">
                {[
                { l: '6', c: 'rounded-sm' },
                { l: '10', c: 'rounded' },
                { l: '12', c: 'rounded-md' },
                { l: '16', c: 'rounded-lg' },
                { l: '20', c: 'rounded-xl' }].
                map((r) =>
                <div key={r.l} className="text-center">
                    <div className={`h-20 w-20 border border-line bg-canvas ${r.c}`} />
                    <p className="mt-2 text-[12px] text-muted">{r.l}px</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="space-y-6 rounded-lg border border-line bg-surface p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg">Primary large</Button>
              <Button>Primary</Button>
              <Button size="sm">Primary small</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" size="lg">
                Secondary large
              </Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="quiet">Quiet</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </div>
        </Section>

        <Section title="Badges, match indicators & progress">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-6 rounded-lg border border-line bg-surface p-8">
              <div className="flex flex-wrap gap-2">
                <Badge>Neutral</Badge>
                <Badge tone="brand">Brand</Badge>
                <Badge tone="success">Success</Badge>
                <Badge tone="warn">Warning</Badge>
                <Badge tone="accent">Accent</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <MatchBadge level="strong" />
                <MatchBadge level="good" />
                <MatchBadge level="possible" />
              </div>
              <div className="space-y-4">
                <MatchBar level="strong" percent={86} />
                <MatchBar level="good" percent={71} />
                <MatchBar level="possible" percent={48} />
              </div>
            </div>

            <div className="space-y-8 rounded-lg border border-line bg-surface p-8">
              <Progress value={6} total={15} />
              <Progress value={15} total={15} label="15 of 15 answered" />
              <div>
                <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Input field</p>
                <label className="block">
                  <span className="text-[13px] font-medium text-ink">School email</span>
                  <input
                    type="email"
                    placeholder="you@school.edu.ph"
                    className="mt-2 w-full rounded-md border border-line bg-surface px-4 py-3 text-[15px] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" />
                  
                </label>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Assessment choices" description="Multi-select, single-select, and agreement scale. Selected states use the brand colour with a filled indicator.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-line bg-surface p-8">
              <Choice label="Building or fixing something with a computer" hint="Apps, websites, hardware" multi selected onSelect={() => undefined} />
              <Choice label="Running experiments or solving puzzles" multi selected={false} onSelect={() => undefined} />
              <Choice label="Organising an event or a small business" multi selected={false} disabled onSelect={() => undefined} />
            </div>
            <div className="space-y-3 rounded-lg border border-line bg-surface p-8">
              <Choice label="Mathematics" selected onSelect={() => undefined} />
              <Choice label="Computer / TLE" selected={false} onSelect={() => undefined} />
              <ScaleChoice
                options={[
                { id: '1', label: 'Not like me' },
                { id: '2', label: 'A little' },
                { id: '3', label: 'Somewhat' },
                { id: '4', label: 'Mostly' },
                { id: '5', label: 'Very like me' }]
                }
                value="4"
                onSelect={() => undefined} />
              
            </div>
          </div>
        </Section>

        <Section title="Alerts">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="flex gap-3 rounded-md border border-brand-edge bg-brand-soft p-5">
              <InfoIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand" aria-hidden="true" />
              <p className="text-[14px] leading-relaxed text-brand-dark">
                Results are guidance to help you explore your options.
              </p>
            </div>
            <div className="flex gap-3 rounded-md border border-success/25 bg-success-soft p-5">
              <CheckCircle2Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-success" aria-hidden="true" />
              <p className="text-[14px] leading-relaxed text-ink">Your assessment has been saved.</p>
            </div>
            <div className="flex gap-3 rounded-md border border-warn/25 bg-warn-soft p-5">
              <AlertTriangleIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-warn" aria-hidden="true" />
              <p className="text-[14px] leading-relaxed text-ink">
                Strand availability differs between schools — confirm before planning.
              </p>
            </div>
          </div>
        </Section>

        <Section title="Cards" description="Strand card, pathway card, and result card share one structure: label, title, supporting detail, and a single action.">
          <div className="grid gap-5 lg:grid-cols-3">
            <StrandCard strand={ict} />

            <article className="flex h-full flex-col rounded-lg border border-line bg-surface p-6">
              <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">Information Technology</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                Applying technology to real organisational needs
              </p>
              <div className="my-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-line" />
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Career areas</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <ul className="mt-auto space-y-2">
                {['Software developer', 'Web developer', 'QA analyst'].map((c) =>
                <li key={c} className="rounded-md bg-canvas px-3 py-2 text-[13px] text-ink">
                    {c}
                  </li>
                )}
              </ul>
            </article>

            <article className="flex h-full flex-col rounded-lg border border-brand bg-surface p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[19px] font-semibold tracking-[-0.015em] text-ink">ICT</h3>
                <MatchBadge level="strong" />
              </div>
              <div className="mt-4">
                <MatchBar level="strong" percent={86} />
              </div>
              <p className="mt-4 text-[14px] leading-relaxed text-muted">
                Your selected interests and strengths show a strong connection with areas commonly associated with
                ICT.
              </p>
              <div className="mt-auto pt-5">
                <Button size="sm" variant="secondary">
                  View strand details
                </Button>
              </div>
            </article>
          </div>
        </Section>

        <Section title="Navigation" description="Website header links, app sidebar items, tabs, and the mobile bottom bar all use the same 13–15px medium type and brand-soft active state.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-line bg-surface p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Tabs</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['All strands', 'Academic', 'TVL', 'Arts & Design'].map((t, i) =>
                <span
                  key={t}
                  className={`rounded-full border px-4 py-2 text-[13px] font-medium ${
                  i === 0 ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-muted'}`
                  }>
                  
                    {t}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-surface p-6">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-faint">Sidebar item states</p>
              <div className="mt-4 space-y-1">
                <span className="flex items-center gap-3 rounded-md bg-brand-soft px-3 py-2.5 text-sm font-medium text-brand-dark">
                  Dashboard · active
                </span>
                <span className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted">
                  Assessment · default
                </span>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>);

}