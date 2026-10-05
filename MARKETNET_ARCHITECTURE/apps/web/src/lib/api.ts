const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchPublicApi<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role?: string;
    roles?: string[];
  };
}

export async function apiLogin(email: string, password: string): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    // Le backend peut renvoyer { message } ou { message: string[] }
    const msg = Array.isArray(data?.message)
      ? data.message.join(', ')
      : (data?.message ?? 'Identifiants incorrects.');
    throw new Error(msg);
  }

  return data as AuthTokens;
}

export async function apiRegister(payload: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = Array.isArray(data?.message)
      ? data.message.join(', ')
      : (data?.message ?? 'Erreur lors de l\'inscription.');
    throw new Error(msg);
  }

  return data as AuthTokens;
}

export async function apiLogout(accessToken: string, refreshToken?: string): Promise<void> {
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  });
}

export async function fetchAuthedApi<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function mutateAuthedApi<T>(
  path: string,
  accessToken: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : (data?.message ?? `Request failed with status ${res.status}`);
    throw new Error(message);
  }

  return data as T;
}

// ── Token helpers (côté client uniquement) ───────────────────────────────────

export const TOKEN_KEY = 'mn_access';
export const REFRESH_KEY = 'mn_refresh';

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem(TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  localStorage.setItem('mn_user', JSON.stringify(tokens.user));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem('mn_user');
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthTokens['user'] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('mn_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
