"use client";

import React from "react";
import { EnrichedInventoryItem } from "@/types/warehouse/inventoryAdjustment";
import { User } from "@/types/user";
import AdjustmentTableRow from "./AdjustmentTableRow";

interface Props {
  items: EnrichedInventoryItem[];
  onCountChange: (id: number, value: number | "") => void;
  onAssigneeChange: (id: number, assigneeId: number) => void;
  onProductChange: (id: number, name: string) => void;
  onLotChange: (id: number, lot: string) => void;
  onScheduleChange: (id: number, date: string) => void;
  loading?: boolean;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onClear: (id: number, transactionId?: number) => void;
  onShowHistory?: (item: EnrichedInventoryItem) => void;
  employees: User[];
}

const AdjustmentTable: React.FC<Props> = ({
  items,
  onCountChange,
  onAssigneeChange,
  onProductChange,
  onLotChange,
  onScheduleChange,
  loading,
  selectedIds,
  onSelectionChange,
  onClear,
  onShowHistory,
  employees
}) => {

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(items.map(item => item.Id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-[4%] px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B]"
                checked={items.length > 0 && selectedIds.length === items.length}
                onChange={handleSelectAll}
              />
            </th>
            <th className="w-[15%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Vị trí</th>
            <th className="w-[18%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Sản phẩm</th>
            <th className="w-[11%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Số lô</th>
            <th className="w-[12%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Ngày dự kiến</th>
            <th className="w-[14%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Người dùng</th>
            <th className="w-[7%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Hiện có</th>
            <th className="w-[8%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Đã đếm</th>
            <th className="w-[7%] px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Chênh lệch</th>
            <th className="w-[4%] px-4 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Lịch sử</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
          {loading ? (
            <tr>
              <td colSpan={10} className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black uppercase text-gray-400">Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : items.length > 0 ? items.map((item) => (
            <AdjustmentTableRow
              key={item.Id}
              item={item}
              isSelected={selectedIds.includes(item.Id)}
              onToggleSelect={handleToggleSelect}
              onCountChange={onCountChange}
              onAssigneeChange={onAssigneeChange}
              onProductChange={onProductChange}
              onLotChange={onLotChange}
              onScheduleChange={onScheduleChange}
              onClear={onClear}
              onShowHistory={onShowHistory}
              employees={employees}
            />
          )) : (
            <tr>
              <td
                colSpan={10}
                className="px-6 py-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest"
              >
                Không có dữ liệu
              </td>
            </tr>
          )}

        </tbody>
      </table>
    </div>
  );
};

export default AdjustmentTable;