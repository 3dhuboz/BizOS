import type { Tenant, PlatformStats } from '../types';

// Use the same apiFetch pattern but import it
let getToken: () => Promise<string | null> = async () => null;
export const initPlatformApi = (tokenFn: () => Promise<string | null>) => { getToken = tokenFn; };

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/v1${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const fetchTenants = () => apiFetch<Tenant[]>('/platform/tenants');
export const createTenant = (data: Partial<Tenant>) => apiFetch<Tenant & { generatedPassword?: string }>('/platform/tenants', { method: 'POST', body: JSON.stringify(data) });
export const fetchTenant = (id: string) => apiFetch<Tenant>(`/platform/tenants/${id}`);
export const updateTenant = (id: string, data: Partial<Tenant>) => apiFetch<Tenant>(`/platform/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTenant = (id: string) => apiFetch(`/platform/tenants/${id}`, { method: 'DELETE' });
export const impersonateTenant = (id: string) => apiFetch<{ tenant: Tenant }>(`/platform/tenants/${id}/impersonate`, { method: 'POST' });
export const fetchPlatformStats = () => apiFetch<PlatformStats>('/platform/stats');
export const fetchSystemHealth = () => apiFetch<{ tables: Record<string, number>; latencyMs: number; timestamp: string }>('/platform/health');
export const fetchTemplates = () => apiFetch<any[]>('/platform/templates');
