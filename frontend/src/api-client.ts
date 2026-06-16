import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { userTokenKey } from './user-session';

/**
 * Global 401 handler - triggers logout when session expires
 * This function is called by the API client when a 401 response is received
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

/**
 * Axios instance with automatic base URL and auth token injection
 * All API calls should use this instance for consistent behavior
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - automatically inject auth token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(userTokenKey);
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handle 401 Unauthorized globally
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - auto logout
    if (error.response?.status === 401) {
      console.warn('[Auth] Session expired or unauthorized - logging out automatically');
      
      // Trigger logout handler (will clear localStorage and update context)
      if (onUnauthorized) {
        onUnauthorized();
      }
      
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    // Handle other error responses
    let errorMessage = `HTTP ${error.response?.status || 'Unknown'}: ${error.message}`;
    
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as any;
      if (data.message) {
        errorMessage = data.message;
      }
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

/**
 * Helper to create auth headers (for non-apiClient usage like FormData uploads)
 */
export function createAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(userTokenKey);
  
  if (!token) {
    return {};
  }
  
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Helper to construct full API URL from relative path
 * Use this for direct fetch() calls that can't use axios instance
 */
export function getApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
}

// Export the configured axios instance as default
export default apiClient;
