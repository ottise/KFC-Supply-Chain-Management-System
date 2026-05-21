"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, ArrowDown, Minus, Eraser, User as UserIcon, ChevronDown, ChevronUp, History } from "lucide-react";
import { EnrichedInventoryItem } from "@/types/warehouse/inventoryAdjustment";
import { User } from "@/types/user";

interface Props {
  item: EnrichedInventoryItem;
  isSelected: boolean;
  onToggleSelect: (id: number) => void;
  onCountChange: (id: number, value: number | "") => void;
  onAssigneeChange: (id: number, assigneeId: number) => void;
  onProductChange: (id: number, name: string) => void;
  onLotChange: (id: number, lot: string) => void;
  onScheduleChange: (id: number, date: string) => void;
  onClear: (id: number, transactionId?: number) => void;
  onShowHistory?: (item: EnrichedInventoryItem) => void;
  employees: User[];
}

const AdjustmentTableRow: React.FC<Props> = ({
  item,
  isSelected,
  onToggleSelect,
  onCountChange,
  onAssigneeChange,
  onProductChange,
  onLotChange,
  onScheduleChange,
  onClear,
  onShowHistory,
  employees = []
}) => {
  const diff = item.CountedQty !== "" ? (Number(item.CountedQty) - item.Quantity) : 0;
  const [countError, setCountError] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneeRef = useRef<HTMLDivElement>(null);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Only lock if: saved to backend (has TransactionId) + has assignee + NOT completed
  const isLocked = !!item.TransactionId && !!item.AssigneeId && item.Status !== "Completed";
  const selectedEmployee = employees.find(e => e.Id === item.AssigneeId);
  const assigneeLabel = selectedEmployee ? selectedEmployee.Fullname : "Chưa phân công";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <tr className={`group transition-colors ${isLocked ? 'bg-gray-50/40 opacity-60' : isSelected ? 'bg-red-50/30 hover:bg-red-50/30' : 'hover:bg-red-50/20'}`}>
      <td className="px-4 py-4">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B] cursor-pointer"
          checked={isSelected}
          onChange={() => onToggleSelect(item.Id)}
        />
      </td>

      <td className="px-6 py-4 font-bold text-gray-500 text-[10px] uppercase" title={item.Location.Name}>
        {item.Location.Name}
      </td>

      <td className="px-6 py-4 font-black text-gray-900 text-[11px] uppercase truncate max-w-[220px]" title={item.ProductName}>
        {item.isManual && !isLocked ? (
          <input
            type="text"
            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 w-full text-[10px] font-black focus:border-[#E4002B] outline-none"
            value={item.ProductName}
            onChange={(e) => onProductChange(item.Id, e.target.value)}
            placeholder="Tên sản phẩm..."
          />
        ) : (
          <span>{item.ProductName || `Prod #${item.ProductId}`}</span>
        )}
      </td>

      <td className="px-6 py-4 font-medium text-gray-500 text-[10px] uppercase">
        {item.isManual && !isLocked ? (
          <input
            type="text"
            className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 w-full text-[10px] font-black focus:border-[#E4002B] outline-none"
            value={item.LotNumber}
            onChange={(e) => onLotChange(item.Id, e.target.value)}
            placeholder="Số lô..."
          />
        ) : (
          <span className="inline-flex px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-[9px] font-black">{item.LotNumber || "N/A"}</span>
        )}
      </td>

      <td className="px-6 py-4">
        {isLocked ? (
          <span className="text-[10px] font-black text-gray-500">{item.ScheduledDate || "-"}</span>
        ) : (
          <input
            type="date"
            value={item.ScheduledDate || ""}
            onChange={(e) => onScheduleChange(item.Id, e.target.value)}
            min={minDate}
            className="bg-transparent border-none text-[10px] font-black text-gray-500 hover:text-[#E4002B] focus:ring-0 cursor-pointer p-0"
          />
        )}
      </td>

      {/* Compact Odoo-style Assignee Dropdown */}
      <td className="px-6 py-4">
        <div className="relative" ref={assigneeRef}>
          <div
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all min-w-[120px]
              ${isLocked
                ? 'bg-gray-100 border-gray-200 cursor-default'
                : assigneeOpen
                  ? 'bg-white border-[#E4002B]/40 ring-1 ring-[#E4002B]/10'
                  : 'bg-gray-50 border-gray-100 hover:border-gray-300 cursor-pointer'
              }`}
            onClick={() => !isLocked && setAssigneeOpen(!assigneeOpen)}
          >
            <UserIcon className={`w-2.5 h-2.5 flex-shrink-0 ${isLocked ? "text-[#E4002B]" : "text-gray-300"}`} />
            <span className={`text-[9px] font-bold uppercase tracking-tight truncate flex-1 ${isLocked ? 'text-gray-600' : 'text-gray-500'}`}>
              {assigneeLabel}
            </span>
            {!isLocked && (
              assigneeOpen
                ? <ChevronUp className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                : <ChevronDown className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {assigneeOpen && !isLocked && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white shadow-xl rounded-xl py-1.5 z-[200] border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="max-h-[160px] overflow-y-auto">
                <div
                  className="px-3 py-2 text-[9px] font-bold uppercase tracking-tight text-gray-400 cursor-pointer hover:bg-gray-50 hover:text-gray-600 transition-colors"
                  onClick={() => { onAssigneeChange(item.Id, 0); setAssigneeOpen(false); }}
                >
                  Chưa phân công
                </div>
                {employees.map((emp) => (
                  <div
                    key={emp.Id}
                    className={`px-3 py-2 text-[9px] font-bold uppercase tracking-tight cursor-pointer transition-colors flex items-center gap-1.5
                      ${item.AssigneeId === emp.Id ? 'text-[#E4002B] bg-[#E4002B]/5' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                    onClick={() => { onAssigneeChange(item.Id, emp.Id); setAssigneeOpen(false); }}
                  >
                    <UserIcon className="w-2.5 h-2.5 text-gray-400" />
                    {emp.Fullname}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 text-center font-mono font-black text-gray-700 text-xs">
        {item.Quantity}
      </td>

      <td className="px-6 py-4 text-center">
        {isLocked ? (
          <span className="text-xs font-black text-gray-500">{item.CountedQty !== "" ? item.CountedQty : "-"}</span>
        ) : (
          <div className="relative inline-block">
            <input
              type="number"
              value={item.CountedQty}
              onChange={(e) => {
                const val = e.target.value === "" ? "" : Number(e.target.value);
                if (val !== "" && (val as number) < 0) { setCountError(true); return; }
                setCountError(false);
                onCountChange(item.Id, val);
              }}
              className={`w-20 py-1.5 text-center border rounded-lg font-black text-xs outline-none transition-all bg-white shadow-sm ${countError ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-[#E4002B] hover:border-gray-300"}`}
              placeholder="-"
              min={0}
            />
            {countError && (
              <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[9px] font-bold text-red-500 whitespace-nowrap bg-white border border-red-200 rounded px-1.5 py-0.5 shadow-sm z-10">
                Số đếm không được âm
              </span>
            )}
          </div>
        )}
      </td>

      <td className="px-6 py-4 min-w-[100px]">
        <div className="flex items-center justify-end gap-1.5">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-black text-[11px] ${(item.CountedQty !== "" && diff !== 0)
            ? (diff > 0 ? "bg-blue-50 text-blue-600" : "bg-red-50 text-[#E4002B]")
            : "bg-gray-50 text-gray-400"
            }`}>
            {item.CountedQty !== "" && diff > 0 ? "+" : ""}{(item.CountedQty === "" || diff === 0) ? "0" : diff}
            {item.CountedQty !== "" && diff !== 0 && (
              diff > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />
            )}
            {item.CountedQty !== "" && diff === 0 && <Minus className="w-2.5 h-2.5" />}
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => onShowHistory?.(item)}
            title="Xem lịch sử dịch chuyển"
            className="p-1.5 rounded-lg text-gray-400 hover:text-[#E4002B] hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
          >
            <History className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onClear(item.Id, item.TransactionId)}
            disabled={item.CountedQty === "" || isLocked}
            title="Xóa số đếm"
            className={`p-1.5 rounded-lg transition-all ${item.CountedQty !== "" && !isLocked
              ? "text-gray-400 hover:text-[#E4002B] hover:bg-red-50"
              : "text-gray-200 cursor-not-allowed opacity-0 group-hover:opacity-100"
              }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default AdjustmentTableRow;
