"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/contexts/AuthContext";

export default function WarehouseStaffHomePage() {
  const router = useRouter();
  const { user, isAuthReady, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isAuthReady || isLoading) return;

    // Check if user has managerId
    const managerId = user?.managerId;
    const hasManagerId =
      managerId !== null &&
      managerId !== undefined &&
      !(typeof managerId === "string" && (managerId === "null" || managerId === "undefined" || managerId === ""));

    if (hasManagerId) {
      router.replace("/warehouse-staff/replenishment");
    } else {
      router.replace("/warehouse-staff/pending-assignment");
    }
  }, [isAuthReady, isLoading, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
