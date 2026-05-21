'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { UserInfo, AuthState, LoginRequest } from '@/types/auth';
import { authService } from '@/lib/api/authApi';
import {
  getStoredToken,
  getStoredUserInfo,
  storeUserInfo,
  clearAuthData,
  isTokenExpired,
  getUserFromToken,
  resolveAuthoritativeUser,
} from '@/lib/utils/authUtils';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<UserInfo>;
  logout: () => Promise<void>;
  refreshUser: () => void;
  updateUser: (updates: Partial<UserInfo>) => void;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    isAuthReady: false,
  });

  const isEmailVerified = state.user?.isEmailVerified ?? true;

  // Initialize auth state from localStorage
  const initializeAuth = useCallback(async () => {
    try {
      const token = getStoredToken();
      if (!token || isTokenExpired(token)) {
        clearAuthData();
        setState(prev => ({ ...prev, isLoading: false, isAuthReady: true, user: null, token: null, isAuthenticated: false }));
        return;
      }

      // Use stored user temporarily if available to avoid flicker
      const storedUser = getStoredUserInfo();
      const tokenUser = getUserFromToken(token);
      const bootstrapUser = resolveAuthoritativeUser({
        storedUser,
        tokenUser,
      });

      if (bootstrapUser) {
        setState(prev => ({ ...prev, user: bootstrapUser, isAuthenticated: true, token }));
      }

      // Fetch latest profile info to be sure we have everything
      const profileUser = await authService.getCurrentProfile();
      const fullUser = resolveAuthoritativeUser({
        storedUser,
        tokenUser,
        profileUser,
      });

      if (!fullUser) {
        throw new Error('Could not resolve authenticated user during bootstrap');
      }

      // The profile API reads from JWT claims (stale after profile updates),
      // so prefer localStorage values for user-editable fields (fullname, phone)
      if (storedUser?.fullname) fullUser.fullname = storedUser.fullname;
      if (storedUser?.phone) fullUser.phone = storedUser.phone;
      
      setState({
        user: fullUser,
        token,
        isAuthenticated: true,
        isLoading: false,
        isAuthReady: true,
      });
      storeUserInfo(fullUser);
    } catch (error: unknown) {
      console.error('Initialize Auth Error:', error);

      // Check if this is a 401 during maintenance mode
      // If so, don't clear auth state - let admin access admin pages during maintenance
      const axiosError = error as { response?: { status?: number } };
      const is401Error = axiosError.response?.status === 401;
      const hasMaintenanceToken = typeof window !== 'undefined' &&
        sessionStorage.getItem('maintenanceInfo');

      if (is401Error && hasMaintenanceToken) {
        // Maintenance mode is active and user had a token - don't logout
        // Keep the stored user info so admin can still access admin pages
        const storedUser = getStoredUserInfo();
        const storedToken = getStoredToken();

        if (storedUser && storedToken) {
          console.warn('[AuthContext] 401 during maintenance - keeping admin logged in');
          setState({
            user: storedUser,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
            isAuthReady: true,
          });
          return;
        }
      }

      // If fetching profile fails, it might be due to 401
      // Interceptor will handle the redirect, but let's clear state here too
      clearAuthData();
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isAuthReady: true,
      });
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Auto-logout polling - check token expiration every 30 seconds
  useEffect(() => {
    if (!state.isAuthReady || !state.isAuthenticated) {
      return;
    }

    const checkTokenExpiration = () => {
      const token = getStoredToken();
      if (!token || isTokenExpired(token)) {
        // Token expired or missing - logout immediately
        clearAuthData();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          isAuthReady: true,
        });
        router.push('/sign_in?reason=session_expired');
      }
    };

    // Check immediately on mount
    checkTokenExpiration();

    // Set up polling interval
    const intervalId = setInterval(checkTokenExpiration, 30000); // 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [state.isAuthReady, state.isAuthenticated, router]);

  // Login function
  const login = useCallback(async (credentials: LoginRequest): Promise<UserInfo> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authService.login(credentials);
      const tokenUser = getUserFromToken(response.token);

      let user = resolveAuthoritativeUser({
        tokenUser,
        loginUser: response.user,
      });

      if (!user) {
        throw new Error('Không thể lấy thông tin người dùng');
      }

      try {
        const profileUser = await authService.getCurrentProfile();
        const resolvedProfileUser = resolveAuthoritativeUser({
          tokenUser,
          loginUser: response.user,
          profileUser,
        });

        if (resolvedProfileUser) {
          user = resolvedProfileUser;
        }
      } catch (profileError) {
        console.warn('Could not fetch full profile info, using login data', profileError);
      }

      // Store email in localStorage if not verified (for verification flow)
      if (user.isEmailVerified === false && user.email) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('pending_verification_email', user.email);
        }

        // Update state but will redirect to verify-email
        setState({
          user,
          token: response.token,
          isAuthenticated: true,
          isLoading: false,
          isAuthReady: true,
        });

        return user;
      }
      // Update state immediately with user
      setState({
        user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        isAuthReady: true,
      });

      storeUserInfo(user);

      // Clear maintenance banner dismissed flag on successful login
      if (user?.id) {
        localStorage.removeItem(`maintBannerDismissed_${user.id}`);
      }

      return user;
    } catch (error) {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isAuthReady: true,
      });
      throw error;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Silently handle logout errors
    } finally {
      clearAuthData();

      // Clear all maintenance banner dismissed flags
      Object.keys(localStorage)
        .filter((k) => k.startsWith("maintBannerDismissed_"))
        .forEach((k) => localStorage.removeItem(k));

      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        isAuthReady: true,
      });
      router.push('/');
    }
  }, [router]);

  // Refresh user data
  const refreshUser = useCallback(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Update local user state
  const updateUser = useCallback((updates: Partial<UserInfo>) => {
    setState(prev => {
      if (!prev.user) return prev;
      const newUser = { ...prev.user, ...updates };
      storeUserInfo(newUser);
      return { ...prev, user: newUser };
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshUser,
        updateUser,
        isEmailVerified,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
