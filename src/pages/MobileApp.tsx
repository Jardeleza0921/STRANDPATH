import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, GridIcon } from 'lucide-react';
import { PhoneFrame } from '../components/mobile/PhoneFrame';
import { MobileScreenRouter } from '../components/mobile/MobileScreenRouter';
import { MobileScreen, screenTitles } from '../components/mobile/nav';
import { useScreenInit } from '../useScreenInit.js';

export function MobileApp() {
  const screenInit = useScreenInit();
  const [screen, setScreen] = useState<MobileScreen>(screenInit.screen as MobileScreen | undefined ?? 'welcome');

  return (
    <div className="min-h-full w-full bg-canvas">
      <div className="mx-auto max-w-content px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/cover"
            className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
            
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
            Prototype map
          </Link>
          <Link
            to="/mobile/all"
            className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-4 py-2 text-[13px] font-medium text-ink transition-colors duration-150 ease-out hover:border-ink/25">
            
            <GridIcon className="h-4 w-4" aria-hidden="true" />
            View all 10 frames
          </Link>
        </div>

        <header className="mt-6">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">StrandPath mobile app</h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">
            390 × 844 screens designed for phone use, with bottom navigation and large touch targets. Tap through the
            flow inside the device, or jump to any screen from the list.
          </p>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[240px_1fr] lg:items-start">
          <nav aria-label="Mobile screens" className="lg:sticky lg:top-10">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-faint">Screens</p>
            <ul className="mt-3 space-y-1">
              {screenTitles.map((s, i) => {
                const active = s.id === screen;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setScreen(s.id)}
                      aria-current={active ? 'true' : undefined}
                      className={[
                      'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm',
                      'transition-colors duration-150 ease-out',
                      active ? 'bg-brand-soft font-medium text-brand-dark' : 'text-muted hover:bg-surface hover:text-ink'].
                      join(' ')}>
                      
                      <span className="text-[12px] tabular-nums text-faint">{String(i + 1).padStart(2, '0')}</span>
                      {s.label}
                    </button>
                  </li>);

              })}
            </ul>
          </nav>

          <div className="flex justify-center lg:justify-start">
            <PhoneFrame label={screenTitles.find((s) => s.id === screen)?.label}>
              <MobileScreenRouter screen={screen} go={setScreen} />
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>);

}