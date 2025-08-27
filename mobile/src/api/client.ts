import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('user');
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.client.defaults.headers.common['Authorization'];
    }
  }

  // Auth endpoints
  signIn(email: string, password: string) {
    return this.client.post('/auth/signin', { email, password });
  }

  signUp(email: string, password: string, name?: string) {
    return this.client.post('/auth/signup', { email, password, name });
  }

  signOut() {
    return this.client.post('/auth/signout');
  }

  resetPassword(email: string) {
    return this.client.post('/auth/reset-password', { email });
  }

  // Numbers endpoints
  getAvailableNumbers(country: string, areaCode?: string) {
    return this.client.get('/numbers/available', {
      params: { country, area_code: areaCode },
    });
  }

  getMyNumbers() {
    return this.client.get('/numbers/my-numbers');
  }

  getNumberDetails(number: string) {
    return this.client.get(`/numbers/${number}`);
  }

  // Purchase endpoints
  createCheckoutSession(items: any[]) {
    return this.client.post('/checkout/create-session', { items });
  }

  // CDR endpoints
  getCDRs(number: string, startDate?: string, endDate?: string) {
    return this.client.get('/cdr/fetch', {
      params: { number, start_date: startDate, end_date: endDate },
    });
  }

  getCDRStats(number: string) {
    return this.client.get('/cdr/stats', {
      params: { number },
    });
  }

  exportCDRs(number: string, format: 'csv' | 'pdf') {
    return this.client.get('/cdr/export', {
      params: { number, format },
      responseType: 'blob',
    });
  }

  // SMS endpoints
  getSMSHistory(number: string, startDate?: string, endDate?: string) {
    return this.client.get('/cdr/sms', {
      params: { number, start_date: startDate, end_date: endDate },
    });
  }

  getSMSConfig(number: string) {
    return this.client.get(`/sms-config/${number}`);
  }

  updateSMSConfig(number: string, config: any) {
    return this.client.put(`/sms-config/configure`, { number, ...config });
  }

  // User endpoints
  getUserProfile() {
    return this.client.get('/user/profile');
  }

  updateUserProfile(data: any) {
    return this.client.patch('/user/profile', data);
  }

  // Forwarding endpoints
  getForwardingConfig(number: string) {
    return this.client.get(`/forwarding/${number}`);
  }

  updateForwardingConfig(number: string, config: any) {
    return this.client.put(`/forwarding/configure`, { number, ...config });
  }

  // Generic methods for flexibility
  get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }
}

export const api = new ApiClient();