import { useQuery } from '@tanstack/react-query';
import type { HealthResponse } from '@mtgdle/shared-types';

import { http } from '@/config/http.ts';

export type HealthState = 'idle' | 'loading' | 'healthy' | 'unhealthy';

export const getHealth = () => http<HealthResponse>('/health');

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth(),
  });
};
