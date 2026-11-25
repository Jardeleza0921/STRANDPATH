import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { AuthConfig } from '../types/api';

let cached: AuthConfig | null = null;
let pending: Promise<AuthConfig> | null = null;

function loadConfig() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = api
      .get<AuthConfig>('/auth/config')
      .then((config) => {
        cached = config;
        return config;
      })
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function useAuthConfig() {
  const [config, setConfig] = useState<AuthConfig | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cached) return;
    let active = true;
    loadConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load sign-in options');
      });
    return () => {
      active = false;
    };
  }, []);

  return { config, error };
}
