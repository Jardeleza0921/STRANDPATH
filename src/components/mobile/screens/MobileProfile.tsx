import React from 'react';
import { BellIcon, ChevronRightIcon, FileTextIcon, HelpCircleIcon, LogOutIcon, ShieldIcon } from 'lucide-react';
import { MobileBottomNav } from '../MobileBottomNav';
import { ScreenProps } from '../nav';

const groups = [
{
  title: 'Assessment',
  items: [
  { icon: FileTextIcon, label: 'Saved results', note: '1 saved' },
  { icon: BellIcon, label: 'Reminders', note: 'Off' }]

},
{
  title: 'Account',
  items: [
  { icon: ShieldIcon, label: 'Privacy', note: '' },
  { icon: HelpCircleIcon, label: 'Help & guidance', note: '' }]

}];


export function MobileProfile({ go }: ScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6">
        <h1 className="text-[24px] font-semibold tracking-[-0.025em] text-ink">Profile</h1>

        <div className="mt-5 flex items-center gap-4 rounded-lg border border-line p-5">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-[17px] font-medium text-white"
            aria-hidden="true">
            
            MR
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold text-ink">Maria Reyes</p>
            <p className="truncate text-[13px] text-muted">Grade 10 · Section B</p>
            <p className="truncate text-[13px] text-faint">maria.reyes@school.edu.ph</p>
          </div>
        </div>

        {groups.map((g) =>
        <section key={g.title} className="mt-7" aria-labelledby={`group-${g.title}`}>
            <h2 id={`group-${g.title}`} className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">
              {g.title}
            </h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line">
              {g.items.map(({ icon: Icon, label, note }) =>
            <li key={label}>
                  <button
                type="button"
                className="flex w-full items-center gap-3.5 px-4 py-4 text-left transition-colors duration-150 ease-out hover:bg-canvas">
                
                    <Icon className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
                    <span className="flex-1 text-[15px] text-ink">{label}</span>
                    {note && <span className="text-[13px] text-faint">{note}</span>}
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" aria-hidden="true" />
                  </button>
                </li>
            )}
            </ul>
          </section>
        )}

        <button
          type="button"
          onClick={() => go('welcome')}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-md border border-line py-4 text-[15px] font-medium text-ink transition-colors duration-150 ease-out hover:bg-canvas">
          
          <LogOutIcon className="h-[18px] w-[18px]" aria-hidden="true" />
          Sign out
        </button>

        <p className="mt-6 text-center text-[12px] text-faint">StrandPath · Prototype build 1.0</p>
      </div>

      <MobileBottomNav active="profile" go={go} />
    </div>);

}