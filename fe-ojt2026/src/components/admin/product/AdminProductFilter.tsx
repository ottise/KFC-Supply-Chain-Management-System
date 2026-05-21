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
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
      {/* First row: Search and Add button */}
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Tìm Kiếm
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên sản phẩm hoặc SKU..."
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => onSearch(searchTerm, 'name')}
            className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all active:scale-95 shadow-md h-[46px]"
          >
            Tìm kiếm
          </button>

          {showAddButton && (
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 px-6 py-3 bg-[#E4002B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-100 hover:bg-red-700 transition-all h-[46px]"
            >
              <Plus className="w-4 h-4" />
              Thêm sản phẩm
            </button>
          )}
        </div>
      </div>

      {/* Second row: Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Category Filter */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Danh Mục
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <button
              onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              onBlur={() => setTimeout(() => setIsCategoryDropdownOpen(false), 200)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {!selectedCategory ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span className="text-gray-700">Tất cả danh mục</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2 h-2 rounded-full ${getSelectedCategoryColor()}`}></span>
                    <span className="text-gray-900">{selectedCategory.Name}</span>
                  </>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isCategoryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-red-900/5 border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onCategoryFilter(undefined); setIsCategoryDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="font-medium text-gray-700">Tất cả danh mục</span>
                </button>
                {categories.map((cat, index) => (
                  <button
                    key={cat.Id}
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3"
                    onMouseDown={(e) => { e.preventDefault(); onCategoryFilter(cat.Id); setIsCategoryDropdownOpen(false); }}
                  >
                    <div className={`w-2 h-2 rounded-full ${getCategoryColor(index)}`}></div>
                    <span className="font-bold text-gray-900">{cat.Name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Trạng Thái
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <button
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              onBlur={() => setTimeout(() => setIsStatusDropdownOpen(false), 200)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {initialStatus === undefined ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span className="text-gray-700">Tất cả</span>
                  </>
                ) : initialStatus === true ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                    <span className="text-gray-900">Hoạt động</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></span>
                    <span className="text-gray-900">Ngừng hoạt động</span>
                  </>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-red-900/5 border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onStatusFilter(undefined); setIsStatusDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="font-medium text-gray-700">Tất cả</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onStatusFilter(true); setIsStatusDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                  <span className="font-bold text-gray-900">Hoạt động</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onStatusFilter(false); setIsStatusDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></div>
                  <span className="font-bold text-gray-900">Ngừng hoạt động</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
