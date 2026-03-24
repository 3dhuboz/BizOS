/**
 * Platform API client — uses the same auth pipeline as the main API client.
 * All platform endpoints require DEV role.
 */
import type { Tenant, PlatformStats } from '../types';

// Re-use the main API's fetch with its token + devApiKey handling
// We can't import apiFetch directly (it's not exported), so we replicate
// but pull the devApiKey from the same source
import { getTenantId } from './api';

let getToken: () => Promise<string | null> = async () => null;
let devApiKey: string | null = null;

export const initPlatformApi = (tokenFn: () => Promise<string | null>) => { getToken = tokenFn; };
export const setPlatformDevKey = (key: string | null) => { devApiKey = key; };

async function platformFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  else if (devApiKey) headers['Authorization'] = `Bearer ${devApiKey}`;
  const tenantId = getTenantId();
  if (tenantId) headers['X-Tenant-ID'] = tenantId;
  const res = await fetch(`/api/v1${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const fetchTenants = () => platformFetch<Tenant[]>('/platform/tenants');
export const createTenant = (data: Partial<Tenant>) => platformFetch<Tenant & { generatedPassword?: string }>('/platform/tenants', { method: 'POST', body: JSON.stringify(data) });
export const fetchTenant = (id: string) => platformFetch<Tenant>(`/platform/tenants/${id}`);
export const updateTenant = (id: string, data: Partial<Tenant>) => platformFetch<Tenant>(`/platform/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTenant = (id: string) => platformFetch(`/platform/tenants/${id}`, { method: 'DELETE' });
export const impersonateTenant = (id: string) => platformFetch<{ tenant: Tenant }>(`/platform/tenants/${id}/impersonate`, { method: 'POST' });
export const fetchPlatformStats = () => platformFetch<PlatformStats>('/platform/stats');
export const fetchSystemHealth = () => platformFetch<{ tables: Record<string, number>; latencyMs: number; timestamp: string }>('/platform/health');
export const fetchTemplates = () => platformFetch<any[]>('/platform/templates');
