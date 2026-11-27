import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AdminIdentity } from '../types';

const TOKEN_KEY = 'mina_minks_admin_token';

export interface UseAdminSessionResult {
  token: string | null;
  identity: AdminIdentity | null;
  verifying: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAdminSession(): UseAdminSessionResult {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [verifying, setVerifying] = useState<boolean>(Boolean(token));

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
        sessionStorage.removeItem(TOKEN_KEY);
        if (active) {
          setToken(null);
          setIdentity(null);
        }
      })
      .finally(() => {
        if (active) setVerifying(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const result = await api.admin.login(email, password);
    sessionStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setIdentity({ email: result.email, expires_at: result.expires_at });
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    if (token) {
      try {
        await api.admin.logout(token);
      } catch {
        // A network failure must not prevent clearing the local session.
      }
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setIdentity(null);
  }, [token]);

  return { token, identity, verifying, signIn, signOut };
}
