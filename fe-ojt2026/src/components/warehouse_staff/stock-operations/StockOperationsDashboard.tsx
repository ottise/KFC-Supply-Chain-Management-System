"use client";

import { useState } from "react";
import TransferTable from "./TransferTable";
import TransferDetailBox from "./TransferDetailBox";
import CreateOperationForm from "./CreateOperationForm";
import StockFilter from "./StockFilter";
import StockPagination from "./StockPagination";
// IMPORT HOOK MỚI
import { useOutTransfers } from '@/hooks/useWarehouse';
import { Transfer } from "@/types/warehouse";

export default function StockOperationsDashboard() {
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // 1. SỬ DỤNG HOOK THAY CHO MOCK DATA
  // rowsPerPage = 6 khớp với thiết kế cũ của bạn
  const {
    transfers,
    loading,
    error,
    pagination,
    refresh,
    changePage,
    search: triggerSearch,
    filterStatus,
    filterDates
  } = useOutTransfers(1, 6);

  // 2. XỬ LÝ LỌC DỮ LIỆU QUA API (Không dùng useMemo filter client nữa)
  const handleSearch = (v: string) => {
    triggerSearch(v); // Hook sẽ tự reset về trang 1 và gọi API
  };

  const handleStatusFilter = (status: string) => {
    filterStatus(status);
  };

  const handleDateChange = (from: string, to: string, type: 'created' | 'planned') => {
    filterDates(from, to, type);
  };

  // 3. XỬ LÝ LƯU PHIẾU MỚI
  const handleCreateSuccess = async () => {
    setShowCreate(false);
    await refresh(); // Chỉ load lại danh sách, không tự mở chi tiết phiếu mới
  };

  const rawTotalPages = pagination.totalPages;
  const displayTotalPages = rawTotalPages > 0 ? rawTotalPages : 1;
  const hasNext = rawTotalPages > 0 && pagination.currentPage < rawTotalPages;
  const hasPrevious = pagination.currentPage > 1;

  return (
    <div className="space-y-6 relative animate-in fade-in duration-500">

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest border border-red-100">
          Lỗi: {error}
        </div>
      )}

      <StockFilter
        onSearch={handleSearch}
        onCreateClick={() => setShowCreate(true)}
        onStatusFilter={handleStatusFilter}
        onDateChange={handleDateChange}
      />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">

        {loading && (
          <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}

        {/* BẢNG DỮ LIỆU THẬT */}
        <TransferTable
          transfers={transfers}
          onSelect={setSelectedTransfer}
        />
      </div>

      <StockPagination
        currentPage={pagination.currentPage}
        totalPages={displayTotalPages}
        totalItems={pagination.totalItems}
        pageSize={6}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onPageChange={changePage}
      />

      {/* Detail Box */}
      {selectedTransfer && (
        <TransferDetailBox
          transfer={selectedTransfer}
          onClose={() => setSelectedTransfer(null)}
          onUpdate={refresh} // Refresh lại danh sách sau khi update
          onStatusChange={refresh} // Thêm callback load lại trang khi đổi trạng thái
        />
      )}

      {/* Create Form */}
      {showCreate && (
        <CreateOperationForm
          onClose={() => setShowCreate(false)}
          onSave={handleCreateSuccess}
        />
      )}
    </div>
  );
}