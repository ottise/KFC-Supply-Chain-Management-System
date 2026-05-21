"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import { FullScreenLoader } from '@/components/ui/LoadingSpinner';

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

// Prevent multiple redirects in same session
let _redirectInProgress = false;

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, isAuthReady, user, logout } = useAuthContext();
  const isForcingAdmin = useRef(false);
  const hasLoggedUnauthorized = useRef(false);

  // Check if user is admin role
  const isAdmin = user?.role === 'admin';

  // Force admin to stay on admin routes
  const handleAdminBoundary = useCallback(() => {
    // Only force if authenticated and is admin
    if (!isAuthenticated || !isAdmin) return;

    // If pathname doesn't start with /admin, redirect back
    if (!pathname.startsWith('/admin')) {
      isForcingAdmin.current = true;
      router.replace('/admin');
      return true;
    }

    return false;
  }, [isAuthenticated, isAdmin, pathname, router]);

  useEffect(() => {
    // Wait for auth to be ready
    if (!isAuthReady) return;

    // Not authenticated → redirect to sign in (only once)
    if (!isAuthenticated) {
      if (!_redirectInProgress) {
        _redirectInProgress = true;
        router.push('/sign_in?redirect=' + encodeURIComponent(pathname));
      }
      return;
    }

    // Authenticated but not admin → redirect to home (only once)
    if (!isAdmin && !hasLoggedUnauthorized.current) {
      hasLoggedUnauthorized.current = true;
      logout();
      if (!_redirectInProgress) {
        _redirectInProgress = true;
        router.push('/?reason=unauthorized');
      }
      return;
    }

    // Is admin but trying to leave admin routes → force back
    if (handleAdminBoundary()) return;

  }, [isAuthReady, isAuthenticated, isAdmin, pathname, router, logout, handleAdminBoundary]);

  // Show loading while checking auth
  if (!isAuthReady || isLoading) {
    return <FullScreenLoader />;
  }

  // Not authenticated or not admin - don't render children yet (redirect is happening)
  if (!isAuthenticated || !isAdmin) {
    return <FullScreenLoader />;
  }

  return <>{children}</>;
}
