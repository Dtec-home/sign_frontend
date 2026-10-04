import type {
  User,
  Document,
  SignatureRequest,
  SignatureRequestListItem,
  DashboardStats,
  PlacementInput,
} from '../types';

const API_BASE = 'http://localhost:8000/api';

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const response = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!response.ok) {
      clearTokens();
      return null;
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.access);
    if (data.refresh) {
      localStorage.setItem(REFRESH_KEY, data.refresh);
    }
    return data.access;
  } catch {
    clearTokens();
    return null;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return fetchApi<T>(endpoint, options, false);
    }
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.detail || 'Request failed');
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}

// For file uploads (multipart/form-data)
async function fetchApiFormData<T>(
  endpoint: string,
  formData: FormData,
  retry = true
): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (response.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return fetchApiFormData<T>(endpoint, formData, false);
    }
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.detail || 'Request failed');
  }

  return response.json();
}

// Auth
export async function login(username: string, password: string): Promise<User> {
  const response = await fetch(`${API_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  setTokens(data.access, data.refresh);
  return data.user;
}

export async function logout(): Promise<void> {
  const refresh = getRefreshToken();
  try {
    await fetchApi('/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    });
  } catch {
    // Ignore errors on logout
  }
  clearTokens();
}

export async function getCurrentUser(): Promise<User> {
  return fetchApi<User>('/me/');
}

// Users
export async function getUsers(): Promise<User[]> {
  return fetchApi<User[]>('/users/');
}

// Dashboard
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchApi<DashboardStats>('/dashboard/stats/');
}

// Documents
export async function getDocuments(): Promise<Document[]> {
  return fetchApi<Document[]>('/documents/');
}

export async function getDocument(id: string): Promise<Document> {
  return fetchApi<Document>(`/documents/${id}/`);
}

export async function uploadDocument(title: string, file: File): Promise<Document> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);
  return fetchApiFormData<Document>('/documents/', formData);
}

export async function deleteDocument(id: string): Promise<void> {
  await fetchApi(`/documents/${id}/`, { method: 'DELETE' });
}

// Signature Requests
export async function getSignatureRequests(params?: {
  initiated?: boolean;
  pending?: boolean;
  action_required?: boolean;
  completed?: boolean;
}): Promise<SignatureRequestListItem[]> {
  const searchParams = new URLSearchParams();
  if (params?.initiated) searchParams.set('initiated', 'true');
  if (params?.pending) searchParams.set('pending', 'true');
  if (params?.action_required) searchParams.set('action_required', 'true');
  if (params?.completed) searchParams.set('completed', 'true');

  const query = searchParams.toString();
  return fetchApi<SignatureRequestListItem[]>(`/signature-requests/${query ? `?${query}` : ''}`);
}

export async function getSignatureRequest(id: string): Promise<SignatureRequest> {
  return fetchApi<SignatureRequest>(`/signature-requests/${id}/`);
}

export async function createSignatureRequest(
  documentId: string,
  placements: PlacementInput[]
): Promise<SignatureRequest> {
  return fetchApi<SignatureRequest>('/signature-requests/', {
    method: 'POST',
    body: JSON.stringify({
      document_id: documentId,
      placements_data: placements,
    }),
  });
}

export async function sendSignatureRequest(id: string): Promise<SignatureRequest> {
  return fetchApi<SignatureRequest>(`/signature-requests/${id}/send/`, {
    method: 'POST',
  });
}

export async function cancelSignatureRequest(id: string): Promise<SignatureRequest> {
  return fetchApi<SignatureRequest>(`/signature-requests/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

// Signing
export async function signPlacement(
  placementId: string,
  signature: string
): Promise<{ status: string; request_status: string; all_signed: boolean }> {
  return fetchApi(`/placements/${placementId}/sign/`, {
    method: 'POST',
    body: JSON.stringify({ signature }),
  });
}

// Download signed document
export async function downloadSignedDocument(requestId: string): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE}/signature-requests/${requestId}/download/`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Download failed');
  }

  return response.blob();
}
