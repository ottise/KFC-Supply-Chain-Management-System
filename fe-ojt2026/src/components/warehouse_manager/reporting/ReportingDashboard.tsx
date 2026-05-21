"use client";

import { useState, useEffect } from "react";
import InventoryChart from "./InventoryChart";
import StockDistribution from "./StockDistribution";
import LowStockTable from "./LowStockTable";
import ReportFilter from "./ReportFilter";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";

interface Warehouse {
  Id: number;
  Name: string;
}

export default function ReportingDashboard() {
  const [dateRange, setDateRange] = useState("7");
  const [customDates, setCustomDates] = useState<{ start: string; end: string } | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await warehouseApi.getWarehousesForCurrentUser();
        const list = Array.isArray(data) ? data : (data?.Items || []);
        setWarehouses(list);
      } catch (err) {
        console.error("Failed to fetch warehouses for reporting:", err);
      }
    };
    fetchWarehouses();
  }, []);

  const handleFilterChange = (range: string, dates?: { start: string; end: string }) => {
    setDateRange(range);
    if (dates) {
      setCustomDates(dates);
    } else {
      setCustomDates(null);
    }
  };

  const handleWarehouseChange = (id: number | undefined) => {
    setSelectedWarehouseId(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ReportFilter
        onFilterChange={handleFilterChange}
        onWarehouseChange={handleWarehouseChange}
        currentRange={dateRange}
        selectedWarehouseId={selectedWarehouseId}
        warehouses={warehouses}
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
              <h3 className="font-black uppercase text-[14px] tracking-widest text-[#1e293b]">Xu hướng xuất nhập</h3>
            </div>
            <div className="flex gap-6 bg-gray-50 px-5 py-2.5 rounded-xl border">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nhập kho</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#E4002B]"></div>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Xuất kho</span>
              </div>
            </div>
          </div>
          <div className="h-[320px]">
            <InventoryChart dateRange={dateRange} customDates={customDates} warehouseId={selectedWarehouseId} />
          </div>
        </div>
        <div className="xl:col-span-5">
          <StockDistribution warehouseId={selectedWarehouseId} />
        </div>
      </div>

      <div className="grid grid-cols-1">
        <LowStockTable warehouseId={selectedWarehouseId} />
      </div>
    </div>
  );
}