import React from 'react';
import { CheckIcon } from 'lucide-react';
import { THEMES } from '../../lib/theme';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeSwitcher({ variant = 'compact', onDark = false }: { variant?: 'compact' | 'full'; onDark?: boolean }) {
  const { theme, setTheme, syncing } = useTheme();

  if (variant === 'full') {
    return (
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
                  ? 'border-brand/45 bg-brand-soft shadow-[inset_0_1px_0_rgba(255,255,255,.6)]'
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
        {syncing && <p className="text-[11px] text-faint sm:col-span-2" role="status">Saving your theme…</p>}
      </div>
    );
  }

  return (
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
          style={{ background: `linear-gradient(135deg, ${item.soft} 0 50%, ${item.panel} 50% 100%)`, borderColor: item.brand }}
        />
      ))}
    </div>
  );
}
