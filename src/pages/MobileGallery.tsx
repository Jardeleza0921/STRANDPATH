import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from 'lucide-react';
import { PhoneFrame } from '../components/mobile/PhoneFrame';
import { MobileScreenRouter } from '../components/mobile/MobileScreenRouter';
import { screenTitles } from '../components/mobile/nav';

export function MobileGallery() {
  return (
    <div className="min-h-full w-full bg-canvas">
      <div className="mx-auto max-w-[1400px] px-8 py-10">
        <Link
          to="/mobile"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors duration-150 ease-out hover:text-ink">
          
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Back to interactive mobile app
        </Link>

        <header className="mt-6">
          <h1 className="text-[32px] font-semibold tracking-[-0.03em] text-ink">Mobile screens · all frames</h1>
          <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-muted">
            All ten mobile frames at 390 × 844, laid out for export. Each frame is a complete screen — capture this
            page to bring the full mobile set into Figma at once.
          </p>
        </header>

        <div className="mt-12 flex flex-wrap gap-x-10 gap-y-16">
          {screenTitles.map((s) =>
          <PhoneFrame key={s.id} label={s.label}>
              <MobileScreenRouter screen={s.id} go={() => undefined} />
            </PhoneFrame>
          )}
        </div>
      </div>
    </div>);

}