"use client";

import { useMemo, useState } from "react";
import InventoryAdjustmentTable from "./InventoryAdjustmentTable";
import StaffActionPanel from "./StaffActionPanel";
import AdjustmentFilter from "../../warehouse_manager/inventory_adjustment/AdjustmentFilter";
import AdjustmentPagination from "../../warehouse_manager/inventory_adjustment/AdjustmentPagination";
import { useStaffAdjustmentData } from "@/hooks/useStaffAdjustmentData";
import { useStaffAdjustmentActions } from "@/hooks/useStaffAdjustmentActions";

export default function InventoryAdjustmentDashboard() {
    const {
        loading,
        searchTerm: _searchTerm,
        setSearchTerm,
        selectedWarehouse,
        setSelectedWarehouse,
        selectedLocation,
        setSelectedLocation,
        selectedStatus,
        setSelectedStatus,
        warehouses,
        allLocations,
        filteredAdjustments,
        refreshAdjustments,
        adjustments
    } = useStaffAdjustmentData();

    const {
        selectedIds,
        setSelectedIds,
        isUpdating,
        counts,
        handleCountChange,
        handleBulkUpdate,
        handleComplete
    } = useStaffAdjustmentActions({
        adjustments,
        onSuccess: refreshAdjustments
    });

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredAdjustments.length / pageSize));
    }, [filteredAdjustments.length]);

    const paginatedAdjustments = useMemo(() => {
        const safePage = Math.min(Math.max(currentPage, 1), totalPages);
        const start = (safePage - 1) * pageSize;
        return filteredAdjustments.slice(start, start + pageSize);
    }, [filteredAdjustments, currentPage, totalPages]);

    return (
        <div className="space-y-6 pb-32">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                        Kiểm kê<span className="text-[#E4002B]"> Staff</span>
                    </h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                        Thực hiện đếm hàng hóa được giao
                    </p>
                </div>
            </div>

            <AdjustmentFilter
                onSearch={(val) => {
                    setSearchTerm(val);
                    setCurrentPage(1);
                }}
                onWarehouseChange={(id) => {
                    setSelectedWarehouse(id);
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
                onStatusChange={(status) => {
                    setSelectedStatus(status);
                    setCurrentPage(1);
                }}
            />

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">
                <div className="flex-1 overflow-auto">
                    <InventoryAdjustmentTable
                        adjustments={paginatedAdjustments}
                        onRefresh={refreshAdjustments}
                        loading={loading}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        counts={counts}
                        onCountChange={handleCountChange}
                    />
                </div>

                <div className="mt-auto">
                    <AdjustmentPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredAdjustments.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </div>
            </div>

            <StaffActionPanel
                selectedCount={selectedIds.length}
                isUpdating={isUpdating}
                onUpdate={handleBulkUpdate}
                onComplete={handleComplete}
                onClearSelection={() => setSelectedIds([])}
            />
        </div>
    );
}
