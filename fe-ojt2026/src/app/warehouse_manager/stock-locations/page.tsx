"use client";
import { useAuthContext } from '@/lib/contexts/AuthContext';
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import { FullScreenLoader } from "@/components/ui/LoadingSpinner";
import LocationDashboard from "@/components/warehouse_manager/stock-location/LocationDashboard";
export default function StockLocationsPage() {
  const { isAuthReady, isLoading } = useAuthContext();
  const { isCollapsed } = useSidebarContext();
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
        <WarehouseSidebar activePage="location-management" />

        {/* Luồng nội dung chính: ml-64 để tránh bị Sidebar đè, pt-20 để tránh Navbar */}
        <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section đồng bộ với Product Management */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-6">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                    Quản Lý <span className="text-[#E4002B]">Vị Trí Kho</span>
                  </h1>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                    Danh sách các vị trí và khu vực lưu trữ trong kho
                  </p>
                </div>
              </div>
            </div>
            {/* Component Dashboard chứa Filter, Table, Pagination, Detail */}
            <LocationDashboard />
          </div>
        </main>
      </div>
    </div>
  );
}
