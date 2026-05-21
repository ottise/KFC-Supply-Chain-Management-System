"use client";

import React, { useState } from "react";
import { EnrichedInventoryItem } from "@/types/warehouse/inventoryAdjustment";
import { useToast } from "@/components/ui/ToastProvider";

interface Props {
  onQuickAdd: (newItem: Partial<EnrichedInventoryItem>) => void;
}

const AdjustmentQuickAddRow: React.FC<Props> = ({ onQuickAdd }) => {
  const [newRow, setNewRow] = useState<Partial<EnrichedInventoryItem>>({
    ProductName: "",
    LotNumber: "",
    AssignedUser: "",
    CountedQty: ""
  });
  const { warning } = useToast();

  const handleAddRow = () => {
    if (!newRow.ProductName) {
      warning("Thiếu thông tin", "Vui lòng nhập tên sản phẩm.");
      return;
    }
    onQuickAdd(newRow);
    setNewRow({
      ProductName: "",
      LotNumber: "",
      AssignedUser: "",
      CountedQty: ""
    });
  };

  return (
    <tr className="bg-gray-50/50 group border-l-4 border-dashed border-gray-200 hover:border-[#E4002B] transition-all">
      <td className="px-6 py-5 flex items-center justify-center">
        <button 
          onClick={handleAddRow}
          className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:bg-[#E4002B] hover:text-white transition-all font-black text-lg"
        >
          +
        </button>
      </td>
      <td className="px-4 py-4 italic text-gray-400">
        (Tự động điền)
      </td>
      <td className="px-6 py-4">
        <input
          type="text"
          placeholder="Nhập sản phẩm..."
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-full text-[10px] font-bold outline-none focus:border-[#E4002B] transition-all"
          value={newRow.ProductName}
          onChange={(e) => setNewRow({...newRow, ProductName: e.target.value})}
        />
      </td>
      <td className="px-6 py-4">
        <input
          type="text"
          placeholder="Nhập số lô..."
          className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-full text-[10px] font-bold outline-none focus:border-[#E4002B] transition-all"
          value={newRow.LotNumber}
          onChange={(e) => setNewRow({...newRow, LotNumber: e.target.value})}
        />
      </td>
      <td colSpan={2} className="px-6 py-4 text-center italic text-gray-400">
        (Sẽ sử dụng giá trị mặc định hệ thống)
      </td>
      <td className="px-6 py-4 text-center font-mono font-bold text-gray-300">
        0
      </td>
      <td className="px-6 py-4 text-center">
         <input
            type="number"
            value={newRow.CountedQty}
            onChange={(e) => setNewRow({...newRow, CountedQty: e.target.value === "" ? "" : Number(e.target.value)})}
            className="w-16 py-1.5 text-center bg-white border border-gray-200 rounded-lg font-black text-xs outline-none focus:border-[#E4002B] transition-all"
            placeholder="0"
          />
      </td>
      <td className="px-6 py-4"></td>
    </tr>
  );
};

export default AdjustmentQuickAddRow;
