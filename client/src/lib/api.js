const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('foodly_pos_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const config = {
    cache: 'no-store',
    ...options,
    headers
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      const errorObj = new Error(
        result.error?.message || `Request failed with status ${response.status}`
      );
      errorObj.status = response.status;
      errorObj.code = result.error?.code || 'UNKNOWN_ERROR';
      errorObj.details = result.error?.details || [];
      throw errorObj;
    }

    return result;
  } catch (err) {
    if (err.name === 'TypeError' && err.message?.toLowerCase().includes('fetch')) {
      const connErr = new Error('Cannot reach backend server. Please verify backend is running on http://localhost:5000.');
      connErr.status = 503;
      connErr.code = 'BACKEND_OFFLINE';
      throw connErr;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => apiFetch(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) =>
    apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) =>
    apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) =>
    apiFetch(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options
    })
};
