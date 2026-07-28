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
    type?: 'IN' | 'OUT';
    status?: string;
    from?: string;
    to?: string;
  },
): Promise<PaginatedResponse<B3Transaction>> {
  const searchParams = new URLSearchParams();

  if (params?.type) {
    searchParams.set('type', params.type);
  }

  if (params?.status) {
    searchParams.set('status', params.status);
  }

  if (params?.from) {
    searchParams.set('from', params.from);
  }

  if (params?.to) {
    searchParams.set('to', params.to);
  }

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
    movement_type?: 'IN' | 'OUT';
    session?: 'MORNING' | 'AFTERNOON';
    status?: string;
    from?: string;
    to?: string;
  },
): Promise<PaginatedResponse<DomesticTransaction>> {
  const searchParams = new URLSearchParams();

  if (params?.movement_type) {
    searchParams.set('movement_type', params.movement_type);
  }

  if (params?.session) {
    searchParams.set('session', params.session);
  }

  if (params?.status) {
    searchParams.set('status', params.status);
  }

  if (params?.from) {
    searchParams.set('from', params.from);
  }

  if (params?.to) {
    searchParams.set('to', params.to);
  }

  const query = searchParams.toString();

  return getApi<PaginatedResponse<DomesticTransaction>>(
    `/api/domestic-transactions${query ? `?${query}` : ''}`,
  );
}