"use client";

import { useState, useEffect } from "react";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import ProductTable from "./ProductTable";
import ProductPagination from "./ProductPagination";
import ProductFilter from "./ProductFilter";
import ProductDetailBox from "./ProductDetailBox";
import AddToWarehouseModal from "./AddToWarehouseModal";
import { Loader2 } from "lucide-react";

// Import hooks and types
import { useWarehouseProducts } from '@/hooks/useWarehouse';
import type { Product, Category } from "@/types/warehouse/masterData";

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
  const [addToWarehouseProduct, setAddToWarehouseProduct] = useState<Product | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await masterDataApi.getCategories();
        setCategories(data.filter(c => c.IsActive));
      } catch (error) {
        console.error("Lỗi khi tải danh mục:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleActionSuccess = () => {
    refresh();
    setSelectedProduct(null);
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
        showAddButton={false}
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

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <span className="ml-3 text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            <ProductTable
              products={products}
              categories={categories}
              openDetail={setSelectedProduct}
              onToggleComplete={refresh}
              onAddToWarehouse={setAddToWarehouseProduct}
            />
            {pagination.totalPages > 1 && (
              <div className="mt-auto">
                <ProductPagination
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

      {addToWarehouseProduct && (
        <AddToWarehouseModal
          isOpen={true}
          onClose={() => setAddToWarehouseProduct(null)}
          productId={addToWarehouseProduct.Id}
          productCode={addToWarehouseProduct.Code}
          productName={addToWarehouseProduct.Name}
        />
      )}

    </div>
  );
}
