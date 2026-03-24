/**
 * API client for Cloudflare D1 backend.
 * All data goes through /api/v1/* endpoints.
 */
import type { MenuItem, Order, CalendarEvent, User, SocialPost, GalleryPost, AppSettings, CustomerNote, CustomerStats, Booking, SharedPlan, SharedPlanResponse, CateringContract } from '../types';

let getToken: () => Promise<string | null> = async () => null;
export const initApi = (tokenFn: () => Promise<string | null>) => { getToken = tokenFn; };

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`/api/v1${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  // DELETE returns 204 sometimes
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Menu
export const fetchMenu = () => apiFetch<MenuItem[]>('/menu');
export const upsertMenuItem = (item: Partial<MenuItem> & { id: string }) =>
  apiFetch<MenuItem>('/menu', { method: 'POST', body: JSON.stringify(item) });
export const deleteMenuItem = (id: string) =>
  apiFetch(`/menu/${id}`, { method: 'DELETE' });

// Orders
export const fetchOrders = () => apiFetch<Order[]>('/orders');
export const createOrder = (order: Partial<Order>) =>
  apiFetch<Order>('/orders', { method: 'POST', body: JSON.stringify(order) });
export const updateOrder = (id: string, data: Partial<Order>) =>
  apiFetch<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Calendar Events
export const fetchEvents = () => apiFetch<CalendarEvent[]>('/events');
export const upsertEvent = (event: Partial<CalendarEvent> & { id: string }) =>
  apiFetch<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(event) });
export const deleteEvent = (id: string) =>
  apiFetch(`/events/${id}`, { method: 'DELETE' });

// Users
export const fetchUsers = () => apiFetch<User[]>('/users');
export const fetchCurrentUser = () => apiFetch<User>('/users/me');
export const createUser = (data: Partial<User>) =>
  apiFetch<User>('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<User>) =>
  apiFetch<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id: string) =>
  apiFetch(`/users/${id}`, { method: 'DELETE' });

// Social Posts
export const fetchSocialPosts = () => apiFetch<SocialPost[]>('/social-posts');
export const upsertSocialPost = (post: Partial<SocialPost> & { id: string }) =>
  apiFetch<SocialPost>('/social-posts', { method: 'POST', body: JSON.stringify(post) });
export const deleteSocialPost = (id: string) =>
  apiFetch(`/social-posts/${id}`, { method: 'DELETE' });

// Gallery
export const fetchGalleryPosts = () => apiFetch<GalleryPost[]>('/gallery');
export const submitGalleryPost = (post: Partial<GalleryPost>) =>
  apiFetch<GalleryPost>('/gallery', { method: 'POST', body: JSON.stringify(post) });
export const updateGalleryPost = (id: string, data: Partial<GalleryPost>) =>
  apiFetch<GalleryPost>(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteGalleryPost = (id: string) =>
  apiFetch(`/gallery/${id}`, { method: 'DELETE' });
export const toggleGalleryLike = (id: string) =>
  apiFetch(`/gallery/${id}/like`, { method: 'POST' });

// Settings
export const fetchSettings = () => apiFetch<AppSettings>('/settings');
export const updateSettings = (data: Partial<AppSettings>) =>
  apiFetch<AppSettings>('/settings', { method: 'PUT', body: JSON.stringify(data) });

// Seed
export const seedDatabase = () =>
  apiFetch('/seed', { method: 'POST' });

// Migrate from Firestore
export const migrateFromFirestore = (apiKey?: string) =>
  apiFetch('/migrate-firestore', { method: 'POST', body: JSON.stringify({ apiKey }) });

// ─── Customer CRM ────────────────────────────────────────────

export const fetchCustomerNotes = (userId: string) =>
  apiFetch<CustomerNote[]>(`/customers/${userId}/notes`);
export const addCustomerNote = (userId: string, note: string) =>
  apiFetch<CustomerNote>(`/customers/${userId}/notes`, { method: 'POST', body: JSON.stringify({ note }) });
export const fetchCustomerStats = (userId: string) =>
  apiFetch<CustomerStats>(`/customers/${userId}/stats`);
export const fetchMyInsights = () =>
  apiFetch<CustomerStats>('/customers/me/insights');

// ─── Bookings ────────────────────────────────────────────────

export const fetchBookings = () => apiFetch<Booking[]>('/bookings');
export const createBooking = (data: Partial<Booking>) =>
  apiFetch<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) });
export const fetchBooking = (id: string) => apiFetch<Booking>(`/bookings/${id}`);
export const updateBooking = (id: string, data: Partial<Booking>) =>
  apiFetch<Booking>(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const fetchAvailability = (month: string) =>
  apiFetch<{ date: string; available: boolean }[]>(`/bookings/availability?month=${month}`);

// ─── Shared Plans ────────────────────────────────────────────

export const createSharedPlan = (data: Partial<SharedPlan>) =>
  apiFetch<SharedPlan>('/shared-plans', { method: 'POST', body: JSON.stringify(data) });
export const fetchSharedPlan = (id: string) =>
  apiFetch<SharedPlan & { responses: SharedPlanResponse[]; menuItems: any[] }>(`/shared-plans/${id}`);
export const respondToSharedPlan = (id: string, response: Partial<SharedPlanResponse>) =>
  apiFetch<SharedPlanResponse>(`/shared-plans/${id}/respond`, { method: 'POST', body: JSON.stringify(response) });
export const finalizeSharedPlan = (id: string) =>
  apiFetch<SharedPlan>(`/shared-plans/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'finalized' }) });

// ─── Contracts ───────────────────────────────────────────────

export const createContract = (data: Partial<CateringContract>) =>
  apiFetch<CateringContract>('/contracts', { method: 'POST', body: JSON.stringify(data) });
export const fetchContract = (id: string) =>
  apiFetch<CateringContract>(`/contracts/${id}`);
export const signContract = (id: string, signatureData?: string) =>
  apiFetch<CateringContract>(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify({ signed: true, signatureData }) });

// ─── Payment Reminders ───────────────────────────────────────

export const triggerPaymentReminders = () =>
  apiFetch('/reminders', { method: 'POST' });
export const fetchOutstandingBalances = () =>
  apiFetch<(Booking | Order)[]>('/reminders');

// ─── AI (new endpoints) ─────────────────────────────────────

export const askReceptionist = (message: string, history: any[], context?: any) =>
  apiFetch<{ reply: string; action?: { type: string; data: any } }>('/ai/receptionist', {
    method: 'POST', body: JSON.stringify({ message, history, ...context })
  });
export const getSurpriseMe = (menuItems: any[], pastOrders?: any[], prefs?: string) =>
  apiFetch<{ recommendations: { itemId: string; name: string; reason: string }[]; greeting: string }>('/ai/recommend', {
    method: 'POST', body: JSON.stringify({ menuItems, pastOrders, prefs })
  });

// ─── Vendor Pack ─────────────────────────────────────────────

export const fetchVendorPack = () => apiFetch<{ html: string }>('/vendor-pack');
