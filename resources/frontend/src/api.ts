type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;

    const firstError = errorBody?.errors
      ? Object.values(errorBody.errors).flat().find(Boolean)
      : undefined;

    throw new Error(
      firstError ??
      errorBody?.message ??
      `Request gagal dengan status ${response.status}.`,
    );
  }

  return body as T;
}

export async function getApi<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  return parseResponse<T>(response);
}

export async function postApi<TResponse, TPayload>(
  url: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<TResponse>(response);
}

export async function putApi<TResponse, TPayload>(
  url: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<TResponse>(response);
}

export async function deleteApi<TResponse = void>(url: string): Promise<TResponse> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return parseResponse<TResponse>(response);
}

/* =========================================================
   DASHBOARD
   ========================================================= */

export type DashboardSummaryData = {
  b3_in_weight_kg: number;
  b3_out_weight_kg: number;
  b3_count_in: number;
  b3_count_out: number;
  domestic_today_organic_kg: number;
  domestic_today_inorganic_kg: number;
};

type DashboardSummaryApiResponse =
  | DashboardSummaryData
  | {
    data: DashboardSummaryData;
  };

export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  const response = await getApi<DashboardSummaryApiResponse>(
    '/api/dashboard/summary',
  );

  if (
    response !== null &&
    typeof response === 'object' &&
    'data' in response
  ) {
    return response.data;
  }

  return response;
}

export type DashboardTrendItem = {
  month: string;
  month_name: string;
  b3_in_weight_kg: number;
  b3_out_weight_kg: number;
  b3_weight_kg: number;
  domestic_organic_kg: number;
  domestic_inorganic_kg: number;
  domestic_weight_kg: number;
};

export type CategoryBreakdownItem = {
  category_id: number;
  category_name: string;
  category_code: string;
  transaction_count: number;
  total_weight_kg: number;
  in_count: number;
  out_count: number;
};

export async function getDashboardTrends(months = 12): Promise<DashboardTrendItem[]> {
  const res = await getApi<{ trends: DashboardTrendItem[] }>(`/api/dashboard/trends?months=${months}`);
  return res?.trends ?? [];
}

export async function getDashboardCategoryBreakdown(): Promise<CategoryBreakdownItem[]> {
  const res = await getApi<{ categories: CategoryBreakdownItem[] }>('/api/dashboard/category-breakdown');
  return res?.categories ?? [];
}

/* =========================================================
   B3 TRANSACTIONS
   ========================================================= */

import type {
  B3TransactionData,
  DomesticTransactionData,
  AppNotification,
  PaginatedResponse,
} from './types/waste'

export type B3Transaction = B3TransactionData
export type DomesticTransaction = DomesticTransactionData
export type ApiNotification = AppNotification
export type { PaginatedResponse }

export async function getB3Transactions(
  params?: {
    page?: number;
    per_page?: number;
    type?: 'IN' | 'OUT';
    status?: string;
    from?: string;
    to?: string;
  },
): Promise<PaginatedResponse<B3Transaction>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.from) searchParams.set('date_from', params.from);
  if (params?.to) searchParams.set('date_to', params.to);

  const query = searchParams.toString();

  return getApi<PaginatedResponse<B3Transaction>>(
    `/api/b3-transactions${query ? `?${query}` : ''}`,
  );
}

/* =========================================================
   DOMESTIC TRANSACTIONS
   ========================================================= */



export async function getDomesticTransactions(
  params?: {
    page?: number;
    per_page?: number;
    movement_type?: 'IN' | 'OUT';
    session?: 'MORNING' | 'AFTERNOON';
    status?: string;
    from?: string;
    to?: string;
  },
): Promise<PaginatedResponse<DomesticTransaction>> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));
  if (params?.movement_type) searchParams.set('movement_type', params.movement_type);
  if (params?.session) searchParams.set('session', params.session);
  if (params?.status) searchParams.set('status', params.status);
  if (params?.from) searchParams.set('date_from', params.from);
  if (params?.to) searchParams.set('date_to', params.to);

  const query = searchParams.toString();

  return getApi<PaginatedResponse<DomesticTransaction>>(
    `/api/domestic-transactions${query ? `?${query}` : ''}`,
  );
}

export async function updateB3Transaction(
  id: number | string,
  data: Record<string, any>,
): Promise<{ data: B3Transaction }> {
  return putApi<{ data: B3Transaction }, Record<string, any>>(
    `/api/b3-transactions/${id}`,
    data,
  );
}

export async function deleteB3Transaction(id: number | string): Promise<void> {
  return deleteApi(`/api/b3-transactions/${id}`);
}

export async function updateDomesticTransaction(
  id: number | string,
  data: Record<string, any>,
): Promise<{ data: DomesticTransaction }> {
  return putApi<{ data: DomesticTransaction }, Record<string, any>>(
    `/api/domestic-transactions/${id}`,
    data,
  );
}

export async function deleteDomesticTransaction(id: number | string): Promise<void> {
  return deleteApi(`/api/domestic-transactions/${id}`);
}

/* =========================================================
   NOTIFICATIONS
   ========================================================= */



export async function getNotifications(params?: {
  include_read?: boolean;
  type?: string;
  per_page?: number;
}): Promise<ApiNotification[]> {
  const searchParams = new URLSearchParams();
  if (params?.include_read !== undefined) searchParams.set('include_read', String(params.include_read));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.per_page) searchParams.set('per_page', String(params.per_page));

  const query = searchParams.toString();
  const res = await getApi<{ data: ApiNotification[] } | ApiNotification[]>(
    `/api/notifications${query ? `?${query}` : ''}`,
  );

  if (Array.isArray(res)) return res;
  return res?.data ?? [];
}

export async function markNotificationAsRead(id: number | string): Promise<ApiNotification> {
  const res = await postApi<{ data: ApiNotification } | ApiNotification, {}>(
    `/api/notifications/${id}/read`,
    {},
  );
  if (res && 'data' in res) return res.data;
  return res as ApiNotification;
}

/* =========================================================
   SYSTEM SETTINGS
   ========================================================= */

export async function getSystemSettings(): Promise<Record<string, string>> {
  const res = await getApi<{ data: Record<string, string> }>('/api/settings');
  return res?.data ?? {};
}

export async function updateSystemSettings(
  settings: Record<string, any>,
): Promise<Record<string, string>> {
  const res = await postApi<{ data: Record<string, string> }, Record<string, any>>(
    '/api/settings',
    settings,
  );
  return res?.data ?? {};
}