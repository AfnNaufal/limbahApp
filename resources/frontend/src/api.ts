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

export type B3Transaction = {
  id: number;
  transaction_type: 'IN' | 'OUT';
  waste_category_id: number;
  waste_code?: string | null;
  waste_name?: string | null;
  date: string;
  source?: string | null;
  destination?: string | null;
  transporter?: string | null;
  manifest_number?: string | null;
  weight_kg: number | string;
  status?: string | null;
  storage_deadline_at?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
};

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

export type DomesticTransaction = {
  id: number;
  date: string;
  movement_type?: 'IN' | 'OUT' | null;
  session?: 'MORNING' | 'AFTERNOON' | string | null;
  processing_method?: string | null;

  organic_weight_kg?: number | string;
  inorganic_weight_kg?: number | string;
  total_weight_kg?: number | string;

  domestic_residue_kg?: number | string;
  leaf_waste_kg?: number | string;
  paper_waste_kg?: number | string;
  wood_scrap_kg?: number | string;
  metal_kg?: number | string;
  cardboard_kg?: number | string;
  plant_waste_kg?: number | string;
  plastic_bottle_kg?: number | string;
  plastic_packaging_kg?: number | string;
  food_container_kg?: number | string;
  wood_cutting_kg?: number | string;
  brick_kg?: number | string;
  concrete_block_kg?: number | string;
  cement_packaging_kg?: number | string;
  ceiling_waste_kg?: number | string;

  status?: string | null;
  pic_name?: string | null;
  pic_phone?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

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

export type ApiNotification = {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_type?: string | null;
  reference_id?: number | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

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