'use client';

import { useState, useEffect, useCallback } from 'react';
import { scrapApi, type GetScrapOrdersParams } from '@/lib/api/warehouse/scrapApi';
import { productsApi } from '@/lib/api/warehouse/productsApi';
import { productLotsApi } from '@/lib/api/warehouse/productLotsApi';
import { useAuthContext } from '@/lib/contexts/AuthContext';
import type {
  ScrapOrderListItem,
  ScrapOrderDetail,
  ScrapOrderStatusCount,
  CreateScrapOrderRequest,
  InventoryCheck,
} from '@/types/warehouse/scrap';

const PAGE_SIZE = 10;

interface ApiErrorLike {
  message?: string;
  response?: {
    data?: unknown;
  };
}

const getApiErrorData = (err: unknown): unknown =>
  (err as ApiErrorLike)?.response?.data;

const getApiErrorMessage = (err: unknown, fallback = 'Lỗi hệ thống'): string => {
  const responseData = getApiErrorData(err);
  if (typeof responseData === 'string') return responseData;
  if (responseData && typeof responseData === 'object') {
    const data = responseData as { message?: string; error?: string };
    if (data.message) return data.message;
    if (data.error) return data.error;
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
};

export const useScrapOrders = (initialPage = 1, pageSize = PAGE_SIZE) => {
  const { isAuthenticated, isAuthReady } = useAuthContext();

  const [allScrapOrders, setAllScrapOrders] = useState<ScrapOrderListItem[]>([]);
  const [scrapOrders, setScrapOrders] = useState<ScrapOrderListItem[]>([]);
  const [statusCount, setStatusCount] = useState<ScrapOrderStatusCount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  }

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0,
  });

  const [filters, setFilters] = useState<{
    status?: string;
    search?: string;
  }>({});

  // Fetch danh sách scrap orders (Lấy toàn bộ các trang để sort Global vì BE không hỗ trợ sort DESC)
  const fetchScrapOrders = useCallback(async (targetPage: number, currentFilters?: typeof filters) => {
    if (!isAuthReady || !isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const activeFilters = currentFilters ?? filters;
      const baseParams: GetScrapOrdersParams = {
        page: 1,
        pageSize: 20, // Max size supported by BE
        status: activeFilters.status,
      };

      // Search sẽ filter client-side để tránh phụ thuộc cách BE combine nhiều query params

      // 1. Fetch trang đầu tiên để lấy meta data (TotalPages)
      const firstPageData = await scrapApi.getScrapOrders(baseParams);
      let allItems = [...(firstPageData.Items || [])];
      const totalPages = firstPageData.TotalPages || 1;

      // 2. Nếu có nhiều hơn 1 trang, fetch tất cả các trang còn lại
      if (totalPages > 1) {
        const remainingPagePromises = [];
        for (let p = 2; p <= totalPages; p++) {
          remainingPagePromises.push(scrapApi.getScrapOrders({ ...baseParams, page: p }));
        }
        const remainingResults = await Promise.all(remainingPagePromises);
        remainingResults.forEach(res => {
          if (res.Items) allItems = [...allItems, ...res.Items];
        });
      }

      // 3. Search client-side (không dấu) theo scrapNo/locationName/createdBy
      const normalize = (value?: string | null) =>
        (value ?? '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .trim();

      const searchTerm = normalize(activeFilters.search);
      const searchedItems = searchTerm
        ? allItems.filter(item => {
            const scrapNo = normalize(item.ScrapNo);
            const locationName = normalize(item.LocationName);
            const createdByName = normalize(item.CreatedByName);
            return scrapNo.includes(searchTerm) || locationName.includes(searchTerm) || createdByName.includes(searchTerm);
          })
        : allItems;

      // 4. Sắp xếp Global theo ID giảm dần (mới nhất lên đầu)
      const sortedItems = searchedItems.sort((a, b) => b.Id - a.Id);
      setAllScrapOrders(sortedItems);

      // 5. Cắt dữ liệu cho trang hiện tại (Client-side Page)
      const start = (targetPage - 1) * pageSize;
      const pagedItems = sortedItems.slice(start, start + pageSize);

      setScrapOrders(pagedItems);
      setPagination({
        currentPage: targetPage,
        totalPages: Math.ceil(sortedItems.length / pageSize),
        totalItems: sortedItems.length,
      });
    } catch (err: unknown) {
      console.error('Error fetching all scrap orders:', err);
      const errorMessage = err instanceof Error ? err.message : 'Lỗi khi tải danh sách scrap orders';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [pageSize, isAuthReady, isAuthenticated, filters]);

  // Fetch status count
  const fetchStatusCount = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated) return;
    try {
      const data = await scrapApi.getStatusCount();
      setStatusCount(data);
    } catch (err: unknown) {
      console.error('Error fetching status count:', err);
    }
  }, [isAuthReady, isAuthenticated]);

  // Initial load
  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      fetchScrapOrders(pagination.currentPage);
      fetchStatusCount();
    }
  }, [isAuthReady, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Đổi trang (Local slice logic)
  const changePage = (page: number) => {
    const start = (page - 1) * pageSize;
    const pagedItems = allScrapOrders.slice(start, start + pageSize);

    setScrapOrders(pagedItems);
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };

  // Filter theo status
  const filterByStatus = (status: string) => {
    const newFilters = { ...filters, status: status === 'ALL' ? undefined : status };
    setFilters(newFilters);
    fetchScrapOrders(1, newFilters);
    setPagination((prev: PaginationState) => ({ ...prev, currentPage: 1 }));
  };

  // Tìm kiếm tổng hợp
  const search = (term: string) => {
    const newFilters = {
      ...filters,
      search: term || undefined,
    };
    setFilters(newFilters);
    fetchScrapOrders(1, newFilters);
    setPagination((prev: PaginationState) => ({ ...prev, currentPage: 1 }));
  };

  // Refresh data
  const refresh = () => {
    fetchScrapOrders(pagination.currentPage);
    fetchStatusCount();
  };

  // ===== ACTIONS =====

  // Helper function to enrich scrap details with metadata
  const enrichScrapDetail = useCallback(async (detail: ScrapOrderDetail): Promise<ScrapOrderDetail> => {
    if (!detail.Items || detail.Items.length === 0) return detail;

    type ScrapItemLoose = {
      ProductId?: number;
      productId?: number;
      LotId?: number;
      lotId?: number;
      ProductName?: string;
      productName?: string;
      ProductCode?: string;
      productCode?: string;
      UomName?: string;
      uomName?: string;
      LotNumber?: string;
      lotNumber?: string;
    };

    const enrichedItems = await Promise.all(
      detail.Items.map(async (item) => {
        const normalizedItem = item as ScrapItemLoose;
        const productId = normalizedItem.ProductId ?? normalizedItem.productId;
        const lotId = normalizedItem.LotId ?? normalizedItem.lotId;

        let productName = normalizedItem.ProductName ?? normalizedItem.productName;
        let productCode = normalizedItem.ProductCode ?? normalizedItem.productCode;
        let uomName = normalizedItem.UomName ?? normalizedItem.uomName;
        let lotNumber = normalizedItem.LotNumber ?? normalizedItem.lotNumber;

        // Fetch product info if missing
        if ((!productName || !uomName) && productId) {
          try {
            const p = await productsApi.getProductById(productId);
            productName = p.Name;
            productCode = p.Code;
            uomName = p.BaseUomName;
          } catch {
            console.error(`Failed to enrich product ${productId}`);
          }
        }

        // Fetch lot info if missing
        if (!lotNumber && lotId) {
          try {
            const l = await productLotsApi.getLotById(lotId);
            lotNumber = l.LotNumber;
          } catch {
            console.error(`Failed to enrich lot ${lotId}`);
          }
        }

        return {
          ...item,
          ProductName: productName,
          ProductCode: productCode,
          UomName: uomName,
          LotNumber: lotNumber,
        };
      })
    );

    return { ...detail, Items: enrichedItems };
  }, []);

  // Lấy chi tiết
  const getDetail = async (id: number): Promise<ScrapOrderDetail | null> => {
    try {
      const data = await scrapApi.getScrapOrder(id);
      if (data) {
        return await enrichScrapDetail(data);
      }
      return null;
    } catch (err: unknown) {
      console.error('Error getting detail:', err);
      return null;
    }
  };

  // Chỉ Tạo đơn (Không còn auto-complete theo yêu cầu mới)
  const createScrapOrder = async (data: CreateScrapOrderRequest): Promise<{ success: boolean; failData?: InventoryCheck[]; errorMessage?: string; createdScrap?: ScrapOrderListItem }> => {
    setActionLoading(true);
    try {
      await scrapApi.createScrapOrder(data);

      // Lấy đơn mới nhất (không phụ thuộc filter hiện tại) để mở detail ngay sau khi tạo
      const firstPage = await scrapApi.getScrapOrders({ page: 1, pageSize: 20 });
      let allItems = [...(firstPage.Items || [])];
      const totalPages = firstPage.TotalPages || 1;

      if (totalPages > 1) {
        const pagePromises = [];
        for (let p = 2; p <= totalPages; p++) {
          pagePromises.push(scrapApi.getScrapOrders({ page: p, pageSize: 20 }));
        }
        const pageResults = await Promise.all(pagePromises);
        pageResults.forEach(res => {
          if (res.Items) allItems = [...allItems, ...res.Items];
        });
      }

      const createdScrap = allItems.sort((a, b) => b.Id - a.Id)[0];

      refresh();
      return { success: true, createdScrap };
    } catch (err: unknown) {
      // Supressing err object to avoid Next.js overlay
      console.error('Error creating scrap order');
      let productName = `Sản phẩm #${data.Item.ProductId}`;
      let lotNum = `Lot #${data.Item.LotId}`;
      let uomName = 'Đơn vị';

      try {
        const [p, l] = await Promise.all([
          productsApi.getProductById(data.Item.ProductId).catch(() => null),
          productLotsApi.getLotById(data.Item.LotId).catch(() => null)
        ]);
        if (p) {
          productName = p.Name;
          uomName = p.BaseUomName || 'Đơn vị';
        }
        if (l) {
          lotNum = l.LotNumber;
        }
      } catch {
        // fail silently for enrichment
      }

      const finalMessage = getApiErrorMessage(err);

      return {
        success: false,
        errorMessage: finalMessage,
        failData: [{
          location: finalMessage,
          lot: lotNum,
          qty: data.Item.Quantity,
          uom: uomName,
          product: productName,
          requiredQty: data.Item.Quantity,
        }]
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Cập nhật đơn
  const updateScrapOrder = async (id: number, data: CreateScrapOrderRequest): Promise<{ success: boolean; failData?: InventoryCheck[]; errorMessage?: string }> => {
    setActionLoading(true);
    try {
      await scrapApi.updateScrapOrder(id, data);
      refresh();
      return { success: true };
    } catch (err: unknown) {
      // Supressing err object to avoid Next.js overlay
      console.error('Error updating scrap order');
      let productName = `Sản phẩm #${data.Item.ProductId}`;
      let lotNum = `Lot #${data.Item.LotId}`;
      let uomName = 'Đơn vị';

      try {
        const [p, l] = await Promise.all([
          productsApi.getProductById(data.Item.ProductId).catch(() => null),
          productLotsApi.getLotById(data.Item.LotId).catch(() => null)
        ]);
        if (p) {
          productName = p.Name;
          uomName = p.BaseUomName || 'Đơn vị';
        }
        if (l) {
          lotNum = l.LotNumber;
        }
      } catch {
        // fail silently for enrichment
      }

      const finalMessage = getApiErrorMessage(err);

      return {
        success: false,
        errorMessage: finalMessage,
        failData: [{
          location: finalMessage,
          lot: lotNum,
          qty: data.Item.Quantity,
          uom: uomName,
          product: productName,
          requiredQty: data.Item.Quantity,
        }]
      };
    } finally {
      setActionLoading(false);
    }
  };

  // Các actions khác...
  // Kiểm tra tồn kho → draft → ready (nếu đủ hàng)
  const checkAvailability = async (id: number): Promise<{ success: boolean; failData?: InventoryCheck[]; errorMessage?: string }> => {
    setActionLoading(true);
    try {
      await scrapApi.checkAvailability(id);
      refresh();
      return { success: true };
    } catch (err: unknown) {
      // Supressing err object to avoid Next.js overlay
      //console.error('Error checking availability');
      // Giả lập data fail tương tự như khi tạo lệnh (Enhancement: fetch detail to show actual context)
      const detail = await getDetail(id);
      let productName = 'Không xác định';
      let uom = 'Đơn vị';
      let reqQty = 0;
      let lotNum = 'N/A';
      const locName = detail?.LocationName || 'N/A';

      if (detail && detail.Items && detail.Items.length > 0) {
        const item = detail.Items[0];
        reqQty = item.Quantity || 0;
        productName = item.ProductName || `Product #${item.ProductId}`;
        uom = item.UomName || '...';
        lotNum = item.LotNumber || `Lot #${item.LotId}`;

        if (!item.ProductName && item.ProductId) {
          try { const p = await productsApi.getProductById(item.ProductId); productName = p.Name; uom = p.BaseUomName || 'Đơn vị'; } catch { }
        }
        if (!item.LotNumber && item.LotId) {
          try { const l = await productLotsApi.getLotById(item.LotId); lotNum = l.LotNumber; } catch { }
        }
      }

      const finalMessage = getApiErrorMessage(err);

      const parseNumberFromMessage = (value?: string, fallback = 0) => {
        if (!value) return fallback;
        const normalized = value
          .replace(/[^\d.,-]/g, '')
          .replace(/,+/g, '')
          .replace(/\.(?=.*\.)/g, '');

        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : fallback;
      };

      const availableQtyMatch = finalMessage.match(/Tồn khả dụng:\s*([^,\n]+)/i);
      const actualQtyMatch = finalMessage.match(/Tồn thực tế:\s*([^,\n]+)/i);
      const requiredQtyMatch = finalMessage.match(/yêu cầu:\s*([^,\n.]+(?:[.,]\d+)?)/i);

      // Ưu tiên lấy tồn khả dụng (Quantity - ReservedQuantity) theo logic mới của BE
      const availableQty = parseNumberFromMessage(availableQtyMatch?.[1], Number.NaN);
      const actualQty = parseNumberFromMessage(actualQtyMatch?.[1], 0);
      const displayQty = Number.isFinite(availableQty) ? availableQty : actualQty;
      const requiredQtyFromMessage = parseNumberFromMessage(requiredQtyMatch?.[1], reqQty);

      return {
        success: false,
        errorMessage: finalMessage,
        failData: [{
          location: locName,
          lot: lotNum,
          qty: displayQty,
          uom: uom,
          product: productName,
          requiredQty: requiredQtyFromMessage
        }]
      };
    } finally {
      setActionLoading(false);
    }
  };

  const completeScrap = async (id: number): Promise<boolean> => {
    setActionLoading(true);
    try {
      await scrapApi.completeScrap(id);
      refresh();
      return true;
    } catch (err: unknown) {
      console.error('Error completing scrap:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const cancelScrap = async (id: number): Promise<boolean> => {
    setActionLoading(true);
    try {
      await scrapApi.cancelScrap(id);
      refresh();
      return true;
    } catch (err: unknown) {
      console.error('Error cancelling scrap:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteScrapOrder = async (id: number): Promise<boolean> => {
    setActionLoading(true);
    try {
      await scrapApi.deleteScrapOrder(id);
      refresh();
      return true;
    } catch (err: unknown) {
      console.error('Error deleting scrap:', err);
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    scrapOrders,
    statusCount,
    loading,
    error,
    actionLoading,
    pagination,
    changePage,
    filterByStatus,
    search,
    refresh,
    getDetail,
    createScrapOrder,
    updateScrapOrder,
    checkAvailability,
    completeScrap,
    cancelScrap,
    deleteScrapOrder,
  };
};
