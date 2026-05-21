/* eslint-disable @typescript-eslint/no-explicit-any */
// Stock documents API group: stock documents and stock transaction
import axios from "../../axios";
import type { StockDocumentDetail, PagedStockDocumentResult, StockDocumentListItem } from "@/types/warehouse/stockDocuments";
import type { SaleOrderResponse } from "@/types/warehouse/orders";
import { userApi as adminUserApi } from "@/lib/api/admin/userApi";
const STOCK_API_PREFIX = "/api/v1/inventory";

const userNameCache = new Map<number, string>();

const resolveUserNameById = async (userId?: number | null): Promise<string | null> => {
  if (!userId || userId <= 0) return null;

  if (userNameCache.has(userId)) {
    return userNameCache.get(userId) ?? null;
  }

  try {
    const user = await adminUserApi.getUserById(userId) as any;
    const fullName = user?.Fullname || user?.fullname || user?.Username || user?.username || null;
    if (fullName) {
      userNameCache.set(userId, fullName);
    }
    return fullName;
  } catch {
    return null;
  }
};

const isUnresolvedCreatorName = (name?: string | null, id?: number | null): boolean => {
  if (!id || id <= 0) return false;
  if (!name) return true;

  const trimmed = name.trim();
  if (!trimmed) return true;
  return trimmed === String(id);
};

const enrichCreatedByNames = async (items: StockDocumentListItem[]): Promise<StockDocumentListItem[]> => {
  if (!items?.length) return items;

  const idsToResolve = Array.from(
    new Set(
      items
        .filter((x) => isUnresolvedCreatorName(x.CreatedByName, x.CreatedById))
        .map((x) => x.CreatedById as number)
    )
  );

  if (!idsToResolve.length) return items;

  await Promise.all(idsToResolve.map((id) => resolveUserNameById(id)));

  return items.map((item) => {
    if (!isUnresolvedCreatorName(item.CreatedByName, item.CreatedById) || !item.CreatedById) return item;

    const resolved = userNameCache.get(item.CreatedById);
    return {
      ...item,
      CreatedByName: resolved ?? item.CreatedByName ?? null,
    };
  });
};

