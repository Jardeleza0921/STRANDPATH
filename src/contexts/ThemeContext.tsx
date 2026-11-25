import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { applyTheme, isThemeId, readStoredTheme, ThemeId } from '../lib/theme';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface ThemeValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
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
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

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

  const value = useMemo(() => ({ theme, setTheme, syncing }), [theme, setTheme, syncing]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
