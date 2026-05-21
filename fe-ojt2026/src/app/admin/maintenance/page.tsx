"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import MaintFormCreate from '@/components/admin/MaintFormCreate';
import MaintDetailBox from '@/components/admin/MaintDetailBox';
import { useToast } from '@/components/ui/ToastProvider';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { maintenanceApi } from '@/lib/api/admin/maintenanceApi';
import type { MaintenanceResponse } from '@/types/maintenance';
import { formatDateTimeForDisplay } from '@/types/maintenance';
import { useSidebarContext } from '@/lib/contexts/SidebarContext';
import Pagination from '@/components/admin/Pagination';

export default function AdminMaintenance() {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<MaintenanceResponse | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed, setCollapsed } = useSidebarContext();
  const [isLoading, setIsLoading] = useState(true);
  const [maintList, setMaintList] = useState<MaintenanceResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch maintenance status (silent fail - not critical)
  const fetchMaintenanceStatus = useCallback(async () => {
    try {
      const status = await maintenanceApi.getMaintenanceStatus();
      setIsMaintenanceMode(status.isActive);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      // If 401 during maintenance, check sessionStorage for maintenance info
      if (axiosError.response?.status === 401) {
        const stored = sessionStorage.getItem('maintenanceInfo');
        if (stored) {
          try {
            const maintData = JSON.parse(stored);
            if (maintData.isActive) {
              console.warn('[Maintenance] 401 but maintenance active - showing maintenance mode');
              setIsMaintenanceMode(true);
            }
          } catch {
            // ignore
          }
        }
      }
      console.error('[Maintenance] Failed to fetch status:', error);
    }
  }, []);

  // Load maintenance info from sessionStorage (used when API fails due to maintenance)
  const loadMaintenanceFromSession = useCallback(() => {
    const stored = sessionStorage.getItem('maintenanceInfo');
    if (stored) {
      try {
        const maintData = JSON.parse(stored);
        if (maintData.isActive) {
          setIsMaintenanceMode(true);
        }
        return maintData;
      } catch {
        // ignore
      }
    }
    return null;
  }, []);

  // Fetch maintenance list with abort support
  const fetchMaintenanceList = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await maintenanceApi.getMaintenanceList(
        currentPage,
        pageSize,
        searchKeyword || undefined,
        statusFilter !== 'all' ? statusFilter : undefined
      );
      setMaintList(response.items);
      setTotalCount(response.totalCount);
      setFetchError(null);
    } catch (error: unknown) {
      const axiosError = error as { name?: string; code?: string; response?: { status?: number } };
      if (axiosError.name === 'AbortError' || axiosError.code === 'ERR_CANCELED') {
        return;
      }

      // If 401 during maintenance, load from sessionStorage instead of showing error
      if (axiosError.response?.status === 401) {
        const maintData = loadMaintenanceFromSession();
        if (maintData) {
          console.warn('[Maintenance] 401 but maintenance active - loaded from sessionStorage');
          setIsLoading(false);
          return;
        }
      }

      console.error('[Maintenance] Failed to fetch list:', error);
      const errorMsg = axiosError.response?.status === 503 || axiosError.code === 'ECONNREFUSED'
        ? 'Dịch Vụ Không Khả Dụng'
        : 'Lỗi Tải Dữ Liệu';
      setFetchError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, searchKeyword, statusFilter, loadMaintenanceFromSession]);

  useEffect(() => {
    fetchMaintenanceStatus();
    fetchMaintenanceList();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchMaintenanceStatus, fetchMaintenanceList]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchKeyword) {
        setSearchKeyword(searchInput);
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, searchKeyword]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openActionMenu && !(e.target as Element).closest('.action-menu-container')) {
        setOpenActionMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenu]);

  const handleMaintenanceCreated = () => {
    setShowCreate(false);
    fetchMaintenanceList();
    fetchMaintenanceStatus();
    // Toast is shown by MaintFormCreate on success
  };

  const handleMaintenanceUpdated = () => {
    setSelectedMaint(null);
    fetchMaintenanceList();
    fetchMaintenanceStatus();
    // Toast is shown by MaintDetailBox on actual update
  };

  const handleCreateMaintenance = () => {
    setShowCreate(true);
  };

  const handleConfirmToggle = async () => {
    setShowConfirmModal(false);
    try {
      if (pendingToggle) {
        // Start maintenance now - need to show create modal with start-now option
        toast.info('Tạo Phiếu Bảo Trì', 'Vui lòng tạo phiếu bảo trì và chọn "Bắt đầu ngay" để kích hoạt chế độ bảo trì.');
        setShowCreate(true);
      } else {
        // Stop maintenance now
        await maintenanceApi.stopMaintenanceNow();
        setIsMaintenanceMode(false);
        fetchMaintenanceList();
        toast.success('Dừng Bảo Trì Thành Công', 'Hệ thống đã hoạt động trở lại bình thường.');
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMsg = axiosError.response?.data?.message || 'Đã xảy ra lỗi.';
      toast.error('Lỗi', errorMsg);
    } finally {
      setPendingToggle(false);
    }
  };

  return (
    <>
      <AdminNavbar />
      <AdminSidebar
        activePage="maintenance"
      />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className={`mt-20 p-6 md:p-8 min-h-screen bg-gray-50 transition-all duration-500 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="w-full max-w-[1920px] mx-auto">

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight font-sans">
              LỊCH BẢO <span className="text-[#E4002B]">TRÌ</span>
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
              Quản lý lịch bảo trì hệ thống
            </p>
          </div>

          {/* Filter Bar */}
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
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm kiếm phiếu bảo trì..."
                    className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200"
                  />
                </div>
              </div>

              {/* Create Button */}
              <div className="w-full md:w-auto shrink-0">
                <button
                  onClick={handleCreateMaintenance}
                  className="w-full md:w-auto px-6 py-3 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition-all h-[46px]"
                >
                  + Tạo Phiếu Bảo Trì
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Status Filter */}
              <div className="flex-1 w-full">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2 flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    statusFilter === 'all' || !statusFilter
                      ? 'bg-gray-300'
                      : statusFilter === 'Scheduled'
                        ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                        : statusFilter === 'Ongoing'
                          ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'
                          : statusFilter === 'Done'
                            ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                            : 'bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]'
                  }`}></span>
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
                      {statusFilter === 'all' || !statusFilter ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                          <span className="text-gray-700">Tất cả</span>
                        </>
                      ) : statusFilter === 'Scheduled' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                          <span className="text-gray-900">Sắp Tới</span>
                        </>
                      ) : statusFilter === 'Ongoing' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                          <span className="text-gray-900">Đang Thực Hiện</span>
                        </>
                      ) : statusFilter === 'Done' ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
                          <span className="text-gray-900">Hoàn Thành</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></span>
                          <span className="text-gray-900">Đã Hủy</span>
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
                        onMouseDown={(e) => { e.preventDefault(); setStatusFilter('all'); setCurrentPage(1); setIsStatusDropdownOpen(false); }}
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <span className="font-medium text-gray-700">Tất cả</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-yellow-50 transition-colors flex items-center gap-3"
                        onMouseDown={(e) => { e.preventDefault(); setStatusFilter('Scheduled'); setCurrentPage(1); setIsStatusDropdownOpen(false); }}
                      >
                        <div className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]"></div>
                        <span className="font-bold text-gray-900">Sắp Tới</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors flex items-center gap-3"
                        onMouseDown={(e) => { e.preventDefault(); setStatusFilter('Ongoing'); setCurrentPage(1); setIsStatusDropdownOpen(false); }}
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
                        <span className="font-bold text-gray-900">Đang Thực Hiện</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-3"
                        onMouseDown={(e) => { e.preventDefault(); setStatusFilter('Done'); setCurrentPage(1); setIsStatusDropdownOpen(false); }}
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
                        <span className="font-bold text-gray-900">Hoàn Thành</span>
                      </button>
                      <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 transition-colors flex items-center gap-3"
                        onMouseDown={(e) => { e.preventDefault(); setStatusFilter('Cancelled'); setCurrentPage(1); setIsStatusDropdownOpen(false); }}
                      >
                        <div className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></div>
                        <span className="font-bold text-gray-900">Đã Hủy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(searchKeyword || statusFilter !== 'all') && (
                <div className="w-full md:w-auto shrink-0 flex items-end">
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setSearchKeyword('');
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
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

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-x-auto w-full">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : fetchError ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{fetchError}</h3>
                <p className="text-sm text-gray-500 mb-6">Vui lòng kiểm tra server hoặc thử lại sau.</p>
                <button
                  onClick={() => { setFetchError(null); fetchMaintenanceList(); }}
                  className="px-6 py-3 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase hover:bg-red-700 transition-all cursor-pointer"
                >
                  Thử Lại
                </button>
              </div>
            ) : maintList.length === 0 ? (
              <div className="py-16 px-6 text-center">
                <EmptyState
                  type="maintenance"
                  action={{
                    label: '+ Tạo Phiếu Bảo Trì',
                    onClick: handleCreateMaintenance
                  }}
                />
              </div>
            ) : (
              <>
                <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                  <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[12%]">MÃ</th>
                      <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[18%]">NỘI DUNG</th>
                      <th className="px-4 md:px-6 py-5 hidden lg:table-cell text-center whitespace-nowrap w-[15%]">BẮT ĐẦU</th>
                      <th className="px-4 md:px-6 py-5 hidden lg:table-cell text-center whitespace-nowrap w-[15%]">KẾT THÚC</th>
                      <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[12%]">TRẠNG THÁI</th>
                      <th className="px-4 md:px-6 py-5 hidden md:table-cell text-center whitespace-nowrap w-[14%]">NGƯỜI TẠO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {maintList.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-red-50/50 transition-colors group"
                      >
                        <td className="px-4 md:px-6 py-5 cursor-pointer" onClick={() => setSelectedMaint(item)}>
                          <span className="font-bold text-gray-400 group-hover:text-[#E4002B]">#{item.id}</span>
                        </td>
                        <td className="px-4 md:px-6 py-5 cursor-pointer" onClick={() => setSelectedMaint(item)}>
                          <span className="font-bold text-gray-900 text-base line-clamp-1">{item.reason}</span>
                        </td>
                        <td className="px-4 md:px-6 py-5 hidden lg:table-cell text-center whitespace-nowrap cursor-pointer" onClick={() => setSelectedMaint(item)}>
                          <span className="text-sm text-gray-700">{formatDateTimeForDisplay(item.startTime)}</span>
                        </td>
                        <td className="px-4 md:px-6 py-5 hidden lg:table-cell text-center whitespace-nowrap cursor-pointer" onClick={() => setSelectedMaint(item)}>
                          <span className="text-sm text-gray-700">{formatDateTimeForDisplay(item.endTime)}</span>
                        </td>
                        <td className="px-4 md:px-6 py-5 text-center">
                          {item.status === 'Done' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full whitespace-nowrap">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Hoàn Thành
                            </span>
                          ) : item.status === 'Scheduled' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-black rounded-full whitespace-nowrap">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              Sắp Tới
                            </span>
                          ) : item.status === 'Ongoing' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full whitespace-nowrap">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              Đang Thực Hiện
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 text-[10px] font-black rounded-full whitespace-nowrap">
                              Đã Hủy
                            </span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-5 hidden md:table-cell text-center whitespace-nowrap cursor-pointer" onClick={() => setSelectedMaint(item)}>
                          <span className="font-bold text-gray-900">{item.createdBy}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCreate && <MaintFormCreate onClose={handleMaintenanceCreated} />}
      {selectedMaint && (
        <MaintDetailBox
          data={selectedMaint}
          onClose={handleMaintenanceUpdated}
          onUpdated={handleMaintenanceUpdated}
        />
      )}

      {/* Maintenance Mode Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full p-8 shadow-2xl">
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                pendingToggle ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {pendingToggle ? (
                  <svg className="w-8 h-8 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {pendingToggle ? 'Bật Chế Độ Bảo Trì?' : 'Tắt Chế Độ Bảo Trì?'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {pendingToggle
                  ? 'Người dùng sẽ không thể truy cập hệ thống cho đến khi bạn tắt chế độ bảo trì.'
                  : 'Hệ thống sẽ hoạt động trở lại bình thường và người dùng có thể truy cập.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmToggle}
                  className={`flex-1 px-6 py-3 font-bold rounded-xl transition-colors cursor-pointer ${
                    pendingToggle
                      ? 'bg-[#E4002B] text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {pendingToggle ? 'Bật' : 'Tắt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
