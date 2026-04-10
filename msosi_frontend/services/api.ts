import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// ─── Base URL ──────────────────────────────────────────────
// Dynamically resolve the IP address used by Expo to avoid manual IP mismatches!
const debuggerHost = Constants.expoConfig?.hostUri;
const detectedIp = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';
export const BASE_URL = `http://${detectedIp}:8000/api`;

console.log("Dynamically Resolved API URL:", BASE_URL);
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: attach JWT ───────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: auto-refresh on 401 ─────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = res.data.access;
        await SecureStore.setItemAsync('access_token', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — clear tokens
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    phone_number: string;
    is_customer?: boolean;
    is_restaurant_owner?: boolean;
  }) => api.post('/users/register/', data),

  login: (data: { username: string; password: string }) =>
    api.post('/users/login/', data),

  refreshToken: (refresh: string) =>
    api.post('/users/token/refresh/', { refresh }),

  getProfile: () => api.get('/users/profile/'),

  updateProfile: (data: Partial<{
    email: string;
    phone_number: string;
    address: string;
  }>) => api.put('/users/profile/', data),
};

// ─── Restaurants ────────────────────────────────────────────
export const restaurantsApi = {
  list: (params?: { page?: number; search?: string }) =>
    api.get('/restaurants/', { params }),

  detail: (id: number) => api.get(`/restaurants/${id}/`),

  menu: (restaurantId: number, params?: { page?: number }) =>
    api.get(`/restaurants/${restaurantId}/food/`, { params }),

  listFood: (params?: { search?: string }) => api.get('/restaurants/food/', { params }),

  getOwnerMenu: () => api.get('/restaurants/food/mine/'),

  createMenuItem: (data: FormData) => api.post('/restaurants/food/create/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  updateMenuItem: (id: number, data: FormData) => api.put(`/restaurants/food/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  toggleMenuItem: (id: number, isAvailable: boolean) => api.patch(`/restaurants/food/${id}/`, { is_available: isAvailable }),
  
  getFoodDetail: (id: number) => api.get(`/restaurants/food-items/${id}/`),
};

// ─── Orders ─────────────────────────────────────────────────
export const ordersApi = {
  list: (params?: { page?: number }) =>
    api.get('/orders/', { params }),

  create: (data: { 
    delivery_address: string; 
    total_price: string;
    items: Array<{ menu_item: number; quantity: number; price: string }>;
  }) => api.post('/orders/', data),

  detail: (id: number) => api.get(`/orders/${id}/`),

  addItem: (orderId: number, data: {
    menu_item: number;
    quantity: number;
    price: string;
  }) => api.post(`/orders/${orderId}/items/`, data),

  update: (id: number, data: Partial<{ status: string; delivery_address: string }>) =>
    api.put(`/orders/${id}/`, data),

  getIncomingOrders: () => api.get('/orders/restaurant/incoming/'),
  getAllOrders: () => api.get('/orders/restaurant/all/'),
  updateStatus: (id: number, status: string) => api.patch(`/orders/${id}/status/`, { status }),
};

// ─── Payments ───────────────────────────────────────────────
export const paymentsApi = {
  list: () => api.get('/payments/'),

  initiate: (orderId: number, paymentMethod: 'mpesa' | 'tigo_pesa' | 'airtel_money' | 'card') =>
    api.post(`/payments/${orderId}/pay/`, { payment_method: paymentMethod }),

  detail: (id: number) => api.get(`/payments/${id}/`),

  verify: (id: number) => api.post(`/payments/${id}/verify/`),

  refund: (id: number, data?: { amount?: number; reason?: string }) =>
    api.post(`/payments/${id}/refund/`, data),

  getEarnings: () => api.get('/payments/earnings/'),
  withdraw: (data: { amount: number; phone_number: string }) => api.post('/payments/withdraw/', data),
};
