import apiClient from "../../axios";
import type { ProductLot } from "@/types/warehouse/productLot";

const LOTS_API_PREFIX = "/api/v1/inventory/productlots";

export interface SearchLotsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  productId?: number;
  managerId?: number;
  locationId?: number;
  expirationDateBefore?: string;
  expirationDateAfter?: string;
  expiresWithinDays?: number;
}

export interface GetProductLotsParams {
  page?: number;
  pageSize?: number;
  lotNumber?: string;
  expirationDateFrom?: string;
  expirationDateTo?: string;
}

export interface SearchProductLotsParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  productId?: number;
  managerId?: number;
  locationId?: number;
  expirationDateBefore?: string;  // format: "YYYY-MM-DD"
  expirationDateAfter?: string;
  expiresWithinDays?: number;
}

export interface PagedProductLotResult {
  Items: ProductLot[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export const productLotsApi = {
  // Lấy danh sách lot (phân trang + filter)
  getProductLots: async (params: GetProductLotsParams = {}): Promise<PagedProductLotResult> => {
    const response = await apiClient.get<PagedProductLotResult>(LOTS_API_PREFIX, {
      params,
    });
    return response.data;
  },

  searchLots: async (params: SearchProductLotsParams = {}): Promise<PagedProductLotResult> => {
    const response = await apiClient.get<PagedProductLotResult>(`${LOTS_API_PREFIX}/search`, {
      params,
    });
    return response.data;
  },

  // Lấy tất cả lot (không phân trang)
  getAllLots: async (): Promise<ProductLot[]> => {
    const response = await apiClient.get<ProductLot[]>(`${LOTS_API_PREFIX}/all`);
    return response.data;
  },

  // Lấy chi tiết lot theo ID
  getLotById: async (id: number): Promise<ProductLot> => {
    const response = await apiClient.get<ProductLot>(`${LOTS_API_PREFIX}/${id}`);
    return response.data;
  },

  // Lấy danh sách lot theo location
  getLotsByLocationId: async (locationId: number): Promise<ProductLot[]> => {
    const response = await apiClient.get<ProductLot[]>(`${LOTS_API_PREFIX}/location/${locationId}`);
    return response.data;
  },

  // Lấy danh sách lot theo location + product
  getLotsByLocationAndProductId: async (locationId: number, productId: number): Promise<ProductLot[]> => {
    const response = await apiClient.get<ProductLot[]>(`${LOTS_API_PREFIX}/location/${locationId}/product/${productId}`);
    return response.data;
  },

  // Tạo mới lot
  createLot: async (data: Partial<ProductLot>): Promise<{ message: string; lot: ProductLot }> => {
    const response = await apiClient.post<{ message: string; lot: ProductLot }>(LOTS_API_PREFIX, data);
    return response.data;
  },

  // Cập nhật lot
  updateLot: async (id: number, data: Partial<ProductLot>): Promise<{ message: string; lot: ProductLot }> => {
    const response = await apiClient.put<{ message: string; lot: ProductLot }>(`${LOTS_API_PREFIX}/${id}`, data);
    return response.data;
  },

  // Xóa lot
  deleteLot: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${LOTS_API_PREFIX}/${id}`);
    return response.data;
  },
};
