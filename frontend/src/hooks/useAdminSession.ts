import { useCallback, useEffect, useRef, useState } from 'react';
import { api, setUnauthorizedHandler } from '../services/api';
import type { AdminIdentity } from '../types';

const TOKEN_KEY = 'mina_minks_admin_token';

export interface UseAdminSessionResult {
  token: string | null;
  identity: AdminIdentity | null;
  verifying: boolean;
  sessionExpired: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  acknowledgeExpiry: () => void;
}

export function useAdminSession(): UseAdminSessionResult {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [verifying, setVerifying] = useState<boolean>(Boolean(token));
  const [sessionExpired, setSessionExpired] = useState<boolean>(false);
  const tokenRef = useRef<string | null>(token);

  const clearSession = useCallback((expired: boolean): void => {
    tokenRef.current = null;
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setIdentity(null);
    setVerifying(false);
    setSessionExpired(expired);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (tokenRef.current) clearSession(true);
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  useEffect(() => {
    if (!identity?.expires_at) return;
    const expiry = Date.parse(identity.expires_at);
    if (!Number.isFinite(expiry)) return;
    const delay = expiry - Date.now();
    if (delay <= 0) {
      clearSession(true);
      return;
    }
    const timer = window.setTimeout(() => clearSession(true), delay);
    return () => window.clearTimeout(timer);
  }, [identity?.expires_at, clearSession]);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }
    let active = true;
    setVerifying(true);
    api.admin
      .me(token)
      .then((result: AdminIdentity) => {
        if (active) setIdentity(result);
      })
      .catch(() => {
        if (active) clearSession(true);
      })
      .finally(() => {
        if (active) setVerifying(false);
      });
    return () => {
      active = false;
    };
  }, [token, clearSession]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const result = await api.admin.login(email, password);
    tokenRef.current = result.token;
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setIdentity({ email: result.email, expires_at: result.expires_at });
    setSessionExpired(false);
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const currentToken = tokenRef.current;
    clearSession(false);
    if (currentToken) {
      try {
        await api.admin.logout(currentToken);
      } catch {
        // A network failure must not prevent clearing the local session.
      }
    }
  }, [clearSession]);

  const acknowledgeExpiry = useCallback((): void => {
    setSessionExpired(false);
    document.getElementById('admin-email')?.focus();
  }, []);

  return { token, identity, verifying, sessionExpired, signIn, signOut, acknowledgeExpiry };
}
