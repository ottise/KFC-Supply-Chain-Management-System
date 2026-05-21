"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { Location } from "@/types/warehouse/locations";
import { Warehouse } from "@/types/warehouse/warehouse";

import OdooSelect from "@/components/common/OdooSelect";
import OdooDropdown from "@/components/common/OdooDropdown";

interface FilterProps {
  onSearch: (val: string) => void;
  onWarehouseChange: (id: number | null) => void;
  onLocationChange: (id: number | null) => void;
  warehouses: Warehouse[];
  locations: Location[];
  selectedWarehouse: number | null;
  selectedLocation: number | null;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export default function AdjustmentFilter({
  onSearch,
  onWarehouseChange,
  onLocationChange,
  warehouses,
  locations,
  selectedWarehouse,
  selectedLocation,
  selectedStatus,
  onStatusChange
}: FilterProps) {
  const statuses = [
    { value: "", label: "TẤT CẢ TRẠNG THÁI", color: "bg-gray-400" },
    { value: "Draft", label: "BẢN NHÁP", color: "bg-amber-400" },
    { value: "Completed", label: "ĐÃ HOÀN TẤT", color: "bg-emerald-500" },
  ];

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (status: typeof statuses[0]) => {
    onStatusChange(status.value);
    setIsOpen(false);
  };

  const selected = statuses.find(s => s.value === selectedStatus)?.label || "TẤT CẢ TRẠNG THÁI";

  const warehouseOptions = warehouses.map(w => ({
    Id: w.Id,
    Name: w.Name
  }));

  const selectedWarehouseObj = warehouses.find(w => w.Id === selectedWarehouse) || null;

  const locationOptions = selectedWarehouseObj 
    ? locations.filter(l => l.WarehouseId === selectedWarehouseObj.Id).map(l => ({
        Id: l.Id,
        Name: l.Name
      }))
    : [];

  const selectedLocationObj = locations.find(l => l.Id === selectedLocation) || null;

  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Tìm tên sản phẩm hoặc mã lô..."
            className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <OdooDropdown
            items={warehouseOptions}
            value={selectedWarehouseObj}
            onChange={(item) => onWarehouseChange(item?.Id ?? null)}
            displayField="Name"
            placeholder="TẤT CẢ KHO"
            showClearButton={true}
            width="350px"
            portal={false}
            showSearch={false}
          />

          <OdooDropdown
            items={locationOptions}
            value={selectedLocationObj}
            onChange={(item) => onLocationChange(item?.Id ?? null)}
            displayField="Name"
            placeholder={selectedWarehouseObj ? "TẤT CẢ VỊ TRÍ" : "CHỌN KHO TRƯỚC"}
            showClearButton={true}
            width="350px"
            portal={false}
            showSearch={false}
            disabled={!selectedWarehouseObj}
          />

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[240px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${statuses.find(s => s.label === selected)?.color} shadow-sm transition-all duration-300`}></span>
                {selected}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#E4002B]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleSelect(status)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${selected === status.label ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${status.color}`}></span>
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
