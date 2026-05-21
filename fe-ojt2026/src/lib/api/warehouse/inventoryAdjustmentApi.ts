/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from '../../axios';
import type {
  InventoryItemResponse,
  AdjustmentTransaction,
  StaffWorkItem,
  UpdateCountRequest
} from '@/types/warehouse/inventoryAdjustment';

const ADJ_API_PREFIX = '/api/v1/inventory/InventoryAdjustment';

/**
 * Helper để làm sạch query params (loại bỏ null, undefined, "", "null", "undefined")
 * Giống logic đã áp dụng cho locationsApi.
 */
const cleanQueryParams = (params: any) => {
  if (!params) return {};
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== "null" && value !== "undefined" && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
};

export const inventoryAdjustmentApi = {

  // Lấy danh sách inventory để kiểm kê
  getInventories: async (warehouseId?: number): Promise<InventoryItemResponse[]> => {
    const response = await apiClient.get<any[]>(`${ADJ_API_PREFIX}/inventories`, {
      params: { warehouseId }
    });
    return (response.data || []).map(inv => ({
      Id: inv.id || inv.Id,
      ProductId: inv.productId || inv.ProductId,
      Quantity: inv.quantity || inv.Quantity,
      ReservedQuantity: inv.reservedQuantity || inv.ReservedQuantity,
      LotId: inv.lotId || inv.LotId,
      Location: {
        Id: inv.location?.id || inv.location?.Id || inv.Location?.Id,
        Name: inv.location?.name || inv.location?.Name || inv.Location?.Name,
        WarehouseId: inv.location?.warehouseId || inv.location?.WarehouseId || inv.Location?.WarehouseId
      }
    } as InventoryItemResponse));
  },

  // API Lấy danh sách inventory của manager mới (kết hợp transaction draft)
  getManagerInventories: async (params?: { lotId?: number, locationId?: number, warehouseId?: number, status?: string }) => {
    try {
      // Map to PascalCase for backend compatibility (.NET)
      const pascalParams = {
        LotId: params?.lotId,
        LocationId: params?.locationId,
        WarehouseId: params?.warehouseId,
        Status: params?.status
      };

      const response = await apiClient.get<any[]>(`${ADJ_API_PREFIX}/manager-inventories`, {
        params: cleanQueryParams(pascalParams)
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // API Lưu nháp mới - Cập nhật để log lỗi chi tiết
  createDraft: async (data: { InventoryId: number, AssigneeId: number, PlanDate: string }) => {
    try {
      console.log("createDraft API Request:", data);
      const response = await apiClient.post<any>(`${ADJ_API_PREFIX}/draft`, data);
      return response.data;
    } catch (error: any) {
      console.error("createDraft API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  // API Hoàn tất (Complete) mới
  completeAdjustment: async (data: { tranId: number, finalCountQty: number }[]) => {
    const response = await apiClient.post<any>(`${ADJ_API_PREFIX}/complete`, data);
    return response.data;
  },

  // Lấy inventory hiện tại (có thể lọc theo warehouse)
  getCurrentInventories: async (warehouseId?: number): Promise<InventoryItemResponse[]> => {
    const response = await apiClient.get<any[]>(`${ADJ_API_PREFIX}/current`, {
      params: { warehouseId },
    });
    return (response.data || []).map(inv => ({
      Id: inv.id || inv.Id,
      ProductId: inv.productId || inv.ProductId,
      Quantity: inv.quantity || inv.Quantity,
      ReservedQuantity: inv.reservedQuantity || inv.ReservedQuantity,
      LotId: inv.lotId || inv.LotId,
      Location: {
        Id: inv.location?.id || inv.location?.Id || inv.Location?.Id,
        Name: inv.location?.name || inv.location?.Name || inv.Location?.Name,
        WarehouseId: inv.location?.warehouseId || inv.location?.WarehouseId || inv.Location?.WarehouseId
      }
    } as InventoryItemResponse));
  },



  // Lấy danh sách phiếu kiểm kê cho manager
  getAdjustmentsForManager: async (params?: {
    status?: string;
    lotId?: number;
    locationId?: number;
    warehouseId?: number
  }): Promise<AdjustmentTransaction[]> => {
    try {
      const response = await apiClient.get<any[]>(`${ADJ_API_PREFIX}/adjustments/manager`, {
        params,
      });
      return (response.data || []).map(t => ({
        TransactionId: t.transactionId || t.TransactionId,
        InventoryId: t.inventoryId || t.InventoryId,
        ProductId: t.productId || t.ProductId,
        SystemQty: t.systemQty || t.SystemQty,
        CountQty: t.countQty || t.CountQty,
        Different: t.different || t.Different,
        CreatedAt: t.createdAt || t.CreatedAt,
        CompletedAt: t.completedAt || t.CompletedAt,
        Status: t.status || t.Status,
        AssigneeId: t.assigneeId || t.AssigneeId,
        DocNo: t.docNo || t.DocNo,
        warehouseCode: t.warehouseCode || t.warehouseCode
      } as AdjustmentTransaction));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },
  // Lấy danh sách phiếu kiểm kê cho staff (assignee)
  getAdjustmentsByAssignee: async (assigneeId: number): Promise<any[]> => {
    try {
      const response = await apiClient.get<any[]>(`${ADJ_API_PREFIX}/adjustments/assignee/${assigneeId}`);
      console.log(`GET /api/InventoryAdjustment/adjustments/assignee/${assigneeId} Response:`, response.data);
      return (response.data || []).map(t => ({
        // Aliasing for component compatibility
        Id: t.transactionId || t.TransactionId,
        DocumentNo: t.docNo || t.DocNo,
        FromLocationName: t.warehouseCode || t.WarehouseCode || "N/A",

        // Original fields
        TransactionId: t.transactionId || t.TransactionId,
        InventoryId: t.inventoryId || t.InventoryId,
        ProductId: t.productId || t.ProductId,
        SystemQty: t.systemQty || t.SystemQty,
        CountQty: t.countQty || t.CountQty,
        Different: t.different || t.Different,
        CreatedAt: t.createdAt || t.CreatedAt,
        CompletedAt: t.completedAt || t.CompletedAt,
        Status: t.status || t.Status,
        AssigneeId: t.assigneeId || t.AssigneeId,
        DocNo: t.docNo || t.DocNo,
        warehouseCode: t.warehouseCode || t.WarehouseCode
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  // NEW: Lấy danh sách công việc cho staff
  getStaffWork: async (params?: { lotId?: number, locationId?: number, warehouseId?: number }): Promise<StaffWorkItem[]> => {
    try {
      const response = await apiClient.get<StaffWorkItem[]>(`${ADJ_API_PREFIX}/staff-work`, {
        params: cleanQueryParams(params)
      });
      return response.data || [];
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        return [];
      }
      throw error;
    }
  },

  // NEW: Cập nhật số lượng đếm - Thêm diagnostic logging chi tiết
  updateCount: async (data: UpdateCountRequest): Promise<StaffWorkItem> => {
    try {
      const response = await apiClient.put<StaffWorkItem>(`${ADJ_API_PREFIX}/update-count`, data);
      return response.data;
    } catch (error: any) {
      // Robust error retrieval: try data.message, then raw data if it's a string, then error.message
      const errorDetail =
        error.response?.data?.message ||
        (typeof error.response?.data === 'string' ? error.response.data : null) ||
        error.message;

      console.error("updateCount API Error Detail:", {
        status: error.response?.status,
        data: error.response?.data,
        detail: errorDetail,
        input: data
      });
      throw new Error(errorDetail);
    }
  },

  // Mock methods for CreateAdjustmentModal.tsx compatibility
  createVoucher: async (data: any): Promise<any> => {
    const response = await apiClient.post<any>(`${ADJ_API_PREFIX}/vouchers`, data);
    return response.data;
  },

  completeVoucher: async (data: any): Promise<any> => {
    const response = await apiClient.post<any>(`${ADJ_API_PREFIX}/vouchers/complete`, data);
    return response.data;
  }
};
