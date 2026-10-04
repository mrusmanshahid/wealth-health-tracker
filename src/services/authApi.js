const TOKEN_KEY = 'whealth_access_token';
const EMAIL_KEY = 'whealth_user_email';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredEmail() {
  return localStorage.getItem(EMAIL_KEY);
}

export function setSession(token, email) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

async function authFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function register(email, password) {
  const data = await authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSession(data.access_token, data.email);
  return data;
}

export async function login(email, password) {
  const data = await authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setSession(data.access_token, data.email);
  return data;
}

export async function fetchMe() {
  return authFetch('/api/auth/me');
}

export async function fetchWorkspace() {
  return authFetch('/api/user/workspace');
}

export async function saveWorkspace(workspace) {
  return authFetch('/api/user/workspace', {
    method: 'PUT',
    body: JSON.stringify(workspace),
  });
}

export function logout() {
  clearSession();
}
