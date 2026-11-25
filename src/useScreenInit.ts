import { useMemo } from 'react';
import { manifest } from './canvas.manifest.js';

export interface ScreenInitState {
  active?: string;
  [key: string]: unknown;
}

/**
 * Reads the prototype-only screen state used by the mobile mockups.
 * This does not affect the real student application.
 */
export function useScreenInit(): ScreenInitState {
  return useMemo(() => {
    if (typeof window === 'undefined') return {};
    const screenId = new URLSearchParams(window.location.search).get('mp_screen');
    if (!screenId) return {};
    return manifest?.screens?.[screenId]?.state ?? {};
  }, []);
}
