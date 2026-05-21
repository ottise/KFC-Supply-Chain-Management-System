"use client";

import { useState, useEffect, useCallback } from "react";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import type { Warehouse } from "@/types/warehouse/warehouse";

interface CreateWarehouseData {
  Name: string;
  WarehouseCode: string;
  Address?: string;
  Phone?: string;
  Email?: string;
  ManagerId?: number;
  WarehouseType?: string;
  AreaSqm?: number;
  Notes?: string;
}

interface UpdateWarehouseData extends CreateWarehouseData {
  WarehouseCode: string;
  IsActive: boolean;
}

export const useWarehouses = (initialPage = 1, pageSize = 10) => {
  const { isAuthenticated, isAuthReady, user } = useAuthContext();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);

  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 1,
    totalItems: 0,
  });

  const fetchWarehouses = useCallback(
    async (page: number, search?: string, isActive?: boolean | undefined) => {
      if (!isAuthReady || !isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch warehouses using claims-based endpoint (managerId extracted from JWT)
        const response = await warehouseApi.getWarehousesForCurrentUser();

        // API returns paginated response: { items: Warehouse[], page, pageSize, totalItems, totalPages, ... }
        let data: Warehouse[] = [];

        if (response && typeof response === 'object') {
          // Handle paginated response structure
          if ('items' in response && Array.isArray(response.items)) {
            data = response.items;
            setPagination({
              currentPage: response.page ?? page,
              totalPages: response.totalPages ?? 1,
              totalItems: response.totalItems ?? 0,
            });
          } else if (Array.isArray(response)) {
            // Handle array response (fallback)
            data = response;
          }
        }

        // Filter based on search and status (client-side filtering for additional filters)
        let filtered = data;

        if (search && search.trim()) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (wh) =>
              wh.Name.toLowerCase().includes(searchLower) ||
              (wh.WarehouseCode && wh.WarehouseCode.toLowerCase().includes(searchLower)) ||
              (wh.Address && wh.Address.toLowerCase().includes(searchLower))
          );
        }

        if (isActive !== undefined) {
          filtered = filtered.filter((wh) => wh.IsActive === isActive);
        }

        // Sort by Id descending (newest first)
        filtered.sort((a, b) => b.Id - a.Id);

        // Client-side pagination (only if server didn't paginate)
        const totalItems = filtered.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safePage = Math.min(Math.max(page, 1), totalPages);
        const startIndex = (safePage - 1) * pageSize;
        const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

        setWarehouses(paginatedItems);
        if (!('items' in (response ?? {}))) {
          setPagination({
            currentPage: safePage,
            totalPages,
            totalItems,
          });
        }
      } catch (err: unknown) {
        // Handle 404 as empty data (no warehouses found for this manager)
        const isNotFound =
          err instanceof Object &&
          "response" in err &&
          (err as { response?: { status?: number } }).response?.status === 404;

        if (isNotFound) {
          setWarehouses([]);
          setPagination({ currentPage: 1, totalPages: 1, totalItems: 0 });
        } else {
          const errorMessage =
            err instanceof Error
              ? err.message
              : err instanceof Object && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
                "Lỗi khi tải danh sách kho"
              : "Lỗi khi tải danh sách kho";
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isAuthReady, isAuthenticated]
  );

  useEffect(() => {
    if (isAuthReady) {
      fetchWarehouses(pagination.currentPage, searchTerm, statusFilter);
    }
  }, [isAuthReady, pagination.currentPage, searchTerm, statusFilter, fetchWarehouses]);

  const changePage = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const search = (term: string) => {
    setSearchTerm(term);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const setStatus = (isActive: boolean | undefined) => {
    setStatusFilter(isActive);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const createWarehouse = async (data: CreateWarehouseData): Promise<{ message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseApi.createWarehouse(data);
      await fetchWarehouses(1, searchTerm, statusFilter);
      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err instanceof Object && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Lỗi khi tạo kho"
          : "Lỗi khi tạo kho";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateWarehouse = async (
    id: number,
    data: UpdateWarehouseData
  ): Promise<{ message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseApi.updateWarehouse(id, data);
      await fetchWarehouses(pagination.currentPage, searchTerm, statusFilter);
      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err instanceof Object && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Lỗi khi cập nhật kho"
          : "Lỗi khi cập nhật kho";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const deleteWarehouse = async (id: number): Promise<{ message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseApi.deleteWarehouse(id);
      await fetchWarehouses(pagination.currentPage, searchTerm, statusFilter);
      return result;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err instanceof Object && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Lỗi khi xóa kho"
          : "Lỗi khi xóa kho";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean): Promise<void> => {
    try {
      if (currentStatus) {
        await warehouseApi.deactivateWarehouse(id);
      } else {
        await warehouseApi.activateWarehouse(id);
      }
      await fetchWarehouses(pagination.currentPage, searchTerm, statusFilter);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err instanceof Object && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Lỗi khi cập nhật trạng thái"
          : "Lỗi khi cập nhật trạng thái";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    warehouses,
    loading,
    error,
    pagination,
    changePage,
    search,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatus,
    refresh: () => fetchWarehouses(pagination.currentPage, searchTerm, statusFilter),
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    toggleStatus,
  };
};
