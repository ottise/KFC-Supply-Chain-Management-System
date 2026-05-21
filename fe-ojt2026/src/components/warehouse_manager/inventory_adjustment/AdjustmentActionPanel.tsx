"use client";

import React from "react";
import { Loader2, FileEdit, Printer, ListChecks, Trash2, Calendar, User as UserIcon, Clock } from "lucide-react";
import { User } from "@/types/user";
import OdooSelect from "@/components/common/OdooSelect";

interface Props {
  selectedCount: number;
  isApplying: boolean;
  onApply: () => void;
  onClearSelection: () => void;
  // New batch props
  employees: User[];
  batchDate: string;
  onBatchDateChange: (date: string) => void;
  batchAssigneeId: number | null;
  onBatchAssigneeChange: (id: number | null) => void;
  onSaveDraft: () => void;
}

const AdjustmentActionPanel: React.FC<Props> = ({
  selectedCount,
  isApplying,
  onApply,
  onClearSelection,
  employees,
  batchDate,
  onBatchDateChange,
  batchAssigneeId,
  onBatchAssigneeChange,
  onSaveDraft
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#E4002B] text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom duration-300 z-[100] border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-4 border-r border-white/20 pr-6">
        <div className="w-10 h-10 bg-white text-[#E4002B] rounded-2xl flex items-center justify-center font-black text-base shadow-sm">
          {selectedCount}
        </div>
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/90">Đã chọn</p>
          <p className="text-[9px] text-white/60 font-bold uppercase truncate max-w-[100px]">
            {selectedCount} mặt hàng
          </p>
        </div>
      </div>

      {/* Batch Inputs Section */}
      <div className="flex items-center gap-4 border-r border-white/20 pr-6">
        {/* Date Input */}
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-black uppercase tracking-tighter text-white/70 ml-1">Ngày thực hiện:</span>
          <div className="relative group">
            <input
              type="date"
              value={batchDate}
              onChange={(e) => onBatchDateChange(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:bg-white/20 focus:border-white/40 transition-all w-[130px] h-9 text-white [color-scheme:dark]"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none group-focus-within:text-white transition-colors" />
          </div>
        </div>

        {/* Assignee Select */}
        <OdooSelect
          label="Phân công"
          placeholder="Chọn người..."
          options={employees.map(emp => ({ id: emp.Id, name: emp.Fullname }))}
          value={batchAssigneeId}
          onChange={onBatchAssigneeChange}
          icon={UserIcon}
          portal={true}
          className="w-[280px]"
          dropdownClassName="w-[300px]"
        />
      </div>

      <div className="flex items-center gap-6">
        {/* Lên Lịch (Draft) */}
        <button
          onClick={onSaveDraft}
          disabled={isApplying}
          className="flex flex-col items-center gap-1 group disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all border border-white/10 shadow-sm">
            {isApplying ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Clock className="w-5 h-5 text-white" />}
          </div>
          <span className="text-[8px] font-black uppercase tracking-tighter text-white/90">Lên lịch</span>
        </button>

        {/* Áp dụng (Complete) */}
        <button
          onClick={onApply}
          disabled={isApplying}
          className="flex flex-col items-center gap-1 group disabled:opacity-50"
        >
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-all shadow-lg shadow-black/10">
            {isApplying ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <FileEdit className="w-5 h-5 text-white" />}
          </div>
          <span className="text-[8px] font-black uppercase tracking-tighter text-white/90">Áp dụng trực tiếp</span>
        </button>

        {/* Xóa chọn */}
        <button
          onClick={onClearSelection}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center group-hover:bg-black/30 transition-all border border-white/5">
            <Trash2 className="w-5 h-5 text-white/70" />
          </div>
          <span className="text-[8px] font-black uppercase tracking-tighter text-white/50">Xóa chọn</span>
        </button>
      </div>
    </div>
  );
};

export default AdjustmentActionPanel;
