import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Service } from '../types';

export interface UseServicesResult {
  services: Service[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

export function useServices(activeOnly = true): UseServicesResult {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setServices(await api.getServices(activeOnly));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to load services.');
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { services, loading, error, reload };
}
