// API Integration Service Layer for LimbahApp

const API_BASE = '/api';

/**
 * Helper to handle API responses and CSRF
 */
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

// Dashboard Summary Interface
export interface DashboardSummaryData {
  b3_total_weight_kg: number;
  b3_count_in: number;
  b3_count_out: number;
  b3_in_weight_kg: number;
  b3_out_weight_kg: number;
  b3_pending_count: number;
  domestic_today_organic_kg: number;
  domestic_today_inorganic_kg: number;
  domestic_today_total_kg: number;
  storage_alerts_active: number;
  storage_alerts_expired: number;
  notifications_unread: number;
  recent_b3_transactions?: any[];
  recent_domestic_transactions?: any[];
  recent_alerts?: any[];
}

export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  return apiFetch<DashboardSummaryData>('/dashboard/summary');
}

export async function getMonthlyTrends(months = 12): Promise<{ trends: any[] }> {
  return apiFetch<{ trends: any[] }>(`/dashboard/monthly-trends?months=${months}`);
}

export async function getB3Transactions(page = 1, perPage = 25, type?: string, status?: string): Promise<{ data: any[]; meta: any }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (type && type !== 'all') queryParams.append('type', type.toUpperCase());
  if (status && status !== 'all') queryParams.append('status', status.toUpperCase());

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const response = await fetch(`${API_BASE}/b3-transactions?${queryParams.toString()}`, {
    headers: {
      'Accept': 'application/json',
      ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch B3 transactions');
  return await response.json();
}

export async function createB3Transaction(payload: any): Promise<any> {
  return apiFetch('/b3-transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getDomesticTransactions(page = 1, perPage = 25, session?: string): Promise<{ data: any[]; meta: any }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  if (session && session !== 'all') queryParams.append('session', session.toUpperCase());

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  const response = await fetch(`${API_BASE}/domestic-transactions?${queryParams.toString()}`, {
    headers: {
      'Accept': 'application/json',
      ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
    },
  });
  if (!response.ok) throw new Error('Failed to fetch Domestic transactions');
  return await response.json();
}

export async function createDomesticTransaction(payload: any): Promise<any> {
  return apiFetch('/domestic-transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getWasteCategories(): Promise<any[]> {
  return apiFetch<any[]>('/waste-categories');
}

export async function getNotifications(): Promise<any[]> {
  return apiFetch<any[]>('/notifications');
}
