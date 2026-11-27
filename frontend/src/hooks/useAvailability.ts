import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import type { AvailabilityResponse } from '../types';

export interface UseAvailabilityResult {
  availability: AvailabilityResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAvailability(date: string | null, serviceId: number | null): UseAvailabilityResult {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    if (!date || serviceId === null) {
      setAvailability(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAvailability(await api.getAvailability(date, serviceId));
    } catch (caught: unknown) {
      setAvailability(null);
      setError(caught instanceof Error ? caught.message : 'Unable to load availability.');
    } finally {
      setLoading(false);
    }
  }, [date, serviceId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { availability, loading, error, refetch };
}
