import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api/warehouse/productsApi';
import { supplierApi } from '@/lib/api/warehouse/supplierApi';
import { stockDocumentsApi } from '@/lib/api/warehouse/stockDocumentsApi';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import type { Product, ProductResponse } from '@/types/warehouse/masterData';
import type { Supplier, SupplierResponse } from '@/types/warehouse/partners';
import type { Transfer, TransferStatus } from '@/types/warehouse/stockDocuments';
import type { SaleOrderResponse } from '@/types/warehouse/orders';

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

export const useWarehouseProducts = (initialPage = 1, pageSize = 10) => {
  const { isAuthenticated, isAuthReady } = useAuthContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isActive, setIsActiveState] = useState<boolean | undefined>(true);
  const [categoryId, setCategoryIdState] = useState<number | undefined>(undefined);

  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0
  });

  const fetchData = useCallback(
    async (page: number, search?: string, active?: boolean | undefined, catId?: number | undefined) => {
      // Don't fetch if auth is not ready or user is not authenticated
      if (!isAuthReady || !isAuthenticated) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const normalizedSearch = search && search.trim() ? normalizeSearchText(search.trim()) : undefined;

        // Lấy metadata để tính phân trang đảo chiều nhưng vẫn giữ đủ pageSize
        const firstPageData: ProductResponse = await productsApi.getProducts({
          page: 1,
          pageSize,
          search: normalizedSearch,
          isActive: active,
          categoryId: catId
        });

        const totalItems = firstPageData.TotalItems || 0;
        const totalPages = Math.max(1, firstPageData.TotalPages || 1);
        const safeFePage = Math.min(Math.max(page, 1), totalPages);

        if (totalItems === 0) {
          setProducts([]);
          setPagination({
            currentPage: 1,
            totalPages: 0,
            totalItems: 0
          });
          return;
        }

        // Cắt "cửa sổ" dữ liệu theo thứ tự đảo toàn cục:
        // reversed index range: [reverseStart, reverseEndExclusive)
        const reverseStart = (safeFePage - 1) * pageSize;
        const reverseEndExclusive = Math.min(reverseStart + pageSize, totalItems);

        // Quy đổi về index trong danh sách gốc tăng dần (asc)
        const ascStart = totalItems - reverseEndExclusive;
        const ascEndExclusive = totalItems - reverseStart;

        const startServerPage = Math.floor(ascStart / pageSize) + 1;
        const endServerPage = Math.floor((ascEndExclusive - 1) / pageSize) + 1;

        const pageRequests: Promise<ProductResponse>[] = [];
        for (let p = startServerPage; p <= endServerPage; p++) {
          if (p === 1) {
            pageRequests.push(Promise.resolve(firstPageData));
          } else {
            pageRequests.push(productsApi.getProducts({
              page: p,
              pageSize,
              search: normalizedSearch,
              isActive: active,
              categoryId: catId
            }));
          }
        }

        const pageResults = await Promise.all(pageRequests);
        const mergedAscItems = pageResults.flatMap((r) => r.Items || []);

        // Tính offset slice trong mergedAscItems
        const globalStartIndexOfMerged = (startServerPage - 1) * pageSize;
        const localSliceStart = ascStart - globalStartIndexOfMerged;
        const localSliceEnd = ascEndExclusive - globalStartIndexOfMerged;

        // Đảo thành mới -> cũ, trang luôn đủ pageSize (trừ trang cuối FE)
        const reversedWindow = mergedAscItems
          .slice(localSliceStart, localSliceEnd)
          .reverse();

        setProducts(reversedWindow);
        setPagination({
          currentPage: safeFePage,
          totalPages,
          totalItems
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, isAuthReady, isAuthenticated]
  );

  useEffect(() => {
    if (isAuthReady) {
      fetchData(pagination.currentPage, searchTerm, isActive, categoryId);
    }
  }, [fetchData, pagination.currentPage, searchTerm, isActive, categoryId, isAuthReady]);

  const changePage = (page: number) => {
    setPagination((prev: { currentPage: number; totalPages: number; totalItems: number }) => ({ ...prev, currentPage: page }));
  };

  const search = (val: string) => {
    setSearchTerm(val);
    setPagination((prev: { currentPage: number; totalPages: number; totalItems: number }) => ({ ...prev, currentPage: 1 }));
  };

  const setIsActive = (next: boolean | undefined) => {
    setIsActiveState(next);
    setPagination((prev: { currentPage: number; totalPages: number; totalItems: number }) => ({
      ...prev,
      currentPage: 1
    }));
  };

  const setCategoryId = (next: number | undefined) => {
    setCategoryIdState(next);
    setPagination((prev: { currentPage: number; totalPages: number; totalItems: number }) => ({
      ...prev,
      currentPage: 1
    }));
  };

  return {
    products,
    loading,
    error,
    pagination,
    changePage,
    search,
    isActive,
    setIsActive,
    categoryId,
    setCategoryId,
    refresh: () => fetchData(pagination.currentPage, searchTerm, isActive, categoryId)
  };
};

export const useSuppliers = (initialPage = 1, pageSize = 10) => {
  const { isAuthenticated, isAuthReady } = useAuthContext();
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0
  });

  const fetchData = useCallback(async (page: number, search?: string, filter?: 'all' | 'active' | 'inactive') => {
    // Don't fetch if auth is not ready or user is not authenticated
    if (!isAuthReady || !isAuthenticated) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const currentFilter = filter ?? statusFilter;

      if (currentFilter === 'all') {
        // Gọi 2 API song song: active và inactive, để xác định đúng trạng thái
        const result = await supplierApi.getAllSuppliersWithStatus({ search });
        const merged = [...result.activeItems, ...result.inactiveItems];

        // Sort by Id for consistent ordering
        merged.sort((a, b) => a.Id - b.Id);

        // Client-side pagination
        const totalItems = merged.length;
        const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
        const safePage = Math.min(page, Math.max(totalPages, 1));
        const startIndex = (safePage - 1) * pageSize;
        const paginatedItems = merged.slice(startIndex, startIndex + pageSize);

        setAllSuppliers(paginatedItems);
        setPagination({
          currentPage: safePage,
          totalPages,
          totalItems
        });
      } else {
        // Gọi 1 API với isActive filter, BE trả về đúng danh sách
        const isActive = currentFilter === 'active';
        const data: SupplierResponse = await supplierApi.getSuppliers({
          page,
          pageSize,
          search,
          isActive
        });

        setAllSuppliers(data.Items || []);
        setPagination({
          currentPage: data.Page,
          totalPages: data.TotalPages,
          totalItems: data.TotalItems
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pageSize, isAuthReady, isAuthenticated, statusFilter]);

  useEffect(() => {
    if (isAuthReady) {
      fetchData(pagination.currentPage, searchTerm, statusFilter);
    }
  }, [isAuthReady, isAuthenticated, statusFilter, searchTerm, pagination.currentPage, pageSize, fetchData]);

  const changePage = (page: number) => {
    setPagination((prev: { currentPage: number; totalPages: number; totalItems: number }) => ({ ...prev, currentPage: page }));
  };

  const search = (term: string) => {
    setSearchTerm(term);
    setPagination((prev: { currentPage: number; totalPages: number; totalItems: number }) => ({ ...prev, currentPage: 1 }));
  };

  const handleSetStatusFilter = (newFilter: 'all' | 'active' | 'inactive') => {
    setStatusFilter(newFilter);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  return {
    suppliers: allSuppliers,
    allSuppliers,
    loading,
    error,
    pagination,
    changePage,
    search,
    statusFilter,
    setStatusFilter: handleSetStatusFilter,
    refresh: () => fetchData(pagination.currentPage, searchTerm, statusFilter)
  };
};

export const useOutTransfers = (initialPage = 1, pageSize = 10) => {
  const { isAuthenticated, isAuthReady, user } = useAuthContext();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateType, setDateType] = useState<'created' | 'planned'>('created');

  const [pagination, setPagination] = useState({
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0
  });

  // Thêm tham số search vào fetchData
  const mapStatus = (status?: string): TransferStatus => {
    const statusMap: Record<string, TransferStatus> = {
      'draft': 'DRAFT',
      'waiting': 'WAITING',
      'ready': 'READY',
      'done': 'DONE',
      'cancelled': 'CANCELLED'
    };
    return statusMap[status?.toLowerCase() || ''] || 'DRAFT';
  };

  const fetchData = useCallback(async (page: number, search?: string, status?: string, fromDt?: string, toDt?: string, dtType?: 'created' | 'planned') => {
    if (!isAuthReady || !isAuthenticated) return;
    setLoading(true);
    try {
      const activeStatus = status ?? statusFilter;
      const finalStatus = activeStatus === 'all' ? undefined : activeStatus;
      const keyword = search ?? searchTerm;

      let data: SaleOrderResponse | undefined;

      if (keyword) {
        // CALL BOTH IN PARALLEL
        const [resByCode, resByName] = await Promise.all([
          stockDocumentsApi.getOutTransfers(
            page,
            pageSize,
            keyword,
            undefined,
            finalStatus,
            fromDt ?? fromDate,
            toDt ?? toDate,
            dtType ?? dateType
          ),
          stockDocumentsApi.getOutTransfers(
            page,
            pageSize,
            undefined,
            keyword,
            finalStatus,
            fromDt ?? fromDate,
            toDt ?? toDate,
            dtType ?? dateType
          )
        ]);

        // Merge & Deduplicate
        const mergedItems = [...(resByCode.Items || []), ...(resByName.Items || [])];
        const uniqueMap = new Map<number, unknown>();
        mergedItems.forEach(item => {
          if (!uniqueMap.has(item.Id)) uniqueMap.set(item.Id, item);
        });

        const finalItems = Array.from(uniqueMap.values());

        // Return a combined structure
        data = {
          Items: finalItems,
          Page: page,
          TotalPages: Math.max(resByCode.TotalPages || 0, resByName.TotalPages || 0),
          TotalItems: Math.max(resByCode.TotalItems || 0, resByName.TotalItems || 0) // Approximation
        };
      } else {
        data = await stockDocumentsApi.getOutTransfers(
          page,
          pageSize,
          undefined,
          undefined,
          finalStatus,
          fromDt ?? fromDate,
          toDt ?? toDate,
          dtType ?? dateType
        );
      }

      // ✅ MAP DỮ LIỆU TỪ BE SANG FE INTERFACE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedTransfers = (data.Items || []).map((item: any) => ({
        id: item.Id,
        code: item.OrderNo,
        documentType: 'OUT' as const, // SaleOrder luôn là OUT
        status: mapStatus(item.Status),
        referenceType: 'SALE_ORDER' as const,
        referenceId: item.Id,
        saleOrderNo: item.OrderNo,
        fromLocationId: item.FromLocationId,
        fromLocationName: item.FromLocationName || '',
        toLocationId: item.ToLocationId,
        destination: item.ToLocationName || '',
        customerId: item.CustomerId,
        customerName: item.CustomerName,
        customerPhone: null,
        date: (item.PlannedDate || item.CreatedAt) ? (() => {
          const d = new Date(item.PlannedDate || item.CreatedAt);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dd}`;
        })() : '',
        completedAt: item.CompletedAt,
        carrierId: null,
        carrierName: '',
        responsible: item.CreatedByName || item.createdByName || (item.CreatedById ? `ID ${item.CreatedById}` : ''),
        carrier: '',
        notes: item.Note || '',
        items: []
      }));

      setTransfers(mappedTransfers);
      setPagination({
        currentPage: data.Page,
        totalPages: data.TotalPages,
        totalItems: data.TotalItems
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [pageSize, isAuthReady, isAuthenticated, searchTerm, statusFilter, fromDate, toDate, dateType, user?.id]);

  // Hàm thay đổi trang
  const changePage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  // Hàm tìm kiếm
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const filterStatus = useCallback((status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const filterDates = useCallback((_from: string, _to: string, type: 'created' | 'planned') => {
    setFromDate(_from);
    setToDate(_to);
    setDateType(type);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createTransfer = useCallback(async (payload: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await stockDocumentsApi.createOutTransfer(payload);
      await fetchData(1, searchTerm); // Reload data sau khi tạo thành công
      return result;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const msg = err.response?.data?.message || "Lỗi khi tạo phiếu xuất kho";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchData, searchTerm]);

  // QUAN TRỌNG: Lắng nghe sự thay đổi của currentPage và searchTerm
  useEffect(() => {
    if (isAuthReady) {
      fetchData(pagination.currentPage, searchTerm, statusFilter, fromDate, toDate, dateType);
    }
  }, [isAuthReady, fetchData, pagination.currentPage, searchTerm, statusFilter, fromDate, toDate, dateType]);

  // TRẢ VỀ ĐẦY ĐỦ CÁC HÀM
  return {
    transfers,
    loading,
    error,
    pagination,
    refresh: () => fetchData(pagination.currentPage, searchTerm, statusFilter, fromDate, toDate, dateType),
    createTransfer,
    changePage, // Thêm cái này để hết lỗi ở Dashboard
    search,      // Thêm cái này để dùng được ô tìm kiếm
    filterStatus,
    filterDates
  };
};
