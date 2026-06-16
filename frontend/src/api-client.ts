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
 * API client wrapper with automatic 401 handling
 * Use this instead of direct fetch() for authenticated API calls
 */
export async function apiClient<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Automatically add auth token if available
  const token = localStorage.getItem(userTokenKey);
  const headers = new Headers(options.headers);
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // Handle 401 Unauthorized - auto logout
  if (response.status === 401) {
    console.warn('[Auth] Session expired or unauthorized - logging out automatically');
    
    // Trigger logout handler (will clear localStorage and update context)
    if (onUnauthorized) {
      onUnauthorized();
    }
    
    throw new Error('Session expired. Please login again.');
  }
  
  // Handle other error responses
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If response is not JSON, use default message
    }
    
    throw new Error(errorMessage);
  }
  
  // Return JSON response
  return response.json();
}

/**
 * Helper to create auth headers (for non-apiClient usage)
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
