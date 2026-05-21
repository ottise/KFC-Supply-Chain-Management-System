"use client";

import { useState } from "react";
import { productWarehouseApi, type ProductWarehouseItem } from "@/lib/api/warehouse/productWarehouseApi";
import { reorderingRuleApi } from "@/lib/api/warehouse/reorderingRuleApi";
import { useToast } from "@/components/ui/ToastProvider";
import { formatVND } from "@/lib/utils/warehouseUtils";
import type { Category } from "@/types/warehouse/masterData";

interface WarehouseProductTableProps {
    items: ProductWarehouseItem[];
    categories: Category[];
    onStatusChange: () => void;
    onRemove: () => void;
}

export default function WarehouseProductTable({ items, categories, onStatusChange }: WarehouseProductTableProps) {
    const { success: showSuccess, error: showError } = useToast();
    const [togglingId, setTogglingId] = useState<number | null>(null);

    // Inline edit state for Min/Max
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editMin, setEditMin] = useState("");
    const [editMax, setEditMax] = useState("");
    const [savingId, setSavingId] = useState<number | null>(null);

    const categoryColors = [
        'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]',
        'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
        'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
        'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
        'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
        'bg-amber-500 shadow-[0_0_8_rgba(245,158,11,0.4)]',
        'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
        'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
        'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]',
    ];
    const getCategoryColor = (categoryId: number | null) => {
        if (categoryId === null) return 'bg-gray-300';
        const idx = categories.findIndex(c => c.Id === categoryId);
        return idx >= 0 ? categoryColors[idx % categoryColors.length] : 'bg-gray-300';
    };

    const handleToggleStatus = async (e: React.MouseEvent, item: ProductWarehouseItem) => {
        e.stopPropagation();
        if (togglingId === item.Id) return;
        setTogglingId(item.Id);
        try {
            await productWarehouseApi.changeStatus(item.Id, !item.IsActive);
            showSuccess("Thành công", item.IsActive ? "Đã tắt hoạt động sản phẩm trong kho." : "Đã kích hoạt sản phẩm trong kho.");
            onStatusChange();
        } catch {
            showError("Thất bại", "Không thể thay đổi trạng thái.");
        } finally {
            setTogglingId(null);
        }
    };

    const handleStartEdit = (item: ProductWarehouseItem) => {
        if (!item.IsActive) return;
        setEditingId(item.Id);
        setEditMin(item.MinQty?.toString() ?? "");
        setEditMax(item.MaxQty?.toString() ?? "");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditMin("");
        setEditMax("");
    };

    const handleSaveRule = async (item: ProductWarehouseItem) => {
        const minVal = parseFloat(editMin);
        const maxVal = editMax.trim() === "" ? null : parseFloat(editMax);
        const MAX_LIMIT = 100000000000;

        // Validation
        if (isNaN(minVal) || minVal <= 0 || !Number.isInteger(minVal)) {
            showError("Lỗi hệ thống", "Số lượng tối thiểu (Min) phải là số nguyên lớn hơn 0.");
            return;
        }

        if (minVal > MAX_LIMIT) {
            showError("Lỗi hệ thống", "Số lượng tối thiểu (Min) không được vượt quá 100 tỷ.");
            return;
        }

        if (maxVal !== null) {
            if (isNaN(maxVal) || maxVal <= 0 || !Number.isInteger(maxVal)) {
                showError("Lỗi hệ thống", "Số lượng tối đa (Max) phải là số nguyên lớn hơn 0.");
                return;
            }
            if (maxVal > MAX_LIMIT) {
                showError("Lỗi hệ thống", "Số lượng tối đa (Max) không được vượt quá 100 tỷ.");
                return;
            }
            if (maxVal <= minVal) {
                showError("Lỗi hệ thống", "Số lượng tối đa (Max) phải lớn hơn Số lượng tối thiểu (Min).");
                return;
            }
        }

        setSavingId(item.Id);
        try {
            const data = {
                MinQty: minVal,
                MaxQty: maxVal,
            };

            if (item.HasReorderingRule) {
                await reorderingRuleApi.update(item.Id, data);
                showSuccess("Thành công", "Đã cập nhật quy tắc tồn kho.");
            } else {
                await reorderingRuleApi.create({ ProductWarehouseId: item.Id, ...data });
                showSuccess("Thành công", "Đã tạo quy tắc tồn kho.");
            }
            setEditingId(null);
            onStatusChange(); // refresh data
        } catch {
            showError("Thất bại", "Không thể lưu quy tắc tồn kho.");
        } finally {
            setSavingId(null);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "---";
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className="w-full relative bg-white rounded-t-3xl overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-sm">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <th className="px-4 py-5 text-left border-b border-gray-100 w-[15%]">SKU</th>
                        <th className="px-4 py-5 text-left border-b border-gray-100 w-[20%]">Sản Phẩm</th>
                        <th className="px-4 py-5 text-left border-b border-gray-100 w-[10%]">Danh Mục</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[10%]">Giá bán</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[8%]">Đơn vị</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[8%]">Tối Thiểu</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[8%]">Tối Đa</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[9%]">Ngày Thêm</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[6%]">Trạng Thái</th>
                        <th className="px-4 py-5 text-center border-b border-gray-100 w-[6%]">Rule</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <tr key={item.Id} className="hover:bg-gray-50/80 transition-all group">
                                <td className="px-4 py-4">
                                    <span className="text-xs font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors">{item.ProductCode || "---"}</span>
                                </td>
                                <td className="px-4 py-4">
                                    <p className="text-xs font-bold text-gray-900">{item.ProductName}</p>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(item.CategoryId)}`}></div>
                                        <span className="text-[10px] font-bold text-gray-400">{item.CategoryName || "---"}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="text-xs font-black text-[#E4002B]">
                                        {item.SalePrice ? formatVND(item.SalePrice) : "---"}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <span className="text-[10px] font-black text-gray-900">{item.BaseUomName || "---"}</span>
                                </td>

                                {/* Min / Max columns */}
                                {editingId === item.Id ? (
                                    <>
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={editMin}
                                                onChange={(e) => setEditMin(e.target.value.replace(/[^0-9]/g, ""))}
                                                className="w-16 px-2 py-1.5 text-xs text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none"
                                                placeholder="Min"
                                            />
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={editMax}
                                                onChange={(e) => setEditMax(e.target.value.replace(/[^0-9]/g, ""))}
                                                className="w-16 px-2 py-1.5 text-xs text-center bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none"
                                                placeholder="Max"
                                            />
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`text-xs font-bold ${item.MinQty != null ? 'text-gray-700' : 'text-gray-300'}`}>
                                                {item.MinQty != null ? item.MinQty : "---"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`text-xs font-bold ${item.MaxQty != null ? 'text-gray-700' : 'text-gray-300'}`}>
                                                {item.MaxQty != null ? item.MaxQty : "---"}
                                            </span>
                                        </td>
                                    </>
                                )}

                                <td className="px-4 py-4 text-center">
                                    <span className="text-xs font-semibold text-gray-500">{formatDate(item.CreatedAt)}</span>
                                </td>
                                <td className="px-4 py-4 text-center">
                                    <div className="flex items-center justify-center">
                                        <button
                                            onClick={(e) => handleToggleStatus(e, item)}
                                            disabled={togglingId === item.Id}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 shadow-inner transition-colors focus:outline-none ${item.IsActive ? 'bg-red-500' : 'bg-gray-300'} ${togglingId === item.Id ? 'opacity-50 cursor-wait' : ''}`}
                                        >
                                            <span className="sr-only">Toggle status</span>
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-md ${item.IsActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </td>

                                {/* Rule action column */}
                                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                    {editingId === item.Id ? (
                                        <div className="flex items-center gap-1 justify-center">
                                            <button
                                                onClick={() => handleSaveRule(item)}
                                                disabled={savingId === item.Id}
                                                className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-md border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                            >
                                                {savingId === item.Id ? "..." : "Lưu"}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-2 py-1 bg-gray-50 text-gray-500 text-[9px] font-bold rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleStartEdit(item)}
                                            disabled={!item.IsActive}
                                            className={`px-2 py-1 text-[9px] font-bold uppercase tracking-tight rounded-md border transition-colors ${!item.IsActive
                                                ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60"
                                                : item.HasReorderingRule
                                                    ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                                                    : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                                }`}
                                        >
                                            {item.HasReorderingRule ? "Sửa" : "+ Rule"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr className="h-[73px]">
                            <td colSpan={10} className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Không có dữ liệu phù hợp</p>
                            </td>
                        </tr>
                    )}

                    {items.length < 5 && Array.from({ length: 5 - Math.max(items.length, 1) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-[73px]">
                            <td colSpan={10}></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
