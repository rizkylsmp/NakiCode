import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { AuthProvider } from './contexts/auth-context';
import { initializeAnalytics } from './services/analytics';
import { setUnauthorizedHandler } from './services/api-client';
import { registerServiceWorker } from './services/pwa';
import { userTokenKey, userUsernameKey, userRoleKey, userSessionEvent } from './utils/user-session';
import './styles.css';

// Initialize Sentry (must be first)
if (import.meta.env.VITE_SENTRY_DSN) {
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE || 'development',
      tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
    });
    console.log('Sentry error monitoring enabled');
  });
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
              <App />
            </AuthProvider>
          </BrowserRouter>
        </HelmetProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
