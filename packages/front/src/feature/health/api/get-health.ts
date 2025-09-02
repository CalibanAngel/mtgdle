import { useQuery } from '@tanstack/react-query';

import { http } from '@/config/http.ts';

export type UpDown = 'up' | 'down';
export type Overall = 'ok' | 'error';

export interface HealthResponse {
  status: Overall;
  info?: Record<string, { status: UpDown }>;
  error?: Record<string, unknown>;
  details?: Record<string, { status: UpDown }>;
}

export type HealthState = 'idle' | 'loading' | 'healthy' | 'unhealthy';

export const getHealth = () => http<HealthResponse>('/health');

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => getHealth(),
  });
};
