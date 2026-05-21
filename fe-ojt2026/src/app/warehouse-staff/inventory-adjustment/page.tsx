"use client";

import { useState } from "react";
import WarehouseStaffNavbar from "@/components/warehouse_staff/layout/WarehouseStaffNavbar";
import WarehouseStaffSidebar from "@/components/warehouse_staff/layout/WarehouseStaffSidebar";
import InventoryAdjustmentDashboard from "@/components/warehouse_staff/inventory_adjustment/InventoryAdjustmentDashboard";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";

export default function InventoryAdjustmentPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isCollapsed } = useSidebarContext();

    return (
        <div className="min-h-screen bg-gray-50 font-['Inter']">
            <WarehouseStaffNavbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} isMobileMenuOpen={mobileMenuOpen} />

            <div className="flex">
                <WarehouseStaffSidebar
                    activePage="inventory-adjustment"
                    isMobileOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />

                <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
                    <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <InventoryAdjustmentDashboard />
                    </div>
                </main>
            </div>
        </div>
    );
}
