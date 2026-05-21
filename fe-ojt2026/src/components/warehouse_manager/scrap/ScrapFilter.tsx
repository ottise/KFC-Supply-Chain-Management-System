"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import OdooDropdown from '@/components/common/OdooDropdown';

interface ScrapFilterProps {
  onSearch: (val: string) => void;
  onCreateClick: () => void;
  onStatusFilter: (status: string) => void;
}

export default function ScrapFilter({ onSearch, onCreateClick, onStatusFilter }: ScrapFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const statuses = [
    { value: 'ALL', label: 'TẤT CẢ', color: 'bg-gray-400' },
    { value: 'draft', label: 'BẢN NHÁP', color: 'bg-amber-400' },
    { value: 'ready', label: 'SẴN SÀNG', color: 'bg-blue-400' },
    { value: 'done', label: 'HOÀN TẤT', color: 'bg-emerald-500' },
    { value: 'cancelled', label: 'ĐÃ HỦY', color: 'bg-red-500' },
  ];
  const [selectedStatus, setSelectedStatus] = useState(statuses[0]);
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
    setSelectedStatus(status);
    onStatusFilter(status.value);
    setIsOpen(false);
  };

  const handleSearchClick = () => {
    onSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-8">
      {/* First row: Search and Create button */}
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
              placeholder="Tìm theo mã đơn, vị trí hoặc người tạo..."
              className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            onClick={handleSearchClick}
            className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0"
          >
            Tìm kiếm
          </button>
        </div>

        <button
          onClick={onCreateClick}
          className="px-8 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
        >
          <Plus className="w-4 h-4" />
          Tạo đơn loại bỏ
        </button>
      </div>

      {/* Second row: Filters */}
      <div className="flex flex-wrap gap-6 items-center border-t border-gray-100 pt-4">
        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
            Trạng thái:
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[240px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedStatus.color} shadow-sm transition-all duration-300`}></span>
                {selectedStatus.label}
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${selectedStatus.value === status.value ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"}`}
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