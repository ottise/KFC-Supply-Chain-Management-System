"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, RotateCcw } from 'lucide-react';

interface VendorFilterProps {
    onSearch: (val: string) => void;
    onStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
    onCreateClick: () => void;
    selectedStatus: 'all' | 'active' | 'inactive';
}

export default function VendorFilter({
    onSearch,
    onStatusFilter,
    onCreateClick,
    selectedStatus,
}: VendorFilterProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const statuses = [
        { label: "Tất cả trạng thái", value: "all", color: "bg-gray-300" },
        { label: "Hoạt động", value: "active", color: "bg-green-500" },
        { label: "Ngừng hoạt động", value: "inactive", color: "bg-gray-400" },
    ] as const;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleStatusSelect = (status: typeof statuses[number]) => {
        onStatusFilter(status.value as 'all' | 'active' | 'inactive');
        setIsStatusOpen(false);
    };

    const resetFilters = () => {
        setSearchTerm('');
        onSearch('');
        onStatusFilter('all');
    };

    return (
        <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4 flex-1">
                    {/* Search Input */}
                    <div className="relative w-full max-w-xl group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <Search className="w-4 h-4 text-[#E4002B]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm tên nhà cung ứng, email hoặc di động..."
                            className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                onSearch(e.target.value);
                            }}
                        />
                    </div>

                    {/* Status Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsStatusOpen(!isStatusOpen)}
                            className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[240px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isStatusOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
                        >
                            <span className="flex items-center gap-3">
                                <span className={`w-2.5 h-2.5 rounded-full ${statuses.find(s => s.value === selectedStatus)?.color} shadow-sm transition-all duration-300`}></span>
                                {statuses.find(s => s.value === selectedStatus)?.label}
                            </span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isStatusOpen ? 'rotate-180 text-[#E4002B]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isStatusOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                                {statuses.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => handleStatusSelect(status)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${selectedStatus === status.value ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"}`}
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
                    className="px-8 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
                >
                    <Plus className="w-4 h-4" />
                    Thêm nhà cung ứng
                </button>
            </div>

            <div className="flex items-center border-t border-gray-100 pt-4">
                <button
                    onClick={resetFilters}
                    className="text-[11px] font-bold text-gray-500 hover:text-[#E4002B] transition-all flex items-center gap-2 group uppercase tracking-[0.08em] subpixel-antialiased shrink-0 bg-gray-50 hover:bg-red-50 px-5 h-14 rounded-full border border-transparent hover:border-red-100/50 justify-center ml-auto"
                >
                    <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Đặt lại bộ lọc
                </button>
            </div>
        </div>
    );
}