export const stockDocumentsApi = {
  // Lấy danh sách phiếu xuất (OUT)
  getOutTransfers: async (
    page: number,
    pageSize: number,
    orderNo?: string,
    locationName?: string,
    status?: string,
    fromDate?: string,
    toDate?: string,
    dateType?: 'created' | 'planned'
  ): Promise<SaleOrderResponse> => {
    const params: any = { page, pageSize, orderNo, locationName, fromDate, toDate };

    // Nếu status là 'all', không gửi params status lên BE
    if (status && status !== 'all') {
      params.status = status;
    }

    // Ánh xạ ngày dựa trên dateType mà backend mong đợi
    if (dateType === 'created') {
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
    } else if (dateType === 'planned') {
      if (fromDate) params.fromPlannedDate = fromDate;
      if (toDate) params.toPlannedDate = toDate;
    }

    const response = await axios.get(`${STOCK_API_PREFIX}/SaleOrders`, { params });
    return response.data;
  },
  // Tạo phiếu xuất mới
  createOutTransfer: async (data: any): Promise<any> => {
    const response = await axios.post(`${STOCK_API_PREFIX}/SaleOrders`, data);
    return response.data;
  },
  // Lấy chi tiết phiếu xuất
  getOutTransferById: async (id: number): Promise<any> => {
    const response = await axios.get(`${STOCK_API_PREFIX}/SaleOrders/${id}`);
    return response.data;
  },
  // Cập nhật Header phiếu xuất
  updateSaleOrderHeader: async (id: number, data: any): Promise<any> => {
    const response = await axios.put(`${STOCK_API_PREFIX}/SaleOrders/${id}`, data);
    return response.data;
  },

  // Cập nhật Item trong phiếu xuất
  updateSaleOrderItem: async (id: number, itemId: number, data: any): Promise<any> => {
    const response = await axios.put(`${STOCK_API_PREFIX}/SaleOrders/${id}/items/${itemId}`, data);
    return response.data;
  },

  // Thêm mới Item vào phiếu xuất
  addSaleOrderItem: async (id: number, data: any): Promise<any> => {
    const response = await axios.post(`${STOCK_API_PREFIX}/SaleOrders/${id}/items`, data);
    return response.data;
  },

  // Xóa Item khỏi phiếu xuất
  deleteSaleOrderItem: async (id: number, itemId: number): Promise<any> => {
    const response = await axios.delete(`${STOCK_API_PREFIX}/SaleOrders/${id}/items/${itemId}`);
    return response.data;
  },

  // ===== TRẠNG THÁI (STATUS WORKFLOW) =====

  // Chuyển sang Ready (Kiểm tra tồn kho)
  checkAvailability: async (id: number): Promise<any> => {
    const response = await axios.post(`${STOCK_API_PREFIX}/SaleOrders/${id}/check-availability`);
    return response.data;
  },

  // Hoàn thành phiếu (Sang Done)
  completeSaleOrder: async (id: number): Promise<any> => {
    try {
      const response = await axios.post(`${STOCK_API_PREFIX}/SaleOrders/${id}/complete`);
      return response.data;
    } catch (error: any) {
      const detail =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Không thể hoàn thành phiếu xuất kho.";
      throw new Error(detail);
    }
  },

  // Hủy phiếu
  cancelSaleOrder: async (id: number): Promise<any> => {
    const response = await axios.post(`${STOCK_API_PREFIX}/SaleOrders/${id}/cancel`);
    return response.data;
  },
  // Xóa phiếu (Draft)
  deleteSaleOrder: async (id: number): Promise<any> => {
    const response = await axios.delete(`${STOCK_API_PREFIX}/SaleOrders/${id}`);
    return response.data;
  },
  // Lấy thống kê số lượng theo trạng thái
  getStatusCount: async (): Promise<any> => {
    const response = await axios.get(`${STOCK_API_PREFIX}/SaleOrders/status-count`);
    return response.data;
  },

  // ===== STOCK DOCUMENTS (LỊCH SỬ DỊCH CHUYỂN) =====

  // Lấy danh sách phiếu di chuyển kho (Stock Documents)
  getStockDocuments: async (params: {
    page: number;
    pageSize?: number;
    createdById?: number;
    search?: string;
    documentType?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    managerId?: number;
    warehouseId?: number;
    locationId?: number;
    productId?: number;
    lotId?: number;
    createdByUserId?: number;
    dateType?: string;
  }): Promise<PagedStockDocumentResult> => {
    const apiParams = { ...params, locationName: params.search };
    const response = await axios.get("/api/v1/inventory/StockDocuments", { params: apiParams });
    const data = response.data as PagedStockDocumentResult;

    data.Items = await enrichCreatedByNames(data.Items || []);
    return data;
  },

  // Lấy chi tiết phiếu di chuyển kho
  getStockDocumentById: async (id: number): Promise<StockDocumentDetail> => {
    const response = await axios.get(`/api/v1/inventory/StockDocuments/${id}`);
    const detail = response.data as StockDocumentDetail;

    if (isUnresolvedCreatorName(detail.CreatedByName, detail.CreatedById)) {
      const resolved = await resolveUserNameById(detail.CreatedById);
      detail.CreatedByName = resolved ?? detail.CreatedByName ?? null;
    }

    return detail;
  },

  // Lấy lịch sử giao dịch kho theo ID phiếu di chuyển
  getStockTransactionsByDocumentId: async (documentId: number): Promise<any[]> => {
    const response = await axios.get(`${STOCK_API_PREFIX}/StockTransactions/by-document/${documentId}`);
    return response.data;
  },

  // Lấy thống kê số lượng phiếu di chuyển theo trạng thái
  getStockDocumentStatusCount: async (params: {
    documentType?: string;
    search?: string;
    warehouseId?: number;
    locationId?: number;
  } = {}): Promise<any> => {
    const response = await axios.get(`${STOCK_API_PREFIX}/StockDocuments/status-count`, { params });
    return response.data;
  },

  // Lấy danh sách phiếu di chuyển theo loại (SaleOrder, TransferOrder, v.v.)
  getStockDocumentsByType: async (type: string): Promise<any[]> => {
    const response = await axios.get(`${STOCK_API_PREFIX}/StockDocuments/by-type/${type}`);
    return response.data;
  },
};
