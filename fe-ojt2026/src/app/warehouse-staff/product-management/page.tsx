"use client";

import { useState } from "react";
import WarehouseStaffNavbar from "@/components/warehouse_staff/layout/WarehouseStaffNavbar";
import WarehouseStaffSidebar from "@/components/warehouse_staff/layout/WarehouseStaffSidebar";
import ProductDashboard from "@/components/warehouse_staff/product/ProductDashboard";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";

export default function ProductManagementPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { isCollapsed } = useSidebarContext();

    return (
        <div className="bg-gray-50 font-['Inter']">
            <WarehouseStaffNavbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} isMobileMenuOpen={mobileMenuOpen} />

            <div className="flex">
                <WarehouseStaffSidebar
                    activePage="product-management"
                    isMobileOpen={mobileMenuOpen}
                    onMobileClose={() => setMobileMenuOpen(false)}
                />

                <main className={`flex-1 transition-all duration-500 pt-25 p-8 ${isCollapsed ? "ml-20" : "ml-64"}`}>
                    <div className="max-w-[1600px] mx-auto">
                        <ProductDashboard />
                    </div>
                </main>
            </div>
        </div>
    );
}
