"use client";
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import VendorDashboard from "@/components/warehouse_manager/vendor/VendorDashboard";
export default function VendorPage() {
  const { isCollapsed } = useSidebarContext();
  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <WarehouseNavbar />
      <div className="flex">
        {/* Giả sử bạn thêm activePage="vendor" vào Sidebar sau */}
        <WarehouseSidebar activePage="vendor-management" />
        <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                  Nhà <span className="text-[#E4002B]">Cung ứng</span>
                </h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                  Quản lý danh mục nhà cung cấp nguyên liệu hệ thống
                </p>
              </div>
            </div>
            <VendorDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}