"use client";

import { useState } from "react";
import WarehouseNavbar from "@/components/warehouse_manager/layout/WarehouseNavbar";
import WarehouseSidebar from "@/components/warehouse_manager/layout/WarehouseSidebar";
import { useSidebarContext } from "@/lib/contexts/SidebarContext";
import ReportingDashboard from "@/components/warehouse_manager/reporting/ReportingDashboard";
import StockLocationReport from "@/components/warehouse_manager/reporting/StockLocationReport";
import MoveHistoryReport from "@/components/warehouse_manager/reporting/MoveHistoryReport";

type ReportTab = "overview" | "locations" | "moves";

export default function ReportingPage() {
  const { isCollapsed } = useSidebarContext();
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");

  return (
    <div className="min-h-screen bg-gray-50 font-['Inter']">
      <WarehouseNavbar />

      <div className="flex">
        <WarehouseSidebar
          activePage="reporting"
        />
        <main
          className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"
            }`}
        >
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                  Trung Tâm<span className="text-[#E4002B]"> Báo Cáo</span>
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${activeTab === "overview" ? "bg-gray-900 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600 hover:-translate-y-0.5"}`}
                  >
                    Kho tổng
                  </button>
                  <button
                    onClick={() => setActiveTab("locations")}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${activeTab === "locations" ? "bg-gray-900 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600 hover:-translate-y-0.5"}`}
                  >
                    Tồn kho
                  </button>
                  <button
                    onClick={() => setActiveTab("moves")}
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all duration-200 active:scale-95 ${activeTab === "moves" ? "bg-gray-900 text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600 hover:-translate-y-0.5"}`}
                  >
                    Lịch sử dịch chuyển
                  </button>
                </div>
              </div>
            </div>
            {activeTab === "overview" && <ReportingDashboard />}
            {activeTab === "locations" && <StockLocationReport />}
            {activeTab === "moves" && <MoveHistoryReport />}
          </div>
        </main>
      </div>
    </div>
  );
}
