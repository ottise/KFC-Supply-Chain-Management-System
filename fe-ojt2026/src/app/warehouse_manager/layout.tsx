"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { hasRequiredRole, getRedirectPath } from "@/lib/utils/authUtils";
import { PROTECTED_ROUTES, type UserRole } from "@/types/auth";

export default function WarehouseManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, isAuthReady } = useAuthContext();

  const allowedRoles = useMemo<UserRole[]>(
    () => PROTECTED_ROUTES["/warehouse_manager"],
    []
  );

  const role = user?.role as UserRole | undefined;
  const isAllowed = role ? hasRequiredRole(role, allowedRoles) : false;

  useEffect(() => {
    if (!isAuthReady || isLoading) return;

    // If not authenticated, let the existing login flow handle it.
    if (!isAuthenticated || !role) {
      router.replace("/sign_in");
      return;
    }

    if (!isAllowed) {
      router.replace(getRedirectPath(role));
    }
  }, [isAuthReady, isLoading, isAuthenticated, role, isAllowed, router]);

  if (!isAuthReady || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang xác thực...</p>
        </div>
      </div>
    );
  }

  // While redirecting, just render nothing to avoid flicker.
  if (!isAuthenticated || !role || !isAllowed) {
    return null;
  }

  return <>{children}</>;
}

