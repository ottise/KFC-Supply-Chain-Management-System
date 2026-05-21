"use client";

import React, { useState } from "react";
import type { Location } from "@/types/warehouse/locations";

interface Props {
  locations: Location[];
  onRowClick: (l: Location) => void;
  onToggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  currentPage: number;
  pageSize: number;
  locationMap?: Record<number, string>;
}

export default function LocationTable({
  locations,
  onRowClick,
  onToggleStatus,
  currentPage,
  pageSize,
  locationMap,
}: Props) {
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggle = async (e: React.MouseEvent, loc: Location) => {
    e.stopPropagation();
    if (togglingId === loc.Id) return;

    setTogglingId(loc.Id);
    try {
      await onToggleStatus(loc.Id, loc.IsActive);
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
            <th className="px-6 py-5 text-left border-b border-gray-100 w-[42%]">Tên Vị Trí / Khu Vực</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[15%]">Loại</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[15%]">Kho (WH ID)</th>
            <th className="px-6 py-5 text-center border-b border-gray-100 w-[15%]">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {locations.length > 0 ? (
            locations.map((loc, index) => (
              <tr
                key={loc.Id}
                onClick={() => onRowClick(loc)}
                className="hover:bg-gray-50/80 cursor-pointer border-b border-gray-50 last:border-none transition-all group"
              >
                <td className="px-6 py-5 text-center font-bold text-gray-500">
                  {(currentPage - 1) * pageSize + index + 1}
                </td>
                <td className="px-6 py-5 text-left">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight">
                    {loc.Name}
                  </p>
                  {loc.ParentId && (
                    <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-gray-400 group-hover:text-gray-500 transition-colors">
                      | {locationMap?.[loc.ParentId] || `ID ${loc.ParentId}`}
                    </p>
                  )}
                </td>
                <td className="px-6 py-5 text-center">
                  <span
                    className={`inline-flex min-w-[82px] items-center justify-center rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${loc.Type === "View" ? "border-blue-100 bg-blue-50 text-blue-600" : "border-violet-100 bg-violet-50 text-violet-600"
                      }`}
                  >
                    {loc.Type}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <p className="text-xs font-black uppercase text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight">
                    WH-{loc.WarehouseId}
                  </p>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => handleToggle(e, loc)}
                      disabled={togglingId === loc.Id}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${loc.IsActive ? "bg-[#E4002B]" : "bg-gray-200"
                        } ${togglingId === loc.Id ? "opacity-50 cursor-wait" : ""}`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${loc.IsActive ? "translate-x-5" : "translate-x-0"
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
          {locations.length < 5 &&
            Array.from({ length: 5 - Math.max(locations.length, 1) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-[73px]">
                <td colSpan={5}></td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}