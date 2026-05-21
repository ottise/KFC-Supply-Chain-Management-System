"use client";

import { useState, useEffect } from "react";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import ProductTable from "./AdminProductTable";
import Pagination from "@/components/admin/Pagination";
import ProductFilter from "./AdminProductFilter";
import ProductDetailBox from "./AdminProductDetailBox";
import { Loader2 } from "lucide-react";
import CreateProductForm from "./AdminProductCreateForm";
import { useWarehouseProducts } from '@/hooks/useWarehouse';
import type { Product, CreateProductRequest } from "@/types/warehouse/masterData";

interface ProductDashboardProps {
  onTotalUpdate?: (total: number) => void;
}

export default function ProductDashboard({ onTotalUpdate }: ProductDashboardProps) {
  const {
    products,
    loading,
    error,
    pagination,
    search,
    changePage,
    refresh,
    isActive,
    setIsActive,
    categoryId,
    setCategoryId
  } = useWarehouseProducts(1, 10);


  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleActionSuccess = () => {
    refresh();
    setSelectedProduct(null);
    setShowCreate(false);
    setCreateError(null);
  };

  const handleCreateProduct = async (data: CreateProductRequest) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      await productsApi.createProduct(data);
      handleActionSuccess();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tạo sản phẩm.";
      setCreateError(errorMessage);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  // Report total items to parent for header integration
  // useState(() => {
  //   onTotalUpdate?.(pagination.totalItems);
  // });

  useEffect(() => {
    onTotalUpdate?.(pagination.totalItems);
  }, [pagination.totalItems, onTotalUpdate]);

  return (
    <div className="space-y-6">
      <ProductFilter
        onSearch={search}
        onAddClick={() => setShowCreate(true)}
        initialStatus={isActive}
        initialCategoryId={categoryId}
        onCategoryFilter={setCategoryId}
        onStatusFilter={setIsActive}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-x-auto w-full flex flex-col min-h-[600px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <ProductTable
              products={products}
              openDetail={setSelectedProduct}
              onToggleComplete={refresh}
            />
            {pagination.totalPages > 1 && (
              <div className="mt-auto">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={10}
                  onPageChange={changePage}
                />
              </div>
            )}
          </>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailBox
          product={selectedProduct}
          close={() => setSelectedProduct(null)}
          onUpdate={handleActionSuccess}
        />
      )}

      <CreateProductForm
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleCreateProduct}
        isLoading={isCreating}
        error={createError}
      />
    </div>
  );
}
