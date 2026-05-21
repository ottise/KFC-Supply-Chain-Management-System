/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from 'react';
import { StaffWorkItem } from '@/types/warehouse/inventoryAdjustment';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface Props {
    adjustments: StaffWorkItem[];
    onRefresh: () => void;
    loading?: boolean;
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    counts: { [key: number]: number | "" };
    onCountChange: (tranId: number, value: number | "") => void;
}

const InventoryAdjustmentTable: React.FC<Props> = ({
    adjustments,
    loading,
    selectedIds,
    onSelectionChange,
    counts,
    onCountChange
}) => {

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            onSelectionChange(adjustments.map(item => item.TranId));
        } else {
            onSelectionChange([]);
        }
    };

    const handleToggleSelect = (tranId: number) => {
        if (selectedIds.includes(tranId)) {
            onSelectionChange(selectedIds.filter(id => id !== tranId));
        } else {
            onSelectionChange([...selectedIds, tranId]);
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed border-collapse">
                <thead>
                    <tr>
                        <th className="w-[5%] px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B] cursor-pointer"
                                checked={adjustments.length > 0 && selectedIds.length === adjustments.length}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="w-[20%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Vị trí</th>
                        <th className="w-[25%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Sản phẩm</th>
                        <th className="w-[15%] px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Số lô</th>
                        <th className="w-[12%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Hiện có</th>
                        <th className="w-[13%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Đã đếm</th>
                        <th className="w-[10%] px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Chênh lệch</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-8 h-8 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-[10px] font-black uppercase text-gray-400">Đang tải công việc...</span>
                                </div>
                            </td>
                        </tr>
                    ) : adjustments.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-6 py-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">
                                Không có công việc nào
                            </td>
                        </tr>
                    ) : adjustments.map((item) => {
                        const countValue = counts[item.TranId] ?? "";
                        const diff = countValue !== "" ? (Number(countValue) - item.SystemQty) : 0;
                        const prodName = (item as any).ProductName || `SP #${item.ProductId}`;
                        const lotNo = (item as any).LotNumber || (item.LotId ? `Lot #${item.LotId}` : "N/A");
                        const hasNegativeError = countValue !== "" && Number(countValue) < 0;

                        return (
                            <tr
                                key={item.TranId}
                                className={`group hover:bg-red-50/20 transition-colors ${selectedIds.includes(item.TranId) ? 'bg-red-50/30' : ''}`}
                            >
                                <td className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B] cursor-pointer"
                                        checked={selectedIds.includes(item.TranId)}
                                        onChange={() => handleToggleSelect(item.TranId)}
                                    />
                                </td>
                                <td className="px-6 py-4 font-bold text-gray-500 text-[10px] uppercase" title={item.LocationName}>
                                    {item.LocationName}
                                </td>
                                <td className="px-6 py-4 font-black text-gray-900 text-[11px] uppercase">
                                    {prodName}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-500 text-[10px] uppercase">
                                    <span className="inline-flex px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-[9px] font-black">{lotNo}</span>
                                </td>
                                <td className="px-6 py-4 text-center font-mono font-black text-gray-700 text-xs">
                                    {item.SystemQty}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="relative inline-block">
                                        <input
                                            type="number"
                                            value={countValue}
                                            onChange={(e) => {
                                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                                if (val !== "" && (val as number) < 0) return;
                                                onCountChange(item.TranId, val);
                                            }}
                                            className="w-20 py-1.5 text-center border border-gray-200 rounded-lg font-black text-xs outline-none transition-all bg-white focus:border-[#E4002B] hover:border-gray-300 shadow-sm"
                                            placeholder="-"
                                            min={0}
                                        />
                                        {hasNegativeError && (
                                            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[9px] font-bold text-red-500 whitespace-nowrap bg-white border border-red-200 rounded px-1.5 py-0.5 shadow-sm z-10">
                                                Số đếm không được âm
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 min-w-[100px]">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${countValue !== "" && diff !== 0
                                            ? (diff > 0 ? "bg-blue-50 text-blue-600" : "bg-red-50 text-[#E4002B]")
                                            : "bg-gray-50 text-gray-400"
                                            }`}>
                                            {countValue !== "" && diff > 0 ? "+" : ""}{(countValue === "" || diff === 0) ? "0" : diff}
                                            {countValue !== "" && diff !== 0 && (
                                                diff > 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />
                                            )}
                                            {countValue !== "" && diff === 0 && <Minus className="w-2.5 h-2.5" />}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default InventoryAdjustmentTable;
