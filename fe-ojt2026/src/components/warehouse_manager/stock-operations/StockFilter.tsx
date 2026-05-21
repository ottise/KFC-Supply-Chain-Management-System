"use client";

import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { Plus } from 'lucide-react';

registerLocale("vi", vi);

interface StockFilterProps {
  onSearch: (val: string) => void;
  onCreateClick: () => void;
  onStatusFilter: (status: string) => void;
  onTypeFilter: (type: string) => void;
  onDateChange: (from: string, to: string, type: 'created' | 'planned') => void;
}

export default function StockFilter({
  onSearch,
  onCreateClick,
  onStatusFilter,
  onTypeFilter,
  onDateChange,
}: StockFilterProps) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateMode, setDateMode] = useState<'created' | 'planned'>('created');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("Tất Cả Trạng Thái");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const statuses = [
    { label: "Tất Cả Trạng Thái", value: "all", color: "bg-gray-300" },
    { label: "Nháp", value: "DRAFT", color: "bg-gray-400" },
    { label: "Chờ xử lý", value: "WAITING", color: "bg-orange-400" },
    { label: "Đã sẵn sàng", value: "READY", color: "bg-blue-500" },
    { label: "Hoàn thành", value: "DONE", color: "bg-green-500" },
    { label: "Đã hủy", value: "CANCELLED", color: "bg-red-500" },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStatusOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStatusSelect = (status: { label: string, value: string }) => {
    setSelectedStatus(status.label);
    onStatusFilter(status.value);
    setIsStatusOpen(false);
  };

  useEffect(() => {
    onDateChange(fromDate, toDate, dateMode);
  }, [fromDate, toDate, dateMode]);
  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-8">
      {/* Row 1: Search & Status & Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 flex-1">
          {/* Search Input */}
          <div className="relative w-full max-w-xl group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="stock-ops-search"
              ref={searchInputRef}
              spellCheck={false}
              type="text"
              placeholder="Tìm Theo Mã Phiếu, Đích Đến..."
              className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
          
          {/* Custom Status Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsStatusOpen(!isStatusOpen)}
              className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[240px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isStatusOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${statuses.find(s => s.label === selectedStatus)?.color} shadow-sm transition-all duration-300`}></span>
                {selectedStatus}
              </span>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isStatusOpen ? 'rotate-180 text-[#E4002B]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isStatusOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusSelect(status)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${selectedStatus === status.label ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${status.color}`}></span>
                    {status.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={onCreateClick}
          className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
        >
          <Plus className="w-4 h-4" />
          Tạo phiếu xuất
        </button>
      </div>

      {/* Row 2: Date Filters */}
      <div className="flex flex-wrap gap-6 items-center border-t border-gray-100 pt-4">
        {/* Date Mode Toggle */}
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shadow-inner">
          <button 
            onClick={() => { setDateMode('created'); setFromDate(""); setToDate(""); }}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${dateMode === 'created' ? 'bg-white text-[#E4002B] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Theo ngày đặt
          </button>
          <button 
            onClick={() => { setDateMode('planned'); setFromDate(""); setToDate(""); }}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${dateMode === 'planned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Theo ngày giao
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="filter-from-date" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer">
            Từ ngày:
          </label>
          <div className="relative group kfc-stock-datepicker-container">
            <DatePicker
              id="filter-from-date"
              locale="vi"
              calendarClassName="kfc-datepicker-custom"
              portalId="kfc-stock-portal"
              selected={fromDate ? new Date(fromDate) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  setFromDate(`${year}-${month}-${day}`);
                } else {
                  setFromDate("");
                }
              }}
              dateFormat="dd/MM/yyyy"
              placeholderText="CHỌN NGÀY"
              className="pl-5 pr-10 h-14 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 outline-none focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20 transition-all cursor-pointer w-[180px] shadow-sm hover:bg-white hover:border-red-100/30 text-center"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="filter-to-date" className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer">Đến ngày:</label>
          <div className="relative group kfc-stock-datepicker-container">
            <DatePicker
              id="filter-to-date"
              locale="vi"
              calendarClassName="kfc-datepicker-custom"
              portalId="kfc-stock-portal"
              selected={toDate ? new Date(toDate) : null}
              onChange={(date: Date | null) => {
                if (date) {
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  setToDate(`${year}-${month}-${day}`);
                } else {
                  setToDate("");
                }
              }}
              dateFormat="dd/MM/yyyy"
              placeholderText="CHỌN NGÀY"
              className="pl-5 pr-10 h-14 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 outline-none focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20 transition-all cursor-pointer w-[180px] shadow-sm hover:bg-white hover:border-red-100/30 text-center"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { setFromDate(""); setToDate(""); setDateMode('created'); setSelectedStatus("Tất cả trạng thái"); onStatusFilter("all"); onSearch(""); (document.querySelector('input[type="text"]') as HTMLInputElement).value = ""; }}
          className="text-[11px] font-bold text-gray-500 hover:text-[#E4002B] transition-all flex items-center gap-2 group uppercase tracking-[0.08em] subpixel-antialiased shrink-0 bg-gray-50 hover:bg-red-50 px-5 h-14 rounded-full border border-transparent hover:border-red-100/50 justify-center ml-auto"
        >
          <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Đặt lại
        </button>
      </div>
    </div>
  );
}
