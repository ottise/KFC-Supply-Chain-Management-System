import type { AxiosRequestConfig } from "axios";
import apiClient from "../../axios";
import type {
  PurchaseOrder,
  PurchaseOrderDetail,
  PurchaseOrderResponse,
  PurchaseOrderSearchParams,
  CreatePurchaseOrderRequest,
  PurchaseOrderStatus
} from "@/types/warehouse/purchaseOrder";

const PO_API_PREFIX = "/api/v1/inventory/PurchaseOrders";
const PO_ITEM_API_PREFIX = "/api/v1/inventory/PurchaseOrderItem";

type PurchaseOrderMutationPayload = Record<string, unknown>;

interface PurchaseOrderMutationResponse extends PurchaseOrder {
  id?: number;
  DocId?: number;
  docId?: number;
}

export const purchaseOrderApi = {
  // GET /api/PurchaseOrders/search
  searchPurchaseOrders: async (params: PurchaseOrderSearchParams, config?: AxiosRequestConfig): Promise<PurchaseOrderResponse> => {
    const response = await apiClient.get<PurchaseOrderResponse>(`${PO_API_PREFIX}/search`, {
      params,
      ...config
    });
    return response.data;
  },

  // GET /api/PurchaseOrders
  getAllPurchaseOrders: async (): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(PO_API_PREFIX);
    return response.data;
  },

  // POST /api/PurchaseOrders
  createPurchaseOrder: async (data: CreatePurchaseOrderRequest): Promise<PurchaseOrder> => {
    const response = await apiClient.post<PurchaseOrder>(PO_API_PREFIX, data);
    return response.data;
  },

  // GET /api/PurchaseOrders/{id}
  getPurchaseOrderById: async (id: number): Promise<PurchaseOrder> => {
    const response = await apiClient.get<PurchaseOrder>(`${PO_API_PREFIX}/${id}`);
    return response.data;
  },

  // GET /api/PurchaseOrders/{id}/detail
  getPurchaseOrderDetail: async (id: number): Promise<PurchaseOrderDetail> => {
    const response = await apiClient.get<PurchaseOrderDetail>(`${PO_API_PREFIX}/${id}/detail`);
    return response.data;
  },

  // GET /api/PurchaseOrderItem/order/{orderId}
  getPurchaseOrderItemsByOrderId: async (orderId: number): Promise<Record<string, unknown>[]> => {
    const response = await apiClient.get<Record<string, unknown>[]>(`${PO_ITEM_API_PREFIX}/order/${orderId}`);
    return response.data;
  },

  // GET /api/PurchaseOrders/supplier/{supplierId}
  getPurchaseOrdersBySupplier: async (supplierId: number): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(`${PO_API_PREFIX}/supplier/${supplierId}`);
    return response.data;
  },

  // GET /api/PurchaseOrders/status/{status}
  getPurchaseOrdersByStatus: async (status: PurchaseOrderStatus): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(`${PO_API_PREFIX}/status/${status}`);
    return response.data;
  },

  // GET /api/PurchaseOrders/created/{date}
  getPurchaseOrdersByCreatedDate: async (date: string): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(`${PO_API_PREFIX}/created/${date}`);
    return response.data;
  },

  // GET /api/PurchaseOrders/confirmed/{date}
  getPurchaseOrdersByConfirmedDate: async (date: string): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(`${PO_API_PREFIX}/confirmed/${date}`);
    return response.data;
  },

  // GET /api/PurchaseOrders/completed/{date}
  getPurchaseOrdersByCompletedDate: async (date: string): Promise<PurchaseOrder[]> => {
    const response = await apiClient.get<PurchaseOrder[]>(`${PO_API_PREFIX}/completed/${date}`);
    return response.data;
  },

  // PUT /api/PurchaseOrders/{id}/supplier/{supplierId}
  updatePurchaseOrderSupplier: async (id: number, supplierId: number): Promise<unknown> => {
    const response = await apiClient.put(`${PO_API_PREFIX}/${id}/supplier/${supplierId}`);
    return response.data;
  },

  // PUT /api/PurchaseOrders/{id}/status/{status}
  updatePurchaseOrderStatus: async (id: number, status: PurchaseOrderStatus): Promise<unknown> => {
    const response = await apiClient.put(`${PO_API_PREFIX}/${id}/status/${status}`);
    return response.data;
  },

  // POST /api/PurchaseOrders/draft
  createDraft: async (data: PurchaseOrderMutationPayload): Promise<PurchaseOrderMutationResponse> => {
    const response = await apiClient.post<PurchaseOrderMutationResponse>(`${PO_API_PREFIX}/draft`, data);
    return response.data;
  },

  // POST /api/PurchaseOrders/confirm
  confirmPurchaseOrder: async (data: PurchaseOrderMutationPayload): Promise<PurchaseOrderMutationResponse> => {
    const response = await apiClient.post<PurchaseOrderMutationResponse>(`${PO_API_PREFIX}/confirm`, data);
    return response.data;
  },

  // POST /api/PurchaseOrders/completed
  completePurchaseOrder: async (data: PurchaseOrderMutationPayload): Promise<PurchaseOrderMutationResponse> => {
    const response = await apiClient.post<PurchaseOrderMutationResponse>(`${PO_API_PREFIX}/completed`, data);
    return response.data;
  },

  // DELETE /api/PurchaseOrderItem/{id}
  deletePurchaseOrderItem: async (id: number): Promise<void> => {
    await apiClient.delete(`${PO_ITEM_API_PREFIX}/${id}`);
  },

  // PUT /api/PurchaseOrders/{id}/cancel
  cancelPurchaseOrder: async (id: number): Promise<void> => {
    await apiClient.put(`${PO_API_PREFIX}/${id}/cancel`);
  },

  // DELETE /api/PurchaseOrders/{id}
  deletePurchaseOrder: async (id: number): Promise<void> => {
    await apiClient.put(`${PO_API_PREFIX}/${id}/cancel`);
  },
};

