"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ProductTable from "./ProductTable";
import ProductDetailModal from "./ProductDetailModal";
import WarehouseProductFilter from "@/components/warehouse_manager/warehouse-products/WarehouseProductFilter";
import ProductPagination from "@/components/warehouse_manager/product/ProductPagination";
import { productWarehouseApi, type ProductWarehouseItem, type GetProductWarehouseParams } from "@/lib/api/warehouse/productWarehouseApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import type { Category } from "@/types/warehouse/masterData";
import { Loader2 } from "lucide-react";

interface Warehouse {
    Id: number;
    Name: string;
}

export default function ProductDashboard() {
    const [items, setItems] = useState<ProductWarehouseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Filters
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    // Fetch filters on mount
    useEffect(() => {
        const fetchFilterData = async () => {
            try {
                const [whData, catData] = await Promise.all([
                    warehouseApi.getWarehousesForCurrentUser(),
                    masterDataApi.getCategories()
                ]);
                const whList = Array.isArray(whData) ? whData : (whData?.Items || whData?.items || []);
                setWarehouses(whList);
                setCategories(catData || []);
            } catch (err) {
                console.error("Failed to fetch filter data:", err);
            }
        };
        fetchFilterData();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: GetProductWarehouseParams = {
                page,
                pageSize,
                search: searchTerm || undefined,
                isActive: statusFilter,
                categoryId: selectedCategoryId,
            };

            let result;
            if (selectedWarehouseId) {
                result = await productWarehouseApi.getByWarehouse(selectedWarehouseId, params);
            } else {
                result = await productWarehouseApi.getAll(params);
            }

            setItems(result.Items || []);
            setTotalPages(result.TotalPages || 1);
            setTotalItems(result.TotalItems || 0);
        } catch (err) {
            console.error("Failed to fetch warehouse products:", err);
            setError("Không thể tải dữ liệu sản phẩm kho.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm, statusFilter, selectedWarehouseId, selectedCategoryId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Transform for the table
    const tableProducts = useMemo(() => {
        return items.map((item) => ({
            id: item.Id,
            name: item.ProductName,
            sku: item.ProductCode,
            unit: item.BaseUomName || "---",
            categoryName: item.CategoryName,
            categoryId: item.CategoryId,
            price: item.SalePrice || 0,
            isActive: item.IsActive ?? false,
        }));
    }, [items]);

    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

    const handleSearch = (val: string) => {
        setSearchTerm(val);
        setPage(1);
    };

    const handleWarehouseFilter = (warehouseId: number | undefined) => {
        setSelectedWarehouseId(warehouseId);
        setPage(1);
    };

    const handleStatusFilter = (isActive: boolean | undefined) => {
        setStatusFilter(isActive);
        setPage(1);
    };

    const handleCategoryFilter = (categoryId: number | undefined) => {
        setSelectedCategoryId(categoryId);
        setPage(1);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
                        Sản phẩm <span className="text-[#E4002B]">Kho</span>
                    </h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                        Danh sách sản phẩm trong kho
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-4 bg-white p-3 px-5 rounded-2xl shadow-sm border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Tổng: {totalItems} sản phẩm
                    </span>
                </div>
            </div>

            <WarehouseProductFilter
                onSearch={handleSearch}
                onWarehouseFilter={handleWarehouseFilter}
                onStatusFilter={handleStatusFilter}
                onCategoryFilter={handleCategoryFilter}
                warehouses={warehouses}
                categories={categories}
                selectedWarehouseId={selectedWarehouseId}
                selectedStatus={statusFilter}
                selectedCategoryId={selectedCategoryId}
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
                        <div className="flex-1">
                            <ProductTable
                                products={tableProducts}
                                categories={categories}
                                onSelect={(p) => setSelectedProductId(p.id)}
                            />
                        </div>
                        <ProductPagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            {/* MODAL CHI TIẾT */}
            <ProductDetailModal
                productId={selectedProductId}
                onClose={() => setSelectedProductId(null)}
                onUpdate={fetchData}
            />
        </div>
    );
}
