"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import AdjustmentFilter from "./AdjustmentFilter";
import AdjustmentTable from "./AdjustmentTable";
import AdjustmentAcceptForm from "./AdjustmentAcceptForm";
import AdjustmentActionPanel from "./AdjustmentActionPanel";
import AdjustmentPagination from "./AdjustmentPagination";
import StockHistoryModal from "./StockHistoryModal";
import { useAuth } from "@/hooks/useAuth";
import { useAdjustmentData } from "@/hooks/useAdjustmentData";
import { useAdjustmentActions } from "@/hooks/useAdjustmentActions";
import { EnrichedInventoryItem } from "@/types/warehouse/inventoryAdjustment";
import toast from "react-hot-toast";

export default function AdjustmentDashboard() {
  const { user } = useAuth();
  const [showAcceptForm, setShowAcceptForm] = useState(false);

  // History Modal State
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean;
    productId: number;
    productName: string;
    lotId?: number | null;
    lotNumber?: string;
    locationId?: number;
    locationName?: string;
  }>({
    isOpen: false,
    productId: 0,
    productName: ""
  });

  const {
    items,
    setItems,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    loading,
    warehouses,
    allLocations,
    employees,
    selectedWarehouse,
    setSelectedWarehouse,
    selectedLocation,
    setSelectedLocation,
    selectedStatus,
    setSelectedStatus,
    paginatedItems,
    totalPages,
    refreshItems,
    filteredItems
  } = useAdjustmentData();

  const {
    isApplying,
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
  } = useAdjustmentActions({
    items,
    setItems,
    currentUser: user,
    employees,
    onSuccess: refreshItems
  });

  const handleShowHistory = (item: EnrichedInventoryItem) => {
    setHistoryModal({
      isOpen: true,
      productId: item.ProductId,
      productName: item.ProductName || `SP #${item.ProductId}`,
      lotId: item.LotId,
      lotNumber: item.LotNumber,
      locationId: item.Location?.Id,
      locationName: item.Location?.Name
    });
  };

  const handleApplyClick = () => {
    if (selectedIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một mặt hàng để áp dụng.");
      return;
    }

    const selectedItems = items.filter(i => selectedIds.includes(i.Id));

    // Chặn áp dụng cho các mục đang được nhân viên thực hiện (đã lên lịch + chưa hoàn tất)
    const activelyAssigned = selectedItems.filter(i => i.TransactionId && i.AssigneeId && i.Status !== "Completed");
    if (activelyAssigned.length > 0) {
      toast.error("Không thể 'Áp dụng' các mặt hàng đang được nhân viên kiểm kê. Hãy chờ nhân viên hoàn tất.");
      return;
    }

    const readyItems = selectedItems.filter(i => i.CountedQty !== "");
    if (readyItems.length === 0) {
      toast.error("Các mặt hàng được chọn chưa được nhập số lượng kiểm đếm.");
      return;
    }

    setShowAcceptForm(true);
  };

  return (
    <div className="space-y-6 pb-32">
      <AdjustmentFilter
        onSearch={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        onWarehouseChange={(id) => {
          setSelectedWarehouse(id);
          setSelectedLocation(null);
          setCurrentPage(1);
        }}
        onLocationChange={(id) => {
          setSelectedLocation(id);
          setCurrentPage(1);
        }}
        warehouses={warehouses}
        locations={allLocations}
        selectedWarehouse={selectedWarehouse}
        selectedLocation={selectedLocation}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">
        <AdjustmentTable
          items={paginatedItems}
          onCountChange={handleCountChange}
          onAssigneeChange={handleAssigneeChange}
          onProductChange={handleProductChange}
          onLotChange={handleLotChange}
          onScheduleChange={handleScheduleChange}
          onShowHistory={handleShowHistory}
          loading={loading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onClear={handleClearRow}
          employees={employees}
        />

        <AdjustmentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </div>

      <AdjustmentActionPanel
        selectedCount={selectedIds.length}
        isApplying={isApplying}
        onApply={handleApplyClick}
        onClearSelection={() => setSelectedIds([])}
        employees={employees}
        batchDate={batchDate}
        onBatchDateChange={setBatchDate}
        batchAssigneeId={batchAssigneeId}
        onBatchAssigneeChange={setBatchAssigneeId}
        onSaveDraft={handleSaveDraft}
      />

      {showAcceptForm && (
        <AdjustmentAcceptForm
          itemCount={items.filter(i => selectedIds.includes(i.Id) && i.CountedQty !== "").length}
          onClose={() => setShowAcceptForm(false)}
          onConfirm={() => {
            setShowAcceptForm(false);
            handleConfirmAccept();
          }}
        />
      )}

      {historyModal.isOpen && (
        <StockHistoryModal
          {...historyModal}
          onClose={() => setHistoryModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
}
