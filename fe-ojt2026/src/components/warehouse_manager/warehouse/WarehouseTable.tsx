"use client";

import React, { useState } from "react";
import type { Warehouse } from "@/types/warehouse/warehouse";

interface Props {
  warehouses: Warehouse[];
  onRowClick: (wh: Warehouse) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  currentPage: number;
  pageSize: number;
}

export default function WarehouseTable({
  warehouses,
  onRowClick,
  onToggleStatus,
  currentPage,
  pageSize,
}: Props) {
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggle = async (e: React.MouseEvent, wh: Warehouse) => {
    e.stopPropagation();
    if (togglingId === wh.Id) return;

    setTogglingId(wh.Id);
    try {
      await onToggleStatus(wh.Id, wh.IsActive);
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái:", error);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="w-full relative bg-white rounded-t-3xl">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-sm">
          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[8%]">STT</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[15%]">Mã Kho</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[25%]">Tên Kho</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[32%]">Địa Chỉ</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[20%]">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {warehouses.length > 0 ? (
            warehouses.map((wh, index) => (
              <tr
                key={wh.Id}
                onClick={() => onRowClick(wh)}
                className="hover:bg-gray-50/80 cursor-pointer border-b border-gray-50 last:border-none transition-all group"
              >
                <td className="px-6 py-5 text-center font-bold text-gray-500">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
                <td className="px-6 py-5 text-center">
                  <p className="text-xs font-black uppercase text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight">
                    {wh.WarehouseCode}
                  </p>
                </td>
                <td className="px-6 py-5 text-center">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#E4002B] transition-colors">
                    {wh.Name}
                  </p>
                </td>
                <td className="px-6 py-5 text-center">
                  <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">
                    {wh.Address || "-"}
                  </p>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => handleToggle(e, wh)}
                      disabled={togglingId === wh.Id}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        wh.IsActive ? "bg-[#E4002B]" : "bg-gray-200"
                      } ${togglingId === wh.Id ? "opacity-50 cursor-wait" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          wh.IsActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="h-[73px]">
              <td colSpan={5} className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                  Không có dữ liệu phù hợp
                </p>
              </td>
            </tr>
          )}

          {/* Fill empty rows to keep layout consistent */}
          {warehouses.length < 5 &&
            Array.from({ length: 5 - Math.max(warehouses.length, 1) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-[73px]">
                <td colSpan={5}></td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
