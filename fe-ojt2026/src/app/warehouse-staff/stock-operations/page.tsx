"use client";

import { useState } from "react";
import WarehouseStaffNavbar from "@/components/warehouse_staff/layout/WarehouseStaffNavbar";
import WarehouseStaffSidebar from "@/components/warehouse_staff/layout/WarehouseStaffSidebar";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import StockOperationsDashboard from "@/components/warehouse_staff/stock-operations/StockOperationsDashboard";


export default function StockOperationsPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isCollapsed } = useSidebarContext();

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter']">
            <WarehouseStaffNavbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} isMobileMenuOpen={mobileMenuOpen} />

            <div className="flex">
                <WarehouseStaffSidebar
                    activePage="stock-operations"
                    isMobileOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />

                <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                                    Quản lý <span className="text-[#E4002B]">Xuất Kho</span>
                                </h1>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                                    Hệ thống phân tích dữ liệu KFC
                                </p>
                            </div>
                        </div>

                        <StockOperationsDashboard />
                    </div>
                </main>
            </div>
        </div>
    );
}
