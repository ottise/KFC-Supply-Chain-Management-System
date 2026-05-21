"use client";

import WarehouseStaffNavbar from "@/components/warehouse_staff/layout/WarehouseStaffNavbar";
import WarehouseStaffSidebar from "@/components/warehouse_staff/layout/WarehouseStaffSidebar";
import { useState } from "react";
import ReplenishmentDashboard from "@/components/warehouse_staff/replenishment/ReplenishmentDashboard";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";

export default function ReplenishmentPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isCollapsed } = useSidebarContext();

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter']">
            <WarehouseStaffNavbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} isMobileMenuOpen={mobileMenuOpen} />

            <div className="flex">
                <WarehouseStaffSidebar
                    activePage="replenishment"
                    isMobileOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />

                <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                                    Bổ sung <span className="text-[#E4002B]">Hàng hóa</span>
                                </h1>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                                    Quản lý nhập kho & nguyên vật liệu KFC
                                </p>
                            </div>
                        </div>

                        <ReplenishmentDashboard />
                    </div>
                </main>
            </div>
        </div>
    );
}