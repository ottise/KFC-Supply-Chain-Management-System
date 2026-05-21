"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useWarehouses } from "@/hooks/useWarehouses";
import WarehouseTable from "./WarehouseTable";
import WarehousePagination from "./WarehousePagination";
import WarehouseFilter from "./WarehouseFilter";
import WarehouseDetailBox from "./WarehouseDetailBox";
import WarehouseForm from "./WarehouseForm";
import type { Warehouse } from "@/types/warehouse/warehouse";

interface Props {
  onTotalUpdate?: (total: number) => void;
}

export default function WarehouseDashboard({ onTotalUpdate }: Props) {
  const {
    warehouses,
    loading,
    error,
    pagination,
    changePage,
    search,
    statusFilter,
    setStatus,
    refresh,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    toggleStatus,
  } = useWarehouses();

  // Modal states
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const handleRowClick = (wh: Warehouse) => {
    setSelectedWarehouse(wh);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedWarehouse(null);
  };

  const handleEdit = (wh: Warehouse) => {
    setShowDetail(false);
    setSelectedWarehouse(null);
    setEditingWarehouse(wh);
    setShowCreate(true);
  };

  const handleCreateWarehouse = async (data: {
    Name: string;
    WarehouseCode: string;
    Address?: string;
    Phone?: string;
    Email?: string;
    ManagerId?: number;
    WarehouseType?: string;
    AreaSqm?: number;
    Notes?: string;
  }) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.Id, {
          ...data,
          IsActive: editingWarehouse.IsActive,
        });
      } else {
        await createWarehouse(data);
      }
      setShowCreate(false);
      setEditingWarehouse(null);
      refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      }
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseCreate = () => {
    setShowCreate(false);
    setEditingWarehouse(null);
    setCreateError(null);
  };

  return (
    <div className="space-y-6">
      <WarehouseFilter
        onSearch={search}
        onAddClick={() => setShowCreate(true)}
        onStatusFilter={setStatus}
        initialStatus={statusFilter}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">
        {loading && !warehouses.length ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-sm font-bold text-gray-400">
              Đang tải dữ liệu...
            </span>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <WarehouseTable
                warehouses={warehouses}
                currentPage={pagination.currentPage}
                pageSize={10}
                onRowClick={handleRowClick}
                onToggleStatus={toggleStatus}
              />
            </div>

            <div className="mt-auto">
              <WarehousePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={10}
                onPageChange={changePage}
              />
            </div>
          </>
        )}
      </div>

      {showDetail && selectedWarehouse && (
        <WarehouseDetailBox
          warehouse={selectedWarehouse}
          close={handleCloseDetail}
          onUpdate={refresh}
          onEdit={handleEdit}
          onDelete={deleteWarehouse}
        />
      )}

      <WarehouseForm
        isOpen={showCreate}
        onClose={handleCloseCreate}
        onSave={handleCreateWarehouse}
        isLoading={isCreating}
        error={createError}
        warehouse={editingWarehouse}
      />
    </div>
  );
}
