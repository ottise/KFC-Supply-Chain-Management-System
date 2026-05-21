"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { Category } from "@/types/warehouse/masterData";

interface Warehouse {
    Id: number;
    Name: string;
}

interface WarehouseProductFilterProps {
    onSearch: (val: string) => void;
    onWarehouseFilter: (warehouseId: number | undefined) => void;
    onStatusFilter: (isActive: boolean | undefined) => void;
    onCategoryFilter: (categoryId: number | undefined) => void;
    warehouses: Warehouse[];
    categories: Category[];
    selectedWarehouseId?: number;
    selectedStatus?: boolean;
    selectedCategoryId?: number;
}

export default function WarehouseProductFilter({
    onSearch,
    onWarehouseFilter,
    onStatusFilter,
    onCategoryFilter,
    warehouses,
    categories,
    selectedWarehouseId,
    selectedStatus,
    selectedCategoryId,
}: WarehouseProductFilterProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isWarehouseDropdownOpen, setIsWarehouseDropdownOpen] = useState(false);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsWarehouseDropdownOpen(false);
                setIsStatusDropdownOpen(false);
                setIsCategoryDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') onSearch(searchTerm);
    };

    const selectedWarehouse = warehouses.find(w => w.Id === selectedWarehouseId);

    const warehouseColors = [
        'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]',
        'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
        'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
        'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
        'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    ];
    const getWarehouseColor = (index: number) => warehouseColors[index % warehouseColors.length];
    const getSelectedWarehouseColor = () => {
        const idx = warehouses.findIndex(w => w.Id === selectedWarehouseId);
        return idx >= 0 ? getWarehouseColor(idx) : '';
    };

    const categoryColors = [
        'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]',
        'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
        'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
        'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
        'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
        'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]',
    ];
    const getCategoryColor = (index: number) => categoryColors[index % categoryColors.length];
    const getSelectedCategoryColor = () => {
        const idx = categories.findIndex(c => c.Id === selectedCategoryId);
        return idx >= 0 ? getCategoryColor(idx) : '';
    };

    const selectedCategory = categories.find(c => c.Id === selectedCategoryId);

    return (
        <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-6">
            {/* Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 max-w-xl group">
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                        className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <button
                    onClick={() => onSearch(searchTerm)}
                    className="px-8 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
                >
                    Tìm kiếm
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center border-t border-gray-100 pt-4">
                {/* Warehouse Filter */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsWarehouseDropdownOpen(!isWarehouseDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsWarehouseDropdownOpen(false), 200)}
                        className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[200px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isWarehouseDropdownOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
                    >
                        <div className="flex items-center gap-2">
                            {!selectedWarehouse ? (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                    <span className="text-gray-500">Tất cả kho</span>
                                </>
                            ) : (
                                <>
                                    <span className={`w-2.5 h-2.5 rounded-full ${getSelectedWarehouseColor()}`}></span>
                                    <span className="text-gray-900">{selectedWarehouse.Name}</span>
                                </>
                            )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isWarehouseDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isWarehouseDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top max-h-60 overflow-y-auto">
                            <button
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-500 hover:bg-red-50 transition-colors"
                                onMouseDown={(e) => { e.preventDefault(); onWarehouseFilter(undefined); setIsWarehouseDropdownOpen(false); }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                <span>Tất cả kho</span>
                            </button>
                            {warehouses.map((wh, index) => (
                                <button
                                    key={wh.Id}
                                    type="button"
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-900 hover:bg-red-50 transition-colors"
                                    onMouseDown={(e) => { e.preventDefault(); onWarehouseFilter(wh.Id); setIsWarehouseDropdownOpen(false); }}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${getWarehouseColor(index)}`}></div>
                                    <span>{wh.Name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Category Filter */}
                <div className="relative">
                    <button
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
                        className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[200px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isCategoryDropdownOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
                    >
                        <div className="flex items-center gap-2 max-w-[150px]">
                            {!selectedCategory ? (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                    <span className="text-gray-500">Tất cả danh mục</span>
                                </>
                            ) : (
                                <>
                                    <span className={`w-2.5 h-2.5 rounded-full ${getSelectedCategoryColor()}`}></span>
                                    <span className="text-gray-900 truncate">{selectedCategory.Name}</span>
                                </>
                            )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isCategoryDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top max-h-60 overflow-y-auto">
                            <button
                                type="button"
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-500 hover:bg-red-50 transition-colors"
                                onMouseDown={(e) => { e.preventDefault(); onCategoryFilter(undefined); setIsCategoryDropdownOpen(false); }}
                            >
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                <span>Tất cả danh mục</span>
                            </button>
                            {categories.map((cat, index) => (
                                <button
                                    key={cat.Id}
                                    type="button"
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-900 hover:bg-red-50 transition-colors"
                                    onMouseDown={(e) => { e.preventDefault(); onCategoryFilter(cat.Id); setIsCategoryDropdownOpen(false); }}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(index)}`}></div>
                                    <span>{cat.Name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsStatusDropdownOpen(false), 200)}
                        className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[200px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isStatusDropdownOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
                    >
                        <div className="flex items-center gap-2">
                            {selectedStatus === undefined ? (
                                <><span className="w-2.5 h-2.5 rounded-full bg-gray-300 subpixel-antialiased"></span><span className="text-gray-500">Tất cả trạng thái</span></>
                            ) : selectedStatus ? (
                                <><span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span><span className="text-gray-900">Hoạt động</span></>
                            ) : (
                                <><span className="w-2.5 h-2.5 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></span><span className="text-gray-900">Ngừng hoạt động</span></>
                            )}
                        </div>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isStatusDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                            <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-500 hover:bg-red-50 transition-colors" onMouseDown={(e) => { e.preventDefault(); onStatusFilter(undefined); setIsStatusDropdownOpen(false); }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                                <span>Tất cả trạng thái</span>
                            </button>
                            <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-900 hover:bg-red-50 transition-colors" onMouseDown={(e) => { e.preventDefault(); onStatusFilter(true); setIsStatusDropdownOpen(false); }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] subpixel-antialiased"></div>
                                <span>Hoạt động</span>
                            </button>
                            <button type="button" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left text-gray-900 hover:bg-red-50 transition-colors" onMouseDown={(e) => { e.preventDefault(); onStatusFilter(false); setIsStatusDropdownOpen(false); }}>
                                <div className="w-2.5 h-2.5 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)] subpixel-antialiased"></div>
                                <span>Ngừng hoạt động</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
