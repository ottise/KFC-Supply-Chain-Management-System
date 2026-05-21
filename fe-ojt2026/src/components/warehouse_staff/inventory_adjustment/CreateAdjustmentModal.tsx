"use client";

import { useEffect, useState } from "react";
import { inventoryAdjustmentApi } from "@/lib/api/warehouse/inventoryAdjustmentApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { productWarehouseApi } from "@/lib/api/warehouse/productWarehouseApi";
import { useToast } from "@/components/ui/ToastProvider";

interface CreateAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    warehouseId?: number;
    warehouseName?: string;
}

interface InventoryItem {
    inventoryId: number;
    productId: number;
    productName: string;
    stock: number;
    actual: number | "";
}

export default function CreateAdjustmentModal({ isOpen, onClose, onSuccess, warehouseId, warehouseName }: CreateAdjustmentModalProps) {
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { success, error: showError, warning } = useToast();

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [invData, prodData] = await Promise.all([
                        inventoryAdjustmentApi.getInventories(warehouseId),
                        warehouseId
                            ? productWarehouseApi.getByWarehouse(warehouseId, { pageSize: 200 })
                            : productsApi.getProducts({ pageSize: 100 })
                    ]);

                    const prodItems = prodData.Items || [];
                    const prodMap = new Map<number, string>(prodItems.map((p: { ProductId?: number; Id?: number; ProductName?: string; Name?: string }) => [Number(p.ProductId || p.Id), String(p.ProductName || p.Name)]));

                    const mapped: InventoryItem[] = invData.map(item => ({
                        inventoryId: item.Id,
                        productId: item.ProductId,
                        productName: prodMap.get(item.ProductId) || `Sản phẩm #${item.ProductId}`,
                        stock: item.Quantity,
                        actual: ""
                    }));

                    setInventoryItems(mapped);
                } catch (error) {
                    console.error("Failed to fetch inventory for modal:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    const handleActualChange = (inventoryId: number, value: string) => {
        const num = value === "" ? "" : Number(value);
        setInventoryItems(prev =>
            prev.map(item =>
                item.inventoryId === inventoryId ? { ...item, actual: num } : item
            )
        );
    };

    const handleSubmit = async () => {
        const filledItems = inventoryItems.filter(i => i.actual !== "");

        if (filledItems.length === 0) {
            warning("Thiếu thông tin", "Vui lòng nhập ít nhất một mặt hàng thực tế!");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create Voucher
            const voucherResponse = await inventoryAdjustmentApi.createVoucher({
                CurrentInventoryIds: filledItems.map(i => i.inventoryId)
            });

            // Map transaction IDs back to items
            const completeList = filledItems.map(item => {
                const vItem = voucherResponse.Vouchers.find((v: { InventoryId?: number }) => v.InventoryId === item.inventoryId);
                return {
                    InventoryId: item.inventoryId,
                    Quantity: Number(item.actual),
                    TransactionId: vItem?.TransactionId || 0
                };
            });

            // 2. Complete Voucher
            await inventoryAdjustmentApi.completeVoucher({
                Origin: "Staff Inventory Adjustment",
                CompleteAdjustmentLists: completeList
            });

            success("Thành công", "Tạo phiếu kiểm kê thành công!");
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Failed to submit adjustment:", error);
            showError("Lỗi", "Có lỗi xảy ra khi tạo phiếu.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[998] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-white rounded-[32px] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Tạo Phiếu Kiểm Kê</h2>
                                <p className="text-xs font-bold text-gray-500 mt-1">Điền thông tin kiểm kê hàng hóa</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <div className="space-y-6">
                            {/* Info */}
                            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 mb-6">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kho đang thực hiện</p>
                                <p className="text-sm font-bold text-gray-900">{warehouseName || "WH/Main_Storage"}</p>
                            </div>

                            {/* Items Section */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Danh Sách Hàng Hóa Có Sẵn</h3>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="px-3 py-3 text-left font-black text-gray-400 text-xs uppercase">Sản phẩm</th>
                                                <th className="px-3 py-3 text-center font-black text-gray-400 text-xs uppercase">Hệ thống</th>
                                                <th className="px-3 py-3 text-center font-black text-gray-400 text-xs uppercase">Thực tế</th>
                                                <th className="px-3 py-3 text-center font-black text-gray-400 text-xs uppercase">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={4} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="w-8 h-8 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
                                                            <span className="text-[10px] font-black uppercase text-gray-400">Đang tải tồn kho...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : inventoryItems.map((item) => {
                                                const diff = item.actual === "" ? 0 : item.actual - item.stock;
                                                return (
                                                    <tr key={item.inventoryId} className="border-b border-gray-50 group hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-3 py-4">
                                                            <div className="font-bold text-gray-900 text-sm uppercase">{item.productName}</div>
                                                            <div className="text-[9px] font-bold text-gray-400 uppercase">ID: {item.inventoryId}</div>
                                                        </td>
                                                        <td className="px-3 py-4 text-center font-bold text-gray-400">
                                                            {item.stock}
                                                        </td>
                                                        <td className="px-3 py-4">
                                                            <input
                                                                type="number"
                                                                placeholder="0"
                                                                value={item.actual}
                                                                onChange={(e) => handleActualChange(item.inventoryId, e.target.value)}
                                                                className="w-full max-w-[100px] mx-auto block px-3 py-2 border border-gray-100 rounded-xl text-sm font-bold text-center focus:border-[#E4002B] focus:outline-none transition-all focus:bg-white"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-4 text-center">
                                                            <span
                                                                className={`text-[10px] font-black px-3 py-1 rounded-lg ${item.actual === "" ? "bg-gray-50 text-gray-300" :
                                                                    diff === 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                                                                    }`}
                                                            >
                                                                {item.actual === "" ? "-" : (diff > 0 ? "+" : "") + diff}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting || loading}
                                className="flex-1 px-6 py-4 bg-[#E4002B] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-red-100 disabled:opacity-50"
                            >
                                {submitting ? "Đang xử lý..." : "Hoàn tất kiểm kê"}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 border border-gray-200 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
