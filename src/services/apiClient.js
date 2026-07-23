import { getAuthorizationHeader } from './authService';
import { API_BASE_URL } from './apiConfig';

export async function apiRequest(path, { method = 'GET', body, headers = {} } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...getAuthorizationHeader(),
      ...headers,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API 요청에 실패했습니다. (${response.status})`);
  }

  if (response.status === 204) return null;
  return response.json();
}
