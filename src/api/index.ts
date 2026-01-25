const BASE_URL = process.env.API_BASE_URL || 'https://api.example.com';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw data || { status: res.status };
    return data;
  } catch (err) {
    throw err;
  }
}

export const Api = {
  get: (path: string) => apiFetch(path, { method: 'GET' }),
  post: (path: string, body: any) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: any) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
