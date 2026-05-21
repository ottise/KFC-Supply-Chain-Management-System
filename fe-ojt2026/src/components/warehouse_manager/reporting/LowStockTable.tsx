"use client";

import { useState, useEffect, useCallback } from "react";
import { reorderingRuleApi, type ReorderingRuleWarningDto } from "@/lib/api/warehouse/reorderingRuleApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { Loader2, ChevronLeft, ChevronRight, LayoutGrid, MapPin, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface LowStockTableProps {
  warehouseId?: number;
}

const WAREHOUSE_COLORS = [
  'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]',
  'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
  'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
  'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
  'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
  'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
];

export default function LowStockTable({ warehouseId: propWarehouseId }: LowStockTableProps) {
  const [items, setItems] = useState<ReorderingRuleWarningDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 5;

  // Filter
  const [warehouses, setWarehouses] = useState<{ Id: number, Name: string }[]>([]);
  const [localWarehouseId, setLocalWarehouseId] = useState<number | undefined>(propWarehouseId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync propWarehouseId
  useEffect(() => {
    setLocalWarehouseId(propWarehouseId);
    setPage(1);
  }, [propWarehouseId]);

  // Fetch warehouses
  useEffect(() => {
    const fetchWS = async () => {
      try {
        const data = await warehouseApi.getWarehousesForCurrentUser();
        const list = Array.isArray(data) ? data : (data?.Items || []);
        setWarehouses(list);
      } catch (err) {
        console.error("Failed to fetch warehouses:", err);
      }
    };
    fetchWS();
  }, []);

  const fetchWarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reorderingRuleApi.getWarnings({
        page,
        pageSize,
        warehouseId: localWarehouseId
      });
      setItems(response.Items || []);
      setTotalPages(response.TotalPages || 1);
      setTotalItems(response.TotalItems || 0);
    } catch (err) {
      console.error("Failed to fetch warnings:", err);
      setError("Không thể tải danh sách cảnh báo.");
    } finally {
      setLoading(false);
    }
  }, [page, localWarehouseId]);

  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 2) { start = 2; end = 3; }
      if (page >= totalPages - 1) { start = totalPages - 2; end = totalPages - 1; }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const selectedWarehouse = warehouses.find(w => w.Id === localWarehouseId);
  const getWColor = (id: number) => {
    const idx = warehouses.findIndex(w => w.Id === id);
    return WAREHOUSE_COLORS[idx % WAREHOUSE_COLORS.length];
  };

  return (
    <div className="bg-[#0B1120] p-6 rounded-[2.5rem] shadow-2xl text-white flex flex-col h-[650px] border border-white/5 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 className="font-black uppercase text-[11px] tracking-[0.2em] text-gray-500 mb-0.5">Cảnh báo tồn kho</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-white">{totalItems}</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest translate-y-[1px]">Sản phẩm dưới mức an toàn</span>
          </div>
        </div>

        {/* Custom Warehouse Dropdown Styled after Warehouse Product Filter */}
        <div className="relative w-[350px]">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className="w-full flex items-center justify-between px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group origin-right"
          >
            <div className="flex items-center gap-3">
              {selectedWarehouse ? (
                <>
                  <div className={`w-1.5 h-1.5 rounded-full ${getWColor(selectedWarehouse.Id)} animate-pulse`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#E4002B]">{selectedWarehouse.Name}</span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">Tất cả kho</span>
                </>
              )}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-[#111827] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl origin-top-right">
              <button
                onMouseDown={(e) => { e.preventDefault(); setLocalWarehouseId(undefined); setPage(1); setIsDropdownOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-600"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tất cả kho</span>
              </button>
              {warehouses.map((w) => (
                <button
                  key={w.Id}
                  onMouseDown={(e) => { e.preventDefault(); setLocalWarehouseId(w.Id); setPage(1); setIsDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-all"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${getWColor(w.Id)}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{w.Name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Area - Fixed Height for Stability */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Đang quét hệ thống tồn kho...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center bg-red-500/5 rounded-[1.5rem] border border-red-500/10">
            <p className="text-red-400 text-[10px] font-bold">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
              <LayoutGrid className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Tồn kho đang ở mức an toàn tuyệt đối</p>
          </div>
        ) : (
          <div className="animate-in fade-in duration-700 space-y-3">
            {items.map((item) => {
              const deficit = Math.max(0, item.MinQty - item.CurrentAvailableQty);
              const progressRatio = Math.min(100, (item.CurrentAvailableQty / item.MinQty) * 100);

              return (
                <div key={item.RuleId} className="group bg-white/[0.02] border border-white/5 px-4 rounded-[1.2rem] hover:bg-white/[0.04] transition-all relative overflow-hidden h-20 flex items-center">
                  <div className="flex w-full gap-4 items-center">
                    {/* Identity - flex-1 takes remaining space */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-black text-[13px] uppercase tracking-tight text-white leading-none truncate">
                        {item.ProductName}
                      </h4>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <div className={`w-1 h-1 rounded-full ${getWColor(item.WarehouseId)}`}></div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest truncate max-w-full">{item.WarehouseName}</span>
                      </div>
                    </div>

                    {/* Stock Ruler Indicator - Fixed 700px */}
                    <div className="w-[650px] space-y-1.5 px-4">
                      <div className="flex justify-end">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          Tồn kho hiện tại: <span className="text-[#E4002B] text-sm ml-1">{item.CurrentAvailableQty} {item.BaseUomName}</span>
                        </p>
                      </div>

                      <div className="relative h-4 flex items-center">
                        <div className="absolute inset-x-0 h-[1px] bg-white/10"></div>
                        <div className="absolute inset-x-0 h-3 flex justify-between px-[1px]">
                          {[...Array(21)].map((_, i) => (
                            <div key={i} className={`w-[1px] h-full ${i % 5 === 0 ? 'bg-white/20 h-full' : 'bg-white/10 h-1/2 mt-auto'}`}></div>
                          ))}
                        </div>

                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#E4002B] shadow-[0_0_10px_rgba(228,0,43,0.5)] transition-all duration-1000"
                          style={{ width: `${progressRatio}%` }}
                        ></div>

                        <div
                          className="absolute h-4 w-1 bg-white shadow-[0_0_8px_white] transition-all duration-1000 top-1/2 -translate-y-1/2"
                          style={{ left: `calc(${progressRatio}% - 2px)` }}
                        ></div>
                      </div>

                      <div className="flex justify-start">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                          Mức tồn kho an toàn: <span className="text-gray-400 ml-1">{item.MinQty}</span>
                        </p>
                      </div>
                    </div>

                    {/* Deficit - Fixed 140px, Left Aligned */}
                    <div className="w-[140px] border-l border-white/5 flex flex-col items-start justify-center px-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Thiếu hụt</p>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#E4002B] animate-pulse" />
                        <p className="text-[#E4002B] font-black text-base tracking-tight">
                          {deficit}
                        </p>
                      </div>
                    </div>

                    {/* Action - Fixed 100px, Left Aligned */}
                    <div className="w-[100px] flex flex-col items-start justify-center pr-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 whitespace-nowrap">Hành động</p>
                      <Link
                        href="/warehouse_manager/replenishment"
                        className="w-full py-1.5 bg-[#FABA3C] hover:bg-[#E5A932] text-black font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center transition-all shadow-lg shadow-yellow-900/20 active:scale-95"
                      >
                        Đặt hàng
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Re-styled Ellipsis Pagination - Fixed at Bottom */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-[11px] font-black text-gray-600 uppercase tracking-[0.2em]">
          Hiển thị <span className="text-white">{(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalItems)}</span> của {totalItems} sản phẩm
        </div>

        <div className="flex items-center gap-1.5 scale-90 origin-right">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-10 transition-all text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {getPageNumbers().map((p, idx) => (
              <button
                key={idx}
                onClick={() => typeof p === 'number' && handlePageChange(p)}
                disabled={p === '...'}
                className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg text-[13px] font-black transition-all ${p === page
                  ? 'bg-[#E4002B] text-white shadow-lg shadow-red-900/40'
                  : p === '...'
                    ? 'text-gray-600 cursor-default'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 disabled:opacity-10 transition-all text-gray-400 hover:text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}