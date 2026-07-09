// Typed API client for SpiceKraft backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('sk_token');
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (email: string) =>
    request<{ success: boolean; message: string; devOtp?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; token: string; user: { email: string; role: string }; message: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  loginWithGoogle: (email: string) =>
    request<{ success: boolean; token: string; user: { email: string; role: string }; message: string }>('/api/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  logout: () =>
    request('/api/auth/logout', { method: 'POST' }),
};

// ─── Products ────────────────────────────────────────────────
export const productsApi = {
  list: (params?: { category?: string; search?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ products: Product[] }>(`/api/products${qs ? '?' + qs : ''}`);
  },

  categories: () => request<{ categories: Category[] }>('/api/products/categories'),
  
  createCategory: (data: Partial<Category>) =>
    request<{ category: Category }>('/api/products/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: Partial<Category>) =>
    request<{ category: Category }>(`/api/products/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    request<{ message: string }>(`/api/products/categories/${id}`, {
      method: 'DELETE',
    }),

  get: (id: number) =>
    request<{ product: Product }>(`/api/products/${id}`),

  update: (id: number, data: Partial<Product> & { session_id?: string }) =>
    request<{ product: Product; edits_logged: number }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateStock: (id: number, stock_qty: number, session_id?: string) =>
    request<{ product: Product }>(`/api/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_qty, session_id }),
    }),

  create: (data: Partial<Product>) =>
    request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Orders ─────────────────────────────────────────────────
export const ordersApi = {
  create: (data: CreateOrderPayload) =>
    request<{ order: Order; message: string }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (params?: { status?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<{ orders: Order[] }>(`/api/orders${qs ? '?' + qs : ''}`);
  },

  updateStatus: (id: string, status: OrderStatus) =>
    request<{ order: Order }>(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  uploadScreenshot: (file: File) => {
    const formData = new FormData();
    formData.append('screenshot', file);
    
    // We can't use our `request` wrapper directly because it forces Content-Type: application/json
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${API_URL}/api/upload/screenshot`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data as { url: string };
    });
  }
};

// ─── Admin ──────────────────────────────────────────────────
export const adminApi = {
  startSession: () =>
    request<{ session: AdminSession }>('/api/admin/session/start', { method: 'POST' }),

  endSession: (id: string) =>
    request<{ session: AdminSession }>(`/api/admin/session/${id}/end`, { method: 'POST' }),

  getSessions: () =>
    request<{ sessions: AdminSession[] }>('/api/admin/sessions'),

  getProductEdits: (product_id?: number) => {
    const qs = product_id ? `?product_id=${product_id}` : '';
    return request<{ edits: ProductEdit[] }>(`/api/admin/product-edits${qs}`);
  },

  getDashboard: (range?: 'all' | 'month' | 'week') => {
    const qs = range ? `?range=${range}` : '';
    return request<{ stats: DashboardStats }>(`/api/admin/dashboard${qs}`);
  },
};

// ─── Achievements ─────────────────────────────────────────────
export const achievementsApi = {
  list: () => request<{ achievements: Achievement[] }>('/api/achievements'),
  
  create: (data: Partial<Achievement>) =>
    request<{ achievement: Achievement }>('/api/achievements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Achievement>) =>
    request<{ achievement: Achievement }>(`/api/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/achievements/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Reviews ──────────────────────────────────────────────────
export const reviewsApi = {
  list: (admin_session?: string) => {
    const qs = admin_session ? `?admin_session=${admin_session}` : '';
    return request<{ reviews: StoreReview[] }>(`/api/reviews${qs}`);
  },
  
  create: (data: Partial<StoreReview>) =>
    request<{ review: StoreReview; message: string }>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<StoreReview>) =>
    request<{ review: StoreReview; message: string }>(`/api/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<{ message: string }>(`/api/reviews/${id}`, {
      method: 'DELETE',
    }),
};

// ─── Types ──────────────────────────────────────────────────
export interface Product {
  id: number;
  category_id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  weight_grams: number;
  weight_label: string;
  stock_qty: number;
  rating: number;
  reviews: number;
  image_url: string;
  badge?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  product_count: number;
  sort_order: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_phone: string;
  customer_name: string;
  email?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_ref: string;
  screenshot_url?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: number;
  name: string;
  price: number;
  qty: number;
  weight: string;
  subtotal: number;
}

export interface CreateOrderPayload {
  items: Array<{ id: number; qty: number }>;
  customer_name: string;
  email?: string;
  address: string;
  payment_ref: string;
  screenshot_url?: string;
  notes?: string;
  state?: string;
}

export interface AdminSession {
  id: string;
  admin_phone: string;
  login_at: string;
  logout_at: string | null;
  ip_address: string;
  actions_count: number;
}

export interface ProductEdit {
  id: string;
  product_id: number;
  product_name: string;
  admin_phone: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  edited_at: string;
}

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  total_products: number;
  low_stock_products: Pick<Product, 'id' | 'name' | 'stock_qty'>[];
  out_of_stock_products: number;
}

export interface Achievement {
  id: number;
  title: string;
  value: string;
  description: string;
  icon: string;
  sort_order: number;
}

export interface StoreReview {
  id: number;
  customer_name: string;
  rating: number;
  description: string;
  is_approved: boolean;
  created_at: string;
}

export interface CartItem extends Product {
  qty: number;
}
