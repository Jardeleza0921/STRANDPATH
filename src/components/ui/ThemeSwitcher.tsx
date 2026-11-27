import React from 'react';
import { CheckIcon, MoonIcon, SunIcon } from 'lucide-react';
import { THEMES } from '../../lib/theme';
import { useTheme } from '../../contexts/ThemeContext';

function ModeControl({ onDark }: { onDark?: boolean }) {
  const { mode, setMode } = useTheme();
  const isDark = mode === 'dark';
  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={[
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-2 text-[11px] font-medium transition-colors',
        onDark
          ? 'border-white/20 bg-white/10 text-panel-ink hover:bg-white/15'
          : 'border-line bg-surface text-muted hover:border-ink/25 hover:text-ink'
      ].join(' ')}
    >
      {isDark ? <MoonIcon className="h-3.5 w-3.5" aria-hidden /> : <SunIcon className="h-3.5 w-3.5" aria-hidden />}
      {isDark ? 'Dark' : 'Light'}
    </button>
  );
}

export function ThemeSwitcher({ variant = 'compact', onDark = false }: { variant?: 'compact' | 'full'; onDark?: boolean }) {
  const { theme, setTheme, syncing } = useTheme();

  if (variant === 'full') {
    return (
      <div>
        <div role="radiogroup" aria-label="Color theme" className="grid gap-3 sm:grid-cols-2">
          {THEMES.map((item) => {
            const selected = item.id === theme;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(item.id)}
                className={`group flex items-center gap-3.5 rounded-md border p-3 text-left transition-all duration-150 ${
                  selected
                    ? 'border-brand/45 bg-brand-soft shadow-[inset_0_1px_0_rgba(255,255,255,.15)]'
                    : 'border-line bg-surface hover:border-ink/25'
                }`}
              >
                <span
                  aria-hidden
                  className="sp-swatch flex h-11 w-11 shrink-0 overflow-hidden rounded-full"
                  style={{ background: item.soft }}
                >
                  <span className="h-full w-1/2" style={{ background: item.brand }} />
                  <span className="h-full w-1/2" style={{ background: item.panel }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                    {item.label}
                    {selected && <CheckIcon className="h-3.5 w-3.5 text-brand" aria-hidden />}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-muted">{item.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-md border border-line bg-canvas p-3.5">
          <p className="text-[12.5px] font-semibold text-ink">Appearance</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
            Light mode keeps bright paper surfaces; dark mode uses deep, theme-tinted surfaces. Your choice is saved in
            this browser.
          </p>
          <div className="mt-2.5" role="radiogroup" aria-label="Appearance">
            {(['light', 'dark'] as const).map((option) => (
              <ModeOption key={option} option={option} />
            ))}
          </div>
        </div>

        {syncing && <p className="mt-2 text-[11px] text-faint" role="status">Saving your theme…</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Color theme"
        className={`flex items-center gap-1.5 rounded-full p-1 ${
          onDark ? 'border border-white/15 bg-white/10' : 'border border-line bg-surface/80'
        }`}
      >
        {THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === theme}
            aria-label={`${item.label} theme`}
            title={`${item.label} theme`}
            onClick={() => setTheme(item.id)}
            className={`sp-swatch h-5 w-5 rounded-full transition-transform duration-150 hover:scale-110 ${
              item.id === theme
                ? onDark
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-panel'
                  : 'ring-2 ring-brand ring-offset-2 ring-offset-surface'
                : ''
            }`}
            style={{
              background: `linear-gradient(135deg, ${item.soft} 0 50%, ${item.panel} 50% 100%)`,
              borderColor: item.brand
            }}
          />
        ))}
      </div>
      <ModeControl onDark={onDark} />
    </div>
  );
}

function ModeOption({ option }: { option: 'light' | 'dark' }) {
  const { mode, setMode } = useTheme();
  const selected = mode === option;
  const label = option === 'light' ? 'Light' : 'Dark';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => setMode(option)}
      className={[
        'flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-[12.5px] transition-colors',
        selected ? 'border-brand/45 bg-brand-soft text-ink' : 'border-line bg-surface text-muted hover:border-ink/25'
      ].join(' ')}
    >
      {option === 'light' ? <SunIcon className="h-4 w-4" aria-hidden /> : <MoonIcon className="h-4 w-4" aria-hidden />}
      {label}
      {selected && <CheckIcon className="ml-auto h-3.5 w-3.5 text-brand" aria-hidden />}
    </button>
  );
}
