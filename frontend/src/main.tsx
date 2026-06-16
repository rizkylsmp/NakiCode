import { StrictMode } from 'react';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initializeAnalytics } from './analytics';
import { setUnauthorizedHandler } from './api-client';
import { AuthProvider } from './auth-context';
import { CompareProvider } from './compare-context';
import { ErrorBoundary } from './ErrorBoundary';
import { registerServiceWorker } from './pwa';
import { userTokenKey, userUsernameKey, userRoleKey, userSessionEvent } from './user-session';
import './styles.css';

// Initialize Sentry (must be first)
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
  });
  console.log('Sentry error monitoring enabled');
}

// Setup global 401 handler - auto logout when session expires
setUnauthorizedHandler(() => {
  console.log('[Auth] Auto-logout triggered by 401 response');
  
  // Clear auth state from localStorage
  window.localStorage.removeItem(userTokenKey);
  window.localStorage.removeItem(userUsernameKey);
  window.localStorage.removeItem(userRoleKey);
  
  // Trigger auth context refresh
  window.dispatchEvent(new Event(userSessionEvent));
  
  // Redirect to login with message
  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    window.location.href = `/login?expired=true&next=${encodeURIComponent(currentPath)}`;
  }
});

initializeAnalytics();
registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <BrowserRouter>
            <AuthProvider>
              <CompareProvider>
                <App />
              </CompareProvider>
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
