"use client";
import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import type { GetCustomerParams } from '@/types/customer';

interface CustomerFilterProps {
  onFilter: (filters: GetCustomerParams) => void;
  onCreate: () => void;
}

const CustomerFilter: React.FC<CustomerFilterProps> = memo(({ onFilter, onCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Memoized filter application
  const applyFilters = useCallback(() => {
    onFilter({
      search: searchTerm || undefined,
      isActive,
    });
  }, [searchTerm, isActive, onFilter]);

  // Optimized debounced search (300ms for better UX)
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, isActive, applyFilters]);

  // Memoized clear filters handler
  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setIsActive(undefined);
  }, []);

  // Removed standard select handler, using inline for custom dropdown

  // Memoized search input handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  // Memoized derived value
  const hasActiveFilters = useMemo(() => {
    return searchTerm || isActive !== undefined;
  }, [searchTerm, isActive]);

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Search Input - Responsive with flex */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-3.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-50 outline-none transition-all text-sm font-medium border border-transparent focus:border-red-200"
            />
          </div>
        </div>

        {/* Status Filter */}
        {/* Status Filter */}
        <div className="w-48 shrink-0 lg:w-56 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className="w-full px-4 py-3.5 bg-gray-50 rounded-xl outline-none text-sm font-medium border border-transparent focus:border-red-200 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              {isActive === undefined && (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                  <span className="text-gray-700">Tất cả trạng thái</span>
                </>
              )}
              {isActive === true && (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                  <span className="text-gray-900">Hoạt động</span>
                </>
              )}
              {isActive === false && (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#E4002B] shadow-[0_0_8px_rgba(228,0,43,0.4)]"></span>
                  <span className="text-gray-900">Không hoạt động</span>
                </>
              )}
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-red-900/5 border border-red-50 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                onMouseDown={(e) => { e.preventDefault(); setIsActive(undefined); setIsDropdownOpen(false); }}
              >
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span className="font-medium text-gray-700">Tất cả trạng thái</span>
              </button>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3"
                onMouseDown={(e) => { e.preventDefault(); setIsActive(true); setIsDropdownOpen(false); }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                <span className="font-bold text-gray-900">Hoạt động</span>
              </button>
              <button
                type="button"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3"
                onMouseDown={(e) => { e.preventDefault(); setIsActive(false); setIsDropdownOpen(false); }}
              >
                <div className="w-2 h-2 rounded-full bg-[#E4002B] shadow-[0_0_8px_rgba(228,0,43,0.4)]"></div>
                <span className="font-bold text-gray-900">Không hoạt động</span>
              </button>
            </div>
          )}
        </div>

        {/* Clear Filters - INLINE */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-3.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase hover:bg-gray-200 transition-all shrink-0 whitespace-nowrap lg:w-auto"
          >
            Xóa bộ lọc
          </button>
        )}

        {/* Add Customer Button - LARGER */}
        <button
          onClick={onCreate}
          className="bg-[#E4002B] text-white px-6 py-3.5 lg:px-8 rounded-2xl font-black text-[11px] uppercase hover:brightness-110 shadow-lg shrink-0 whitespace-nowrap"
        >
          + Thêm khách hàng
        </button>
      </div>
    </div>
  );
});

CustomerFilter.displayName = 'CustomerFilter';

export default CustomerFilter;
