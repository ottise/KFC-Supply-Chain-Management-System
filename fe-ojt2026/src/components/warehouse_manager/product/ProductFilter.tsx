"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { masterDataApi } from '@/lib/api/warehouse/masterDataApi';
import type { Category } from '@/types/warehouse/masterData';

interface ProductFilterProps {
  onSearch: (val: string, field: 'name' | 'code') => void;
  onAddClick?: () => void;
  onCategoryFilter: (categoryId: number | undefined) => void;
  onStatusFilter: (isActive: boolean | undefined) => void;
  initialStatus?: boolean;
  initialCategoryId?: number;
  showAddButton?: boolean;
  totalItems?: number;
}

export default function ProductFilter({
  onSearch,
  onAddClick,
  onCategoryFilter,
  onStatusFilter,
  initialStatus,
  initialCategoryId,
  showAddButton = true
}: ProductFilterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await masterDataApi.getCategories();
        setCategories(data.filter(c => c.IsActive));
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm, 'name');
    }
  };

  const selectedCategory = categories.find(c => c.Id === initialCategoryId);

  // Rotating color palette for category dots
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
    const idx = categories.findIndex(c => c.Id === initialCategoryId);
    return idx >= 0 ? getCategoryColor(idx) : '';
  };

  return (
    <div className="bg-white rounded-[1.5rem] p-5 shadow-md shadow-gray-200/50 border border-gray-100 flex flex-col gap-4 mb-6">
      {/* First row: Search and Add button */}
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
              placeholder="Tìm theo tên sản phẩm hoặc SKU..."
              className="w-full h-14 pl-12 pr-6 text-[11px] font-medium uppercase tracking-[0.04em] bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-gray-50 focus:border-red-100 outline-none transition-all placeholder:text-gray-300 placeholder:tracking-[0.08em] shadow-sm hover:bg-white hover:border-red-100/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>

          <button
            onClick={() => onSearch(searchTerm, 'name')}
            className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center justify-center shrink-0"
          >
            Tìm kiếm
          </button>
        </div>

        {showAddButton && (
          <button
            onClick={onAddClick}
            className="px-6 h-14 bg-[#E4002B] text-white text-[11px] font-bold uppercase tracking-[0.06em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 flex items-center gap-2 shrink-0 justify-center"
          >
            <Plus className="w-4 h-4" />
            Thêm sản phẩm
          </button>
        )}
      </div>

      {/* Second row: Filters */}
      <div className="flex flex-wrap gap-6 items-center border-t border-gray-100 pt-4">
        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Danh Mục:</label>
          <div className="relative">
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
              className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[240px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isCategoryDropdownOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
            >
              <div className="flex items-center gap-3 truncate">
                {!selectedCategory ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                    <span>Tất cả danh mục</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full ${getSelectedCategoryColor()}`}></span>
                    <span className="truncate">{selectedCategory.Name}</span>
                  </>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isCategoryDropdownOpen ? 'rotate-180 text-[#E4002B]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top max-h-60 overflow-y-auto custom-scrollbar">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"
                  onMouseDown={(e) => { e.preventDefault(); onCategoryFilter(undefined); setIsCategoryDropdownOpen(false); }}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                  <span>Tất cả danh mục</span>
                </button>
                {categories.map((cat, index) => (
                  <button
                    key={cat.Id}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${initialCategoryId === cat.Id ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"}`}
                    onMouseDown={(e) => { e.preventDefault(); onCategoryFilter(cat.Id); setIsCategoryDropdownOpen(false); }}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${getCategoryColor(index)}`}></div>
                    <span className="truncate">{cat.Name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Trạng Thái:</label>
          <div className="relative">
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              onBlur={() => setTimeout(() => setIsStatusDropdownOpen(false), 200)}
              className={`flex items-center justify-between gap-3 px-5 h-14 min-w-[200px] bg-gray-50/50 border border-gray-100 rounded-[1.5rem] text-[11px] font-black uppercase tracking-tight text-gray-700 hover:bg-white hover:border-red-100/30 transition-all ${isStatusDropdownOpen ? "bg-white border-red-100/50 ring-8 ring-red-50/20" : ""}`}
            >
              <div className="flex items-center gap-3">
                {initialStatus === undefined ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                    <span>Tất cả</span>
                  </>
                ) : initialStatus === true ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span>Hoạt động</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                    <span>Ngừng hoạt động</span>
                  </>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isStatusDropdownOpen ? 'rotate-180 text-[#E4002B]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-[1.2rem] shadow-lg border border-gray-100 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top">
                {[
                  { label: "Tất cả", value: undefined, color: "bg-gray-300" },
                  { label: "Hoạt động", value: true, color: "bg-green-500" },
                  { label: "Ngừng hoạt động", value: false, color: "bg-gray-400" }
                ].map((status) => (
                  <button
                    key={status.label}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-left transition-colors ${initialStatus === status.value ? "bg-red-50 text-[#E4002B]" : "text-gray-500 hover:bg-red-50/60 hover:text-[#E4002B]"}`}
                    onMouseDown={(e) => { e.preventDefault(); onStatusFilter(status.value); setIsStatusDropdownOpen(false); }}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${status.color}`}></div>
                    <span>{status.label}</span>
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
