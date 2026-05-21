"use client";

import { useState } from "react";
import { useAuthContext } from '@/lib/contexts/AuthContext';
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { FullScreenLoader } from "@/components/ui/LoadingSpinner";
import { useSidebarContext } from '@/lib/contexts/SidebarContext';
// Import đúng Component Dashboard của Số Lô
import { ProductLotDashboard } from "@/components/warehouse_manager/product_lot/ProductLotDashboard";

export default function ProductLotManagementPage() {
    const { isLoading, isAuthReady } = useAuthContext();
    const { isCollapsed } = useSidebarContext();
    const [totalLots, setTotalLots] = useState(0);

    // Hiển thị loader trong khi kiểm tra quyền truy cập
    if (!isAuthReady || isLoading) {
        return <FullScreenLoader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter']">
            {/* Navbar cố định phía trên */}
            <WarehouseNavbar />

            <div className="flex">
                {/* Sidebar bên trái - activePage phải khớp với ID trong Sidebar component */}
                <WarehouseSidebar
                    activePage="product-lot"
                />

                {/* Nội dung chính: ml-20 hoặc ml-64 tùy trạng thái Sidebar */}
                <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Header Section đồng bộ style với Product Management */}
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                                        Quản Lý <span className="text-[#E4002B]">Lô</span>
                                    </h1>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                                        Kiểm soát truy xuất nguồn gốc và hạn sử dụng
                                    </p>
                                </div>
                            </div>

                            {/* Badge hiển thị tổng số lượng số lô */}
                            <div className="hidden md:flex items-center bg-white py-3 px-8 rounded-full shadow-sm border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Tổng: {totalLots} số lô
                                </span>
                            </div>
                        </div>

                        {/* Dashboard thực tế của Số Lô */}
                        <ProductLotDashboard onTotalUpdate={setTotalLots} />

                    </div>
                </main>
            </div>
        </div>
    );
}