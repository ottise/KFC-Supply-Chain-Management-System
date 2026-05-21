"use client";

import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import OdooDropdown from "@/components/common/OdooDropdown";
import type { Warehouse } from "@/types/warehouse/warehouse";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  onSearch: (val: string) => void;
  onAddClick?: () => void;
  onWarehouseFilter: (warehouseId: number | undefined) => void;
  onStatusFilter: (isActive: boolean | undefined) => void;
  initialStatus?: boolean;
  initialWarehouseId?: number;
}

export default function LocationFilter({
  onSearch,
  onAddClick,
  onWarehouseFilter,
  onStatusFilter,
  initialStatus,
  initialWarehouseId,
}: Props) {
  const { user } = useAuth();
  const locationManagerId = (user?.managerId && user.managerId !== "null")
    ? Number(user.managerId)
    : (user?.id ? Number(user.id) : undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const data = await warehouseApi.getWarehousesForCurrentUser();
        const filteredWarehouses = Array.isArray(data)
          ? data.filter((wh: Warehouse) =>
            typeof locationManagerId === "number" ? wh.ManagerId === locationManagerId : true
          )
          : [];
        setWarehouses(filteredWarehouses);
      } catch (error) {
        console.error("Lỗi khi tải danh sách kho:", error);
      }
    };
    fetchWarehouses();
  }, [locationManagerId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-8">
      {/* Search and Add Button */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 flex gap-4 max-w-2xl">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm vị trí..."
              className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={() => onSearch(searchTerm)}
            className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0"
          >
            Tìm kiếm
          </button>
        </div>

        <button
          onClick={onAddClick}
          className="px-8 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
        >
          <Plus className="w-4 h-4" />
          Thêm vị trí
        </button>
      </div>

      {/* Filters (Warehouse and Status) */}
      <div className="flex flex-wrap gap-6 items-start border-t border-gray-100 pt-4">
        {/* Warehouse Filter */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Kho:</label>
          <OdooDropdown<Warehouse>
            items={warehouses}
            value={warehouses.find((wh) => wh.Id === initialWarehouseId) || null}
            onChange={(item) => onWarehouseFilter(item?.Id ? Number(item.Id) : undefined)}
            displayField="Name"
            placeholder="TẤT CẢ KHO"
            className="w-full sm:w-[260px]"
            portal
          />
        </div>

        {/* Status Filter */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Trạng thái:</label>
          <OdooDropdown<{ label: string; value?: boolean }>
            items={[
              { label: "TẤT CẢ TRẠNG THÁI", value: undefined },
              { label: "HOẠT ĐỘNG", value: true },
              { label: "NGỪNG HOẠT ĐỘNG", value: false },
            ]}
            value={
              [
                { label: "TẤT CẢ TRẠNG THÁI", value: undefined },
                { label: "HOẠT ĐỘNG", value: true },
                { label: "NGỪNG HOẠT ĐỘNG", value: false },
              ].find((s) => s.value === initialStatus) || { label: "TẤT CẢ TRẠNG THÁI", value: undefined }
            }
            onChange={(item) => onStatusFilter(item?.value)}
            displayField="label"
            placeholder="TẤT CẢ TRẠNG THÁI"
            className="w-full sm:w-[240px]"
            portal
          />
        </div>
      </div>
    </div>
  );
}
