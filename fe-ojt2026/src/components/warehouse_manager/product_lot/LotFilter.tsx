"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface LotFilterProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    onSearch?: (val: string) => void;
    expirationFilter: string;
    setExpirationFilter: (val: string) => void;
}

export const LotFilter = ({ searchTerm, setSearchTerm, onSearch, expirationFilter, setExpirationFilter }: LotFilterProps) => {
    const [isExpirationOpen, setIsExpirationOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsExpirationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch(searchTerm);
        }
    };

    const expirationOptions = [
        { label: "Tất cả thời hạn", value: "" },
        { label: "Hết hạn trong 7 ngày", value: "7" },
        { label: "Hết hạn trong 30 ngày", value: "30" },
        { label: "Hết hạn trong 90 ngày", value: "90" },
        { label: "Đã hết hạn", value: "expired" },
    ];

    const currentExpirationLabel = expirationOptions.find(opt => opt.value === expirationFilter)?.label || "Tất cả thời hạn";

    return (
        <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-8" ref={dropdownRef}>
            {/* Dòng 1: Ô tìm kiếm */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 flex items-center gap-4 max-w-2xl">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã số lô hoặc sản phẩm..."
                            className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <button
                        onClick={() => onSearch?.(searchTerm)}
                        className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0"
                    >
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Dòng 2: Các bộ lọc Dropdown (Custom Style) */}
            <div className="flex flex-wrap gap-6 items-center border-t border-gray-100 pt-4">
                {/* Hạn sử dụng */}
                <div className="flex items-center gap-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                        Hạn sử dụng:
                    </label>
                    <div className="relative min-w-[220px]">
                        <button
                            onClick={() => { setIsExpirationOpen(!isExpirationOpen); }}
                            className={`flex items-center justify-between gap-3 px-5 h-14 w-full bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-[#E4002B] hover:bg-white hover:border-red-100/30 transition-all ${isExpirationOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${expirationFilter === "" ? "bg-gray-300" : "bg-[#E4002B]"}`}></span>
                                <span className={expirationFilter === "" ? "text-gray-500" : "text-[#E4002B]"}>{currentExpirationLabel}</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-[#E4002B] transition-transform ${isExpirationOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isExpirationOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                                {expirationOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-900 hover:bg-red-50 transition-colors"
                                        onClick={() => {
                                            setExpirationFilter(opt.value);
                                            setIsExpirationOpen(false);
                                            onSearch?.(searchTerm);
                                        }}
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full ${opt.value === "" ? "bg-gray-300" : "bg-[#E4002B]"}`}></div>
                                        <span>{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
