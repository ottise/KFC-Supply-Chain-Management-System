import { jwtDecode } from 'jwt-decode';
import type { JwtPayload, UserInfo, UserRole } from '@/types/auth';

interface ResolveAuthUserSources {
  storedUser?: UserInfo | null;
  tokenUser?: UserInfo | null;
  loginUser?: UserInfo | null;
  profileUser?: UserInfo | null;
}

// Token storage keys for localStorage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';
const RESET_TOKEN_KEY = 'reset_token';

// Decode JWT token and extract user info
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

export function normalizeUserRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') return null;

  const trimmedRole = role.trim();
  if (!trimmedRole) return null;

  const roleKey = trimmedRole
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const canonicalRoles: Record<string, UserRole> = {
    admin: 'admin',
    administrator: 'admin',
    system_admin: 'admin',
    system_administrator: 'admin',
    manager: 'Manager',
    warehouse_manager: 'warehouse_manager',
    warehousemanager: 'warehouse_manager',
    staff: 'Staff',
    warehouse_staff: 'warehouse_staff',
    warehousestaff: 'warehouse_staff',
  };

  return canonicalRoles[roleKey] ?? null;
}

export function normalizeUserInfo(user: UserInfo | null | undefined): UserInfo | null {
  if (!user) return null;

  const normalizedRole = normalizeUserRole(user.role);
  if (!normalizedRole) return null;

  return {
    ...user,
    role: normalizedRole,
  };
}

// Redirect-critical precedence: fetched profile > login response > decoded token > stored user.
export function resolveAuthoritativeUser({
  storedUser,
  tokenUser,
  loginUser,
  profileUser,
}: ResolveAuthUserSources): UserInfo | null {
  const sources = [storedUser, tokenUser, loginUser, profileUser];

  return sources.reduce<UserInfo | null>((resolvedUser, sourceUser) => {
    const normalizedSource = normalizeUserInfo(sourceUser);
    if (!normalizedSource) {
      return resolvedUser;
    }

    if (!resolvedUser) {
      return normalizedSource;
    }

    return {
      ...resolvedUser,
      ...normalizedSource,
    };
  }, null);
}

// Extract user info from token
export function getUserFromToken(token: string): UserInfo | null {
  const payload = decodeToken(token);
  if (!payload) return null;

  const normalizedRole = normalizeUserRole(payload.role);
  if (!normalizedRole) return null;

  const email = payload.email || '';
  return {
    id: payload.sub,
    username: (payload.username as string) || email.split('@')[0],
    email: email,
    role: normalizedRole,
    managerId: (payload.managerId as string) || (payload.ManagerId as string) || null,
  };
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;

  return payload.exp * 1000 < Date.now();
}

// Store token in localStorage
export function storeToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

// Get stored token from localStorage
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Remove token from localStorage
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Store user info in localStorage
export function storeUserInfo(user: UserInfo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// Get stored user info from localStorage
export function getStoredUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Remove user info from localStorage
export function removeUserInfo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
}

// Clear all auth data
export function clearAuthData(): void {
  removeToken();
  removeUserInfo();
}

// Get redirect path based on user role
export function getRedirectPath(role: unknown): string {
  const normalizedRole = normalizeUserRole(role);
  if (!normalizedRole) {
    return '/sign_in';
  }

  const routes: Record<UserRole, string> = {
    warehouse_staff: '/warehouse-staff/replenishment',
    warehouse_manager: '/warehouse_manager',
    admin: '/admin',
    Manager: '/warehouse_manager',
    Staff: '/warehouse-staff/replenishment',
  };
  return routes[normalizedRole] || '/sign_in';
}

// Check if user has required role for route
export function hasRequiredRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Store reset token in sessionStorage (more secure - cleared on browser close)
export function storeResetToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RESET_TOKEN_KEY, token);
}

// Get reset token from sessionStorage
export function getResetToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(RESET_TOKEN_KEY);
}

// Remove reset token from sessionStorage
export function removeResetToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RESET_TOKEN_KEY);
}
