"use client";

import { useState } from "react";
import { supplierApi } from "@/lib/api/warehouse/supplierApi";
import { useSuppliers } from "@/hooks/useWarehouse";
import VendorTable from "./VendorTable";
import VendorCreateForm from "./VendorCreateForm";
import VendorDetail from "./VendorDetail";
import VendorPagination from "./VendorPagination";
import type { Supplier } from "@/types/warehouse/partners";
import type { CreateSupplierRequest, UpdateSupplierRequest } from "@/types/warehouse/partners";
import VendorFilter from "./VendorFilter";
import { FullScreenLoader } from '@/components/ui/LoadingSpinner';

export default function VendorDashboard() {
  const {
    suppliers,
    loading,
    error,
    pagination,
    search,
    changePage,
    refresh,
    statusFilter,
    setStatusFilter
  } = useSuppliers(1, 10);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleActionSuccess = () => {
    refresh();
    setSelectedSupplier(null);
    setShowCreate(false);
    setCreateError(null);
    setUpdateError(null);
  };

  const handleCreateSupplier = async (data: CreateSupplierRequest) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      await supplierApi.createSupplier(data);
      handleActionSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tạo nhà cung ứng.";
      setCreateError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateSupplier = async (id: number, data: Partial<UpdateSupplierRequest>) => {
    setIsUpdating(true);
    setUpdateError(null);

    try {
      await supplierApi.updateSupplier(id, data as UpdateSupplierRequest);
      handleActionSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể cập nhật nhà cung ứng.";
      setUpdateError(errorMessage);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      await supplierApi.deleteSupplier(id);
      handleActionSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể xóa nhà cung ứng.";
      setUpdateError(errorMessage);
      throw err;
    }
  };

  const handleToggleStatus = async (id: number, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        // Đang active → ngừng hoạt động (soft delete)
        await supplierApi.deleteSupplier(id);
      } else {
        // Đang inactive → kích hoạt lại
        await supplierApi.reactivateSupplier(id);
      }
      handleActionSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể thay đổi trạng thái.";
      setUpdateError(errorMessage);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <VendorFilter
        onSearch={search}
        onStatusFilter={setStatusFilter}
        onCreateClick={() => setShowCreate(true)}
        selectedStatus={statusFilter}
      />

      <div className="bg-white rounded-4xl overflow-hidden shadow-[0_10px_25px_-5px_rgba(228,0,43,0.1)] relative min-h-[400px]">
        {loading && <FullScreenLoader />}

        {error && !loading && (
          <div className="p-20 text-center">
            <p className="text-red-500 font-bold mb-4">{error}</p>
            <button onClick={refresh} className="px-6 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase hover:bg-red-100">
              Thử lại
            </button>
          </div>
        )}

        {!error && (
          <>
            <VendorTable
              suppliers={suppliers}
              loading={loading}
              onRowClick={(supplier) => setSelectedSupplier(supplier)}
              onToggleStatus={handleToggleStatus}
              currentPage={pagination.currentPage}
              pageSize={10}
            />
            {pagination.totalPages > 1 && (
              <VendorPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={10}
                onPageChange={changePage}
              />
            )}
          </>
        )}
      </div>

      {selectedSupplier && (
        <VendorDetail
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          onUpdate={handleUpdateSupplier}
          onDelete={handleDeleteSupplier}
          onToggleStatus={handleToggleStatus}
          isUpdating={isUpdating}
          updateError={updateError}
        />
      )}

      {showCreate && (
        <VendorCreateForm
          isOpen={showCreate}
          onClose={() => {
            setShowCreate(false);
            setCreateError(null);
          }}
          onSave={handleCreateSupplier}
          isLoading={isCreating}
          error={createError}
        />
      )}
    </div>
  );
}