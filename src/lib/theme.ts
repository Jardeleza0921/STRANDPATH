export type ThemeId = 'green' | 'blue' | 'red' | 'violet';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  blurb: string;
  brand: string;
  soft: string;
  panel: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'green',
    label: 'Green',
    blurb: 'Calm forest tones with warm paper surfaces',
    brand: '#1f6f4e',
    soft: '#e4f0e8',
    panel: '#11281d'
  },
  {
    id: 'blue',
    label: 'Blue',
    blurb: 'Focused academic blues on cool paper',
    brand: '#1f5ba8',
    soft: '#e2edf9',
    panel: '#0e1c31'
  },
  {
    id: 'red',
    label: 'Red',
    blurb: 'Muted terracotta with warm neutral surfaces',
    brand: '#9e3a30',
    soft: '#f8e7e4',
    panel: '#291615'
  },
  {
    id: 'violet',
    label: 'Violet',
    blurb: 'Soft violet with deep plum panels',
    brand: '#674da7',
    soft: '#eee8fa',
    panel: '#1b152b'
  }
];

export const THEME_IDS = THEMES.map((theme) => theme.id);

export const isThemeId = (value: unknown): value is ThemeId =>
  typeof value === 'string' && (THEME_IDS as string[]).includes(value);

const STORAGE_KEY = 'strandpath-theme';

export function applyTheme(theme: ThemeId) {
  if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* storage may be unavailable; the theme still applies for this visit */
  }
}

export function readStoredTheme(): ThemeId {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'green';
}
