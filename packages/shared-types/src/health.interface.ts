export type UpDown = 'up' | 'down';
export type Overall = 'ok' | 'error';

export interface HealthResponse {
  status: Overall;
  info?: Record<string, { status: UpDown }>;
  error?: Record<string, unknown>;
  details?: Record<string, { status: UpDown }>;
}
