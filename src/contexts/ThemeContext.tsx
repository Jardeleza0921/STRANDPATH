import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  applyMode,
  applyTheme,
  isThemeId,
  ModeId,
  readStoredMode,
  readStoredTheme,
  ThemeId
} from '../lib/theme';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface ThemeValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  mode: ModeId;
  setMode: (mode: ModeId) => void;
  toggleMode: () => void;
  syncing: boolean;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const initial = readStoredTheme();
    applyTheme(initial);
    return initial;
  });
  const [mode, setModeState] = useState<ModeId>(() => {
    const initial = readStoredMode();
    applyMode(initial);
    return initial;
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // A signed-in preference follows the account across devices.
  useEffect(() => {
    if (user && isThemeId(user.theme) && user.theme !== theme) {
      setThemeState(user.theme);
    }
  }, [user?.theme]); // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback(
    (next: ThemeId) => {
      setThemeState(next);
      applyTheme(next);
      if (!user) return;
      setSyncing(true);
      api
        .put('/auth/theme', { theme: next })
        .catch(() => undefined)
        .finally(() => setSyncing(false));
    },
    [user]
  );

  const setMode = useCallback((next: ModeId) => {
    setModeState(next);
    applyMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      applyMode(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, mode, setMode, toggleMode, syncing }),
    [theme, setTheme, mode, setMode, toggleMode, syncing]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
