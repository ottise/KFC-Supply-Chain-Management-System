"use client";

import React, { useState } from "react";
import { Search, Plus } from "lucide-react";
import OdooDropdown from "@/components/common/OdooDropdown";

interface Props {
  onSearch: (val: string) => void;
  onAddClick?: () => void;
  onStatusFilter: (isActive: boolean | undefined) => void;
  initialStatus?: boolean;
}

export default function WarehouseFilter({
  onSearch,
  onAddClick,
  onStatusFilter,
  initialStatus,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch(searchTerm);
    }
  };

  const statusOptions = [
    { label: "TẤT CẢ TRẠNG THÁI", value: undefined },
    { label: "HOẠT ĐỘNG", value: true },
    { label: "NGỪNG HOẠT ĐỘNG", value: false },
  ];

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
              placeholder="Tìm kiếm kho..."
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
          Thêm kho
        </button>
      </div>

      {/* Filters (Status) */}
      <div className="flex flex-wrap gap-6 items-center border-t border-gray-100 pt-4">
        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
            Trạng thái:
          </label>
          <OdooDropdown<{ label: string; value?: boolean }>
            items={statusOptions}
            value={
              statusOptions.find((s) => s.value === initialStatus) ||
              statusOptions[0]
            }
            onChange={(item) => onStatusFilter(item?.value)}
            displayField="label"
            placeholder="TẤT CẢ TRẠNG THÁI"
            className="w-full min-w-[220px]"
            portal
          />
        </div>
      </div>
    </div>
  );
}
