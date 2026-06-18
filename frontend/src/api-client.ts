import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { userTokenKey } from "./user-session";

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
  baseURL: import.meta.env.VITE_API_URL || "",
  timeout: 30000, // 30 seconds
  headers: {
    Accept: "application/json",
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
  },
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
      console.warn(
        "[Auth] Session expired or unauthorized - logging out automatically",
      );

      // Trigger logout handler (will clear localStorage and update context)
      if (onUnauthorized) {
        onUnauthorized();
      }

      return Promise.reject(error);
    }

    // Handle other error responses
    let errorMessage = `HTTP ${error.response?.status || "Unknown"}: ${
      error.message
    }`;

    if (error.response?.data && typeof error.response.data === "object") {
      const data = error.response.data as { message?: unknown };
      if (typeof data.message === "string") {
        errorMessage = data.message;
      }
    }

    error.message = errorMessage;

    return Promise.reject(error);
  },
);

/**
 * Get the API base URL from environment variables
 * Used for fetch calls that don't use the axios api-client
 */
export function getApiUrl(path: string = "") {
  const baseURL = import.meta.env.VITE_API_URL || "";
  
  if (!path) {
    return baseURL;
  }
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Remove trailing slash from baseURL if present
  const cleanBaseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
  
  return `${cleanBaseURL}/${cleanPath}`;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan koneksi API.",
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;

      if (typeof message === "string") {
        return message;
      }
    }

    return error.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export function getApiErrorStatus(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

export function getApiErrorData<ResponseData>(error: unknown) {
  return axios.isAxiosError(error)
    ? (error.response?.data as ResponseData | undefined)
    : undefined;
}

export async function apiGet<ResponseData>(
  url: string,
  config?: AxiosRequestConfig,
) {
  const response = await apiClient.get<ResponseData>(url, config);

  return response.data;
}

export async function apiPost<ResponseData, RequestData = unknown>(
  url: string,
  data?: RequestData,
  config?: AxiosRequestConfig<RequestData>,
) {
  const response = await apiClient.post<ResponseData>(url, data, config);

  return response.data;
}

export async function apiPut<ResponseData, RequestData = unknown>(
  url: string,
  data?: RequestData,
  config?: AxiosRequestConfig<RequestData>,
) {
  const response = await apiClient.put<ResponseData>(url, data, config);

  return response.data;
}

export async function apiPatch<ResponseData, RequestData = unknown>(
  url: string,
  data?: RequestData,
  config?: AxiosRequestConfig<RequestData>,
) {
  const response = await apiClient.patch<ResponseData>(url, data, config);

  return response.data;
}

export async function apiDelete<ResponseData = void>(
  url: string,
  config?: AxiosRequestConfig,
) {
  const response = await apiClient.delete<ResponseData>(url, config);

  return response.data;
}

export async function apiUpload<ResponseData>(
  url: string,
  formData: FormData,
  config?: AxiosRequestConfig<FormData>,
) {
  const response = await apiClient.post<ResponseData>(url, formData, {
    ...config,
    headers: {
      ...config?.headers,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

// Export the configured axios instance as default
export default apiClient;
