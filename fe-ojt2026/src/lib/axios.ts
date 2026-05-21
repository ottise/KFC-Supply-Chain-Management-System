import axios from 'axios';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _DISABLE_AUTO_REDIRECT_ON_401 = false; // Reserved for future use

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  timeout: 10000,
  // withCredentials: true,  // DISABLED - causes CORS issue with Ocelot
  // App uses localStorage for tokens (not cookies), so no need for withCredentials
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - auto attach token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 503 Service Unavailable - redirect to maintenance page
    if (error.response?.status === 503) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;

        // If user is on an admin route, don't redirect to maintenance page
        // Admin users need to access admin pages even when maintenance mode is active
        if (currentPath.startsWith('/admin')) {
          // Store maintenance info for display on admin pages
          const maintenanceData = error.response?.data;
          if (maintenanceData) {
            sessionStorage.setItem('maintenanceInfo', JSON.stringify(maintenanceData));
          }
          console.warn('[AXIOS 503] Admin user on admin route - not redirecting to maintenance page');
          return Promise.reject(error);
        }

        // For non-admin routes, redirect to maintenance page
        const maintenanceData = error.response?.data;
        if (maintenanceData) {
          sessionStorage.setItem('maintenanceInfo', JSON.stringify(maintenanceData));
        }
        window.location.href = '/maintenance';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      console.error('[AXIOS 401 DEBUG] URL:', error.config?.url);
      console.error('[AXIOS 401 DEBUG] Method:', error.config?.method);
      console.error('[AXIOS 401 DEBUG] Full URL:', error.config?.baseURL + error.config?.url);
      console.error('[AXIOS 401 DEBUG] Token present:', !!localStorage.getItem('auth_token'));
      console.error('[AXIOS 401 DEBUG] Response data:', error.response?.data);

      // Only redirect to login if there was a token that's now expired
      // This prevents refresh during initial login attempts with wrong credentials
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        const currentPath = window.location.pathname;

        // If user is on an admin route AND has a token, don't redirect to sign_in on 401
        // Admin users need to access admin pages even when maintenance mode is active
        // The token might have been invalidated due to maintenance mode
        // Let the admin page handle the error and show maintenance info from sessionStorage
        if (token && currentPath.startsWith('/admin')) {
          console.warn('[AXIOS 401] Admin user on admin route - not redirecting to sign_in, propagating error');
          return Promise.reject(error);
        }

        // For non-admin routes, proceed with normal redirect
        // Only redirect if request actually used a token (protected API calls)
        // Login endpoint doesn't use existing token, so 401 there = wrong credentials, not session_expired
        if (token && error.config?.headers?.Authorization) {
          // User was authenticated but token expired - clear and redirect
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_info');
          window.location.href = '/sign_in?reason=session_expired';
        }
        // If no token was used in the request, let the error propagate normally (wrong password case)
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
