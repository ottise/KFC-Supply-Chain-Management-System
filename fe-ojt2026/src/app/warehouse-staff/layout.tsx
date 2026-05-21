"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { hasRequiredRole, getRedirectPath } from "@/lib/utils/authUtils";
import { PROTECTED_ROUTES, type UserRole } from "@/types/auth";

export default function WarehouseStaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, isAuthReady } = useAuthContext();

  const allowedRoles = useMemo<UserRole[]>(
    () => PROTECTED_ROUTES["/warehouse-staff"],
    []
  );

  const role = user?.role as UserRole | undefined;
  const isAllowed = role ? hasRequiredRole(role, allowedRoles) : false;

  // Check if user has managerId assigned
  const hasManagerId = useMemo(() => {
    // admin bypasses this check
    if (role === "admin") return true;

    // Check managerId - can be null, undefined, or string "null"/"undefined"
    const managerId = user?.managerId;
    if (managerId === null || managerId === undefined) return false;
    if (typeof managerId === "string" && (managerId === "null" || managerId === "undefined" || managerId === "")) return false;
    return true;
  }, [user?.managerId, role]);

  // Pages that are allowed even without managerId
  const allowedWithoutManagerId = ["/warehouse-staff/profile", "/warehouse-staff/pending-assignment"];

  useEffect(() => {
    if (!isAuthReady || isLoading) return;

    if (!isAuthenticated || !role) {
      router.replace("/sign_in");
      return;
    }

    if (!isAllowed) {
      router.replace(getRedirectPath(role));
      return;
    }

    // Check managerId - redirect to pending-assignment if missing
    if (!hasManagerId && !allowedWithoutManagerId.some(path => pathname.startsWith(path))) {
      router.replace("/warehouse-staff/pending-assignment");
    }
  }, [isAuthReady, isLoading, isAuthenticated, role, isAllowed, router, pathname, hasManagerId]);

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

  if (!isAuthenticated || !role || !isAllowed) {
    return null;
  }

  // If no managerId and trying to access restricted pages, show loading while redirecting
  if (!hasManagerId && !allowedWithoutManagerId.some(path => pathname.startsWith(path))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

