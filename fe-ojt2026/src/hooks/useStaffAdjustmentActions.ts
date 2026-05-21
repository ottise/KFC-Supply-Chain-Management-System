/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { inventoryAdjustmentApi } from "@/lib/api/warehouse/inventoryAdjustmentApi";
import { toast } from "react-hot-toast";
import { StaffWorkItem } from "@/types/warehouse/inventoryAdjustment";

export interface UseStaffAdjustmentActionsProps {
    adjustments: StaffWorkItem[];
    onSuccess: () => void;
}

export interface UseStaffAdjustmentActionsResult {
    selectedIds: number[];
    setSelectedIds: (ids: number[]) => void;
    isUpdating: boolean;
    counts: { [key: number]: number | "" };
    handleCountChange: (tranId: number, value: number | "") => void;
    handleBulkUpdate: () => Promise<void>;
    handleComplete: () => Promise<void>;
}

export function useStaffAdjustmentActions({
    adjustments,
    onSuccess
}: UseStaffAdjustmentActionsProps): UseStaffAdjustmentActionsResult {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [counts, setCounts] = useState<{ [key: number]: number | "" }>({});

    // Initialize counts when adjustments change
    useEffect(() => {
        const initialCounts: { [key: number]: number | "" } = {};
        adjustments.forEach(item => {
            initialCounts[item.TranId] = (item.CountQty === null || item.CountQty === undefined) ? "" : item.CountQty;
        });
        setCounts(initialCounts);
    }, [adjustments]);

    const handleCountChange = (tranId: number, value: number | "") => {
        setCounts(prev => ({ ...prev, [tranId]: value }));
    };

    const handleBulkUpdate = async () => {
        if (selectedIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một công việc để cập nhật.");
            return;
        }

        const validItemsToUpdate = selectedIds.map(id => {
            const item = adjustments.find(a => a.TranId === id);
            return { id, item, count: counts[id] };
        }).filter(entry => entry.count !== "");

        if (validItemsToUpdate.length === 0) {
            toast.error("Vui lòng nhập số lượng đếm cho các mục đã chọn.");
            return;
        }

        setIsUpdating(true);
        const loadingToast = toast.loading(`Đang cập nhật ${validItemsToUpdate.length} mục...`);

        try {
            let successCount = 0;
            let failCount = 0;
            const errors: string[] = [];

            for (const entry of validItemsToUpdate) {
                try {
                    await inventoryAdjustmentApi.updateCount({
                        TranId: entry.id,
                        CountQty: Number(entry.count)
                    });
                    successCount++;
                } catch (error: any) {
                    failCount++;
                    const msg = error.message || "Lỗi không xác định";
                    const prodName = (entry.item as any)?.ProductName || `#${entry.id}`;
                    errors.push(`${prodName}: ${msg}`);
                }
            }

            if (successCount > 0) {
                toast.success(`💾 Cập nhật thành công ${successCount} mục!`, { id: loadingToast, duration: 4000 });
            } else {
                toast.error("⚠️ Không có mục nào được cập nhật.", { id: loadingToast });
            }

            if (failCount > 0) {
                errors.slice(0, 3).forEach(err => toast.error(err, { duration: 6000 }));
            }

            setSelectedIds([]);
            onSuccess();
        } catch (_error: any) {
            toast.error("❌ Lỗi hệ thống khi cập nhật.", { id: loadingToast });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleComplete = async () => {
        if (selectedIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một công việc để hoàn tất.");
            return;
        }

        const readyItems = selectedIds.map(id => {
            const item = adjustments.find(a => a.TranId === id);
            return { id, item, count: counts[id] };
        }).filter(entry => entry.count !== "");

        if (readyItems.length === 0) {
            toast.error("Vui lòng nhập số lượng đếm trước khi hoàn tất.");
            return;
        }

        setIsUpdating(true);
        const loadingToast = toast.loading(`🚀 Đang hoàn tất ${readyItems.length} mục...`);

        try {
            // Build the data for the completeAdjustment API (matching backend CompleteRequestDto)
            const finalData = readyItems.map(item => ({
                tranId: item.id,
                finalCountQty: Number(item.count)
            }));

            await inventoryAdjustmentApi.completeAdjustment(finalData);

            toast.success(`🎉 Chúc mừng! Đã hoàn tất ${readyItems.length} mục thành công!`, { id: loadingToast, duration: 4000 });
            setSelectedIds([]);
            onSuccess();
        } catch (error: any) {
            console.error("Finalization Error Detail:", error.response?.data || error);
            const errorMsg = typeof error.response?.data === 'string'
                ? error.response.data
                : (error.response?.data?.Message || error.message || "Hoàn tất thất bại.");
            toast.error(`❌ ${errorMsg}`, { id: loadingToast, duration: 6000 });
        } finally {
            setIsUpdating(false);
        }
    };

    return {
        selectedIds,
        setSelectedIds,
        isUpdating,
        counts,
        handleCountChange,
        handleBulkUpdate,
        handleComplete
    };
}
