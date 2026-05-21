"use client";
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import HumanResourceDashboard from "@/components/warehouse_manager/human_resourse/HumanResourceDashboard";
export default function HRManagementPage() {
  const { isCollapsed } = useSidebarContext();
  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <WarehouseNavbar />
      <div className="flex">
        <WarehouseSidebar activePage="hr-management" />
        <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="max-w-[1600px] mx-auto">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                Danh sách <span className="text-[#E4002B]">Nhân viên</span>
              </h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                Quản lý thông tin nhân sự kho hàng
              </p>
            </div>
            <HumanResourceDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}