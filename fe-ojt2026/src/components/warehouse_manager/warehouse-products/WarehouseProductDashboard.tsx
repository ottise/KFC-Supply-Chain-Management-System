"use client";

import { useState, useEffect, useCallback } from "react";
import { productWarehouseApi, type ProductWarehouseItem, type GetProductWarehouseParams } from "@/lib/api/warehouse/productWarehouseApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import type { Category } from "@/types/warehouse/masterData";
import WarehouseProductFilter from "./WarehouseProductFilter";
import WarehouseProductTable from "./WarehouseProductTable";
import WarehouseProductPagination from "./WarehouseProductPagination";

import { Loader2 } from "lucide-react";

interface Warehouse {
    Id: number;
    Name: string;
}

interface WarehouseProductDashboardProps {
    onTotalUpdate?: (total: number) => void;
}

export default function WarehouseProductDashboard({ onTotalUpdate }: WarehouseProductDashboardProps) {
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

    // Fetch warehouses on mount
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
            onTotalUpdate?.(result.TotalItems || 0);
        } catch (err) {
            console.error("Failed to fetch warehouse products:", err);
            setError("Không thể tải dữ liệu sản phẩm kho.");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, searchTerm, statusFilter, selectedWarehouseId, selectedCategoryId, onTotalUpdate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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
                        <div className="flex-1 overflow-auto">
                            <WarehouseProductTable
                                items={items}
                                categories={categories}
                                onStatusChange={fetchData}
                                onRemove={fetchData}
                            />
                        </div>
                        {totalPages > 1 && (
                            <WarehouseProductPagination
                                currentPage={page}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
