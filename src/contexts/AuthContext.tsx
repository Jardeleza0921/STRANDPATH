import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { Profile, User, VerificationState } from '../types/api';

interface AuthValue {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gradeLevel?: string;
  school?: string;
  consent: boolean;
}

export interface RegisterResult {
  user: User;
  profile: Profile | null;
  verification?: VerificationState;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User | null; profile: Profile | null }>('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
      setError(null);
    } catch (err) {
      setUser(null);
      setProfile(null);
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const data = await api.post<{ user: User; profile: Profile | null }>('/auth/login', {
      email,
      password,
      remember
    });
    setUser(data.user);
    setProfile(data.profile);
    setError(null);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await api.post<RegisterResult>('/auth/register', payload);
    setUser(data.user);
    setProfile(data.profile);
    setError(null);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, profile, loading, error, refresh, login, register, logout, setProfile }),
    [user, profile, loading, error, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
