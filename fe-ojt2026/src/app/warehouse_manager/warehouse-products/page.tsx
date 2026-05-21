"use client";

import { useState } from "react";
import { useAuthContext } from '@/lib/contexts/AuthContext';
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { FullScreenLoader } from "@/components/ui/LoadingSpinner";
import WarehouseProductDashboard from "@/components/warehouse_manager/warehouse-products/WarehouseProductDashboard";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";

export default function WarehouseProductsPage() {
    const { isLoading, isAuthReady } = useAuthContext();
    const { isCollapsed } = useSidebarContext();
    const [totalItems, setTotalItems] = useState(0);

    if (!isAuthReady || isLoading) {
        return <FullScreenLoader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter']">
            <WarehouseNavbar />
            <div className="flex">
                <WarehouseSidebar activePage="warehouse-products" />
                <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-6">
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                                        Sản Phẩm <span className="text-[#E4002B]">Trong Kho</span>
                                    </h1>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                                        Quản lý sản phẩm đã thêm vào kho    
                                    </p>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center bg-white py-3 px-8 rounded-full shadow-sm border border-gray-100">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Tổng: {totalItems} sản phẩm
                                </span>
                            </div>
                        </div>

                        <WarehouseProductDashboard onTotalUpdate={setTotalItems} />

                    </div>
                </main>
            </div>
        </div>
    );
}
