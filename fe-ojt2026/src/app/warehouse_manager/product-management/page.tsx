"use client";
import { useState } from "react";
import { useAuthContext } from '@/lib/contexts/AuthContext';
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import { FullScreenLoader } from "@/components/ui/LoadingSpinner";
import ProductDashboard from "@/components/warehouse_manager/product/ProductDashboard";
export default function ProductManagementPage() {
  const { isAuthenticated, isLoading, isAuthReady } = useAuthContext();
  const { isCollapsed } = useSidebarContext();
  const [totalProducts, setTotalProducts] = useState(0);
  // Show loading while auth is initializing
  if (!isAuthReady || isLoading) {
    return <FullScreenLoader />;
  }
  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      {/* Navbar cố định phía trên */}
      <WarehouseNavbar />
      <div className="flex">
        {/* Sidebar cố định bên trái */}
        <WarehouseSidebar activePage="product-management" />
        {/* Luồng nội dung chính: ml-64 để tránh bị Sidebar đè, pt-20 để tránh Navbar */}
        <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section đồng bộ với Reporting Center */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    Quản Lý <span className="text-[#E4002B]">Sản Phẩm</span>
                  </h1>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                    Danh mục quy chuẩn nguyên liệu Master Data
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center bg-white py-3 px-8 rounded-full shadow-sm border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Tổng: {totalProducts} sản phẩm
                </span>
              </div>
            </div>
            {/* Component Dashboard chứa Filter và Table đã làm ở bước trước */}
            <ProductDashboard onTotalUpdate={setTotalProducts} />
          </div>
        </main>
      </div>
    </div>
  );
}
