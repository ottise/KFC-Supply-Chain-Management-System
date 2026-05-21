"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { roleApi } from '@/lib/api/admin/roleApi';
import type { RoleOption } from '@/types/user';

interface UserFilterProps {
  onSearch: (term: string) => void;
  onRoleFilter: (roleId: number | undefined) => void;
  onStatusFilter: (status: string | undefined) => void;
  onActiveEmailFilter: (isActiveEmail: boolean | undefined) => void;
  onClearFilters: () => void;
  searchValue?: string;
  roleValue?: number;
  statusValue?: string;
  activeEmailValue?: boolean;
  onCreateAccount?: () => void;
}

const UserFilter: React.FC<UserFilterProps> = ({
  onSearch,
  onRoleFilter,
  onStatusFilter,
  onActiveEmailFilter,
  onClearFilters,
  searchValue = '',
  roleValue,
  statusValue,
  activeEmailValue,
  onCreateAccount,
}) => {
  const [searchTerm, setSearchTerm] = useState(searchValue);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isActiveEmailDropdownOpen, setIsActiveEmailDropdownOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);

      try {
        const rolesData = await roleApi.getRoles();
        const options = roleApi.toRoleOptions(rolesData);
        setRoles(options);
      } catch (error) {
        // Silently handle error
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  const hasFilters = searchTerm || roleValue !== undefined || statusValue !== undefined || activeEmailValue !== undefined;

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    onClearFilters();
  }, [onClearFilters]);

  // Helper cho màu sắc vai trò
  const getRoleDotClass = (roleName: string) => {
    const lower = roleName.toLowerCase();
    if (lower.includes('admin') || lower.includes('quản trị')) return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]';
    if (lower.includes('manager') || lower.includes('quản lý')) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]';
    if (lower.includes('staff') || lower.includes('nhân viên')) return 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]';
    return 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]';
  };

  return (
    <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-end">
        {/* Search Input */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Tìm Kiếm
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email, hoặc username..."
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200"
            />
          </div>
        </div>

        {/* Add Account Button */}
        {onCreateAccount && (
          <div className="w-full md:w-auto shrink-0">
            <button
              onClick={onCreateAccount}
              className="w-full md:w-auto px-6 py-3 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition-all h-[46px]"
            >
              + Thêm Tài Khoản
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Role Filter */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Vai Trò
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              onBlur={() => setTimeout(() => setIsRoleDropdownOpen(false), 200)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200 flex items-center justify-between"
              disabled={loadingRoles}
            >
              <div className="flex items-center gap-2">
                {roleValue === undefined || roleValue === null || roleValue === 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span className="text-gray-700">{loadingRoles ? 'Đang tải...' : 'Tất cả'}</span>
                  </>
                ) : (
                  (() => {
                    const activeRole = roles.find(r => r.value === roleValue);
                    return activeRole ? (
                      <>
                        <span className={`w-2 h-2 rounded-full ${getRoleDotClass(activeRole.label)}`}></span>
                        <span className="text-gray-900">{activeRole.label}</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span className="text-gray-700">Tất cả</span>
                      </>
                    );
                  })()
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isRoleDropdownOpen && !loadingRoles && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-red-900/5 border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onRoleFilter(undefined); setIsRoleDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="font-medium text-gray-700">Tất cả</span>
                </button>
                {roles.length === 0 ? (
                  <div className="px-4 py-2.5 text-sm text-gray-400">Không tìm thấy vai trò</div>
                ) : roles.map((role, index) => (
                  <button
                    key={`role-${role.value}-${index}`}
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3"
                    onMouseDown={(e) => { e.preventDefault(); onRoleFilter(role.value); setIsRoleDropdownOpen(false); }}
                  >
                    <div className={`w-2 h-2 rounded-full ${getRoleDotClass(role.label)}`}></div>
                    <span className="font-bold text-gray-900">{role.label}</span>
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
                {!statusValue ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span className="text-gray-700">Tất cả</span>
                  </>
                ) : statusValue === 'Active' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                    <span className="text-gray-900">Hoạt Động</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></span>
                    <span className="text-gray-900">Không Hoạt Động</span>
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
                  onMouseDown={(e) => { e.preventDefault(); onStatusFilter('Active'); setIsStatusDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                  <span className="font-bold text-gray-900">Hoạt Động</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onStatusFilter('Inactive'); setIsStatusDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></div>
                  <span className="font-bold text-gray-900">Không Hoạt Động</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Active Email Filter */}
        <div className="flex-1 w-full">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
            Xác Nhận Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <button
              onClick={() => setIsActiveEmailDropdownOpen(!isActiveEmailDropdownOpen)}
              onBlur={() => setTimeout(() => setIsActiveEmailDropdownOpen(false), 200)}
              className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {activeEmailValue === undefined ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    <span className="text-gray-700">Tất cả</span>
                  </>
                ) : activeEmailValue === true ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                    <span className="text-gray-900">Đã Xác Nhận</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></span>
                    <span className="text-gray-900">Chưa Xác Nhận</span>
                  </>
                )}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isActiveEmailDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isActiveEmailDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl shadow-red-900/5 border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onActiveEmailFilter(undefined); setIsActiveEmailDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span className="font-medium text-gray-700">Tất cả</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onActiveEmailFilter(true); setIsActiveEmailDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                  <span className="font-bold text-gray-900">Đã Xác Nhận</span>
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3"
                  onMouseDown={(e) => { e.preventDefault(); onActiveEmailFilter(false); setIsActiveEmailDropdownOpen(false); }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                  <span className="font-bold text-gray-900">Chưa Xác Nhận</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clear Filters Button - Auto Width */}
        {hasFilters && (
          <div className="w-full md:w-auto shrink-0 flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full md:w-auto px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-all flex items-center justify-center gap-2 h-[46px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Xóa Lọc
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserFilter;
