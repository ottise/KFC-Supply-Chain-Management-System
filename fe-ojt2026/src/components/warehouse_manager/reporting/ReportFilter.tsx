"use client";

import React, { useState } from 'react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { Calendar, RefreshCcw } from 'lucide-react';
import OdooDropdown from '@/components/common/OdooDropdown';

registerLocale("vi", vi);

interface ReportFilterProps {
  onFilterChange: (range: string, customDates?: { start: string; end: string }) => void;
  onWarehouseChange: (warehouseId: number | undefined) => void;
  currentRange: string;
  selectedWarehouseId?: number;
  warehouses: { Id: number; Name: string }[];
}

export default function ReportFilter({
  onFilterChange,
  onWarehouseChange,
  currentRange,
  selectedWarehouseId,
  warehouses
}: ReportFilterProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const rangeOptions = [
    { value: "7", label: "7 NGÀY QUA" },
    { value: "30", label: "30 NGÀY QUA" },
    { value: "180", label: "6 THÁNG QUA" },
    { value: "custom", label: "TÙY CHỈNH NGÀY" },
  ];

  const warehouseOptions = warehouses.map(w => ({
    Id: w.Id,
    Name: w.Name
  }));

  const selectedWarehouse = warehouses.find(w => w.Id === selectedWarehouseId) || null;
  const selectedRange = rangeOptions.find(r => r.value === currentRange) || rangeOptions[0];

  const formatDate = (Date: Date | null) => {
    if (!Date) return "";
    const year = Date.getFullYear();
    const month = String(Date.getMonth() + 1).padStart(2, '0');
    const day = String(Date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onFilterChange("custom", {
        start: formatDate(startDate),
        end: formatDate(endDate)
      });
    }
  };

  return (
    <div>
      <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-wrap xl:flex-nowrap items-end gap-x-4 gap-y-4">
        {/* Dropdown chọn kho */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-6 mb-1 flex items-center gap-2 h-5">
            <div className="w-1.5 h-1.5 bg-[#E4002B] rounded-full shadow-[0_0_8px_rgba(228,0,43,0.4)]" />
            Kho quản lý
          </label>
          <OdooDropdown
            items={warehouseOptions}
            value={selectedWarehouse}
            onChange={(item) => onWarehouseChange(item?.Id)}
            displayField="Name"
            placeholder="TẤT CẢ KHO"
            showClearButton={true}
            width="350px"
            portal={false}
            showSearch={false}
          />
        </div>

        {/* Dropdown chọn mốc thời gian */}
        <div className="flex flex-col gap-2 shrink-0">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-6 mb-1 flex items-center gap-2 h-5">
            <div className="w-1.5 h-1.5 bg-[#E4002B] rounded-full shadow-[0_0_8px_rgba(228,0,43,0.4)]" />
            Khoảng thời gian
          </label>
          <OdooDropdown
            items={rangeOptions}
            value={selectedRange}
            onChange={(item) => onFilterChange(item.value)}
            displayField="label"
            placeholder="Chọn thời gian"
            showClearButton={false}
            width="240px"
            portal={false}
            showSearch={false}
          />
        </div>

        {currentRange === "custom" && (
          <div className="flex items-end gap-3 animate-in fade-in slide-in-from-top-4 duration-700 shrink-0">
            {/* Từ ngày */}
            <div className="flex flex-col gap-2 shrink-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-6 mb-1 flex items-center gap-2 h-5">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                Từ ngày
              </label>
              <div className="relative">
                <DatePicker
                  selected={startDate || undefined}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setStartDate(date);
                    } else {
                      setStartDate(undefined);
                    }
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  locale="vi"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="CHỌN NGÀY"
                  className="pl-5 pr-10 h-14 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 outline-none focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20 transition-all cursor-pointer w-[180px] shadow-sm hover:bg-white hover:border-red-100/30 text-center"
                  portalId="kfc-stock-portal"
                  popperPlacement="bottom-start"
                  popperClassName="kfc-datepicker-custom"
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              </div>
            </div>

            <span className="mb-5 text-gray-200 font-bold shrink-0">—</span>

            {/* Đến ngày */}
            <div className="flex flex-col gap-2 shrink-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-6 mb-1 flex items-center gap-2 h-5">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                Đến ngày
              </label>
              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    if (date) {
                      setEndDate(date);
                    } else {
                      setEndDate(undefined);
                    }
                  }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  locale="vi"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="CHỌN NGÀY"
                  className="pl-5 pr-10 h-14 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 outline-none focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20 transition-all cursor-pointer w-[180px] shadow-sm hover:bg-white hover:border-red-100/30 text-center"
                  portalId="kfc-stock-portal"
                  popperPlacement="bottom-start"
                  popperClassName="kfc-datepicker-custom"
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
              </div>
            </div>

            {/* Nút Áp dụng */}
            <button
              onClick={handleApply}
              className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] subpixel-antialiased rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
            >
              <span>Áp dụng</span>
              <div className="w-1.5 h-1.5 bg-white/80 rounded-full" />
            </button>
          </div>
        )}

        {/* Nút Reset bộ lọc (Đặt ở góc phải) */}
        <div className="ml-auto">
          <button
            onClick={() => {
              onFilterChange("7");
              onWarehouseChange(undefined);
              setStartDate(undefined);
              setEndDate(undefined);
            }}
            className="text-[11px] font-bold text-gray-500 hover:text-[#E4002B] transition-all flex items-center gap-2 group uppercase tracking-[0.08em] subpixel-antialiased shrink-0 bg-gray-50 hover:bg-red-50 px-5 h-14 rounded-full border border-transparent hover:border-red-100/50 justify-center disabled:opacity-50 disabled:cursor-default disabled:hover:text-gray-500 disabled:hover:bg-gray-50 disabled:hover:border-transparent"
            disabled={currentRange === "7" && !selectedWarehouseId && !startDate && !endDate}
          >
            <RefreshCcw className="w-3.5 h-3.5 group-hover:rotate-180 transition-all duration-700" />
            Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}