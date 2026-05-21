/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { inventoryAdjustmentApi } from "@/lib/api/warehouse/inventoryAdjustmentApi";
import { UseAdjustmentActionsProps, UseAdjustmentActionsResult } from "@/types/warehouse/inventoryAdjustment";

export function useAdjustmentActions({
  items,
  setItems,
  currentUser,
  employees,
  onSuccess
}: UseAdjustmentActionsProps): UseAdjustmentActionsResult {
  const [isApplying, setIsApplying] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Batch scheduling state for the action panel
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(8, 0, 0, 0);
    return d.toISOString().split('T')[0];
  };

  const [batchDate, setBatchDate] = useState<string>(getTomorrow());
  const [batchAssigneeId, setBatchAssigneeId] = useState<number | null>(null);

  const handleCountChange = (id: number, value: number | "") => {
    setItems(prev => prev.map(item =>
      item.Id === id ? { ...item, CountedQty: value } : item
    ));
  };

  const handleAssigneeChange = (id: number, assigneeId: number) => {
    setItems(prev => prev.map(item =>
      item.Id === id ? { ...item, AssigneeId: assigneeId || undefined } : item
    ));
  };

  const handleProductChange = (id: number, name: string) => {
    setItems(prev => prev.map(item =>
      item.Id === id ? { ...item, ProductName: name } : item
    ));
  };

  const handleLotChange = (id: number, lot: string) => {
    setItems(prev => prev.map(item =>
      item.Id === id ? { ...item, LotNumber: lot } : item
    ));
  };

  const handleScheduleChange = (id: number, date: string) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      toast.error("Ngày dự kiến không được là trong quá khứ hoặc hiện tại.");
      return;
    }

    setItems(prev => prev.map(item =>
      item.Id === id ? { ...item, ScheduledDate: date } : item
    ));
  };

  const handleClearRow = async (id: number) => {
    setItems(prev => prev.map(item =>
      item.Id === id ? { ...item, CountedQty: "" } : item
    ));
  };

  const handleSaveDraft = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    const selectedItems = items.filter(i => selectedIds.includes(i.Id));

    if (selectedItems.length === 0) {
      toast.error("Vui lòng chọn (tick) ít nhất một dòng để lưu nháp.");
      return;
    }

    // Loại trừ các mục đang có nhân viên thực hiện chưa xong
    const validItems = selectedItems.filter(i =>
      !(i.TransactionId && i.AssigneeId && i.Status !== "Completed")
    );

    if (validItems.length === 0) {
      toast.error("Các mục được chọn đang có nhân viên kiểm kê chưa hoàn tất.");
      return;
    }

    setIsApplying(true);
    const loadingToast = toast.loading(`Đang lưu nháp ${validItems.length} mục...`);

    try {
      // Use batch date if available, otherwise tomorrow at 8 AM
      let planDateISO: string;
      if (batchDate) {
        const d = new Date(batchDate);
        d.setHours(8, 0, 0, 0);
        planDateISO = d.toISOString().split('.')[0];
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        planDateISO = tomorrow.toISOString().split('.')[0];
      }

      let successCount = 0;
      let failCount = 0;
      const errorDetails: string[] = [];

      for (const item of validItems) {
        // Prioritize batchAssigneeId if provided, otherwise fallback to item.AssigneeId
        const finalAssigneeId = Number(batchAssigneeId || item.AssigneeId);

        if (isNaN(finalAssigneeId) || finalAssigneeId <= 0) {
          failCount++;
          errorDetails.push(`${item.ProductName}: Vui lòng chọn người phân công hợp lệ.`);
          continue;
        }

        if (item.Id <= 0) {
          failCount++;
          errorDetails.push(`${item.ProductName}: Mục tự thêm (Manual) chưa có ID hệ thống.`);
          continue;
        }

        try {
          await inventoryAdjustmentApi.createDraft({
            InventoryId: item.Id,
            AssigneeId: finalAssigneeId,
            PlanDate: planDateISO
          });
          successCount++;
        } catch (error: any) {
          failCount++;
          errorDetails.push(`${item.ProductName}: ${error.response?.data || error.message || "Lỗi không xác định"}`);
        }
      }

      if (successCount > 0) {
        toast.success(`📅 Lên lịch thành công ${successCount} mục!`, { id: loadingToast, duration: 4000 });
      } else {
        toast.error("⚠️ Không có mục nào được lên lịch thành công.", { id: loadingToast });
      }

      if (failCount > 0) {
        errorDetails.slice(0, 3).forEach(err => toast.error(err, { duration: 6000 }));
      }

      setSelectedIds([]);
      onSuccess();
    } catch (error: any) {
      const errorMsg = error.response?.data?.Message || error.message || "Lỗi không xác định";
      toast.error(`❌ Lên lịch thất bại: ${errorMsg}`, { id: loadingToast, duration: 5000 });
    } finally {
      setIsApplying(false);
    }
  };

  const handleConfirmAccept = async () => {
    const readyItems = items.filter(i => selectedIds.includes(i.Id) && i.CountedQty !== "");

    if (readyItems.length === 0) {
      toast.error("Vui lòng nhập số lượng kiểm đếm cho ít nhất một mặt hàng được chọn.");
      return;
    }

    setIsApplying(true);
    const loadingToast = toast.loading("🚀 Đang xử lý dữ liệu kiểm kê...");

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      const planDateISO = tomorrow.toISOString();

      const finalItemsToComplete: { tranId: number; finalCountQty: number }[] = [];
      let failCount = 0;
      const errorDetails: string[] = [];

      for (const item of readyItems) {
        let tranId = item.Status === "Completed" ? null : item.TransactionId;

        if (!tranId) {
          try {
            if (item.Id <= 0) {
              failCount++;
              errorDetails.push(`${item.ProductName}: Mục tự thêm chưa có ID hệ thống.`);
              continue;
            }

            const draftResult = await inventoryAdjustmentApi.createDraft({
              InventoryId: item.Id,
              AssigneeId: Number(item.AssigneeId) || Number(currentUser?.id) || employees[0]?.Id || 0,
              PlanDate: planDateISO
            });
            tranId = draftResult.TranId || draftResult.tranId;
          } catch (error: any) {
            failCount++;
            errorDetails.push(`${item.ProductName}: ${error.response?.data || error.message}`);
            continue;
          }
        }

        if (tranId) {
          finalItemsToComplete.push({
            tranId: tranId,
            finalCountQty: Number(item.CountedQty)
          });
        }
      }

      if (finalItemsToComplete.length > 0) {
        await inventoryAdjustmentApi.completeAdjustment(finalItemsToComplete);
        toast.success(`🎉 Áp dụng thành công ${finalItemsToComplete.length} mục!`, { id: loadingToast, duration: 4000 });
      } else {
        toast.error("⚠️ Không có mặt hàng nào đủ điều kiện để áp dụng.", { id: loadingToast });
      }

      if (failCount > 0) {
        errorDetails.slice(0, 3).forEach(err => toast.error(err, { duration: 6000 }));
      }

      setSelectedIds([]);
      onSuccess();
    } catch (error: any) {
      const errorMsg = error.response?.data?.Message || error.response?.data || error.message || "Lỗi không xác định";
      toast.error(`❌ Áp dụng thất bại: ${errorMsg}`, { id: loadingToast, duration: 6000 });
    } finally {
      setIsApplying(false);
    }
  };

  return {
    isApplying,
    setIsApplying,
    selectedIds,
    setSelectedIds,
    handleCountChange,
    handleAssigneeChange,
    handleProductChange,
    handleLotChange,
    handleScheduleChange,
    handleClearRow,
    handleSaveDraft,
    handleConfirmAccept,
    batchDate,
    setBatchDate,
    batchAssigneeId,
    setBatchAssigneeId
  };
}
