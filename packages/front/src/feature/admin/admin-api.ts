import { env } from '@/config/env.validation';

export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function adminRequest<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(`${env.API_URL}/admin/${path}`, {
    credentials: 'include',
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
    headers: { 'Content-Type': 'application/json', 'X-Admin-Request': 'true' },
    ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };
    if (response.status === 401 && !path.startsWith('auth/'))
      window.dispatchEvent(new Event('admin-session-expired'));
    throw new AdminApiError(
      response.status,
      typeof error.message === 'string'
        ? error.message
        : response.status === 429
          ? 'Trop de tentatives. Patiente quelques minutes.'
          : 'La requête a échoué. Vérifie les paramètres puis réessaie.',
    );
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
