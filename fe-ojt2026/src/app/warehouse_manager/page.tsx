"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WarehouseManagerIndexPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to product-management as default landing page
    router.replace("/warehouse_manager/reporting");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
