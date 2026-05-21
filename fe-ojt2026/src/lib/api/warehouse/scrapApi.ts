import apiClient from '../../axios';
import type {
  ScrapOrderListItem,
  ScrapOrderDetail,
  CreateScrapOrderRequest,
  ScrapOrderStatusCount,
  PagedScrapResult,
} from '@/types/warehouse/scrap';

const SCRAP_API_PREFIX = '/api/v1/inventory/ScrapOrders';

export interface GetScrapOrdersParams {
  page?: number;
  pageSize?: number;
  status?: string;
  scrapNo?: string;
  locationName?: string;
  createdBy?: string;
}

export const scrapApi = {
  // Lấy danh sách scrap orders (phân trang + filter)
  getScrapOrders: async (params: GetScrapOrdersParams = {}): Promise<PagedScrapResult> => {
    const { page = 1, pageSize = 10, status, scrapNo, locationName, createdBy } = params;
    const response = await apiClient.get<PagedScrapResult>(SCRAP_API_PREFIX, {
      params: { page, pageSize, status, scrapNo, locationName, createdBy },
    });
    return response.data;
  },

  // Lấy chi tiết scrap order theo ID
  getScrapOrder: async (id: number): Promise<ScrapOrderDetail> => {
    const response = await apiClient.get<ScrapOrderDetail>(`${SCRAP_API_PREFIX}/${id}`);
    return response.data;
  },

  // Lấy số lượng theo từng status
  getStatusCount: async (): Promise<ScrapOrderStatusCount> => {
    const response = await apiClient.get<ScrapOrderStatusCount>(`${SCRAP_API_PREFIX}/status-count`);
    return response.data;
  },

  // Tạo scrap order mới (status = draft)
  createScrapOrder: async (data: CreateScrapOrderRequest): Promise<{ message: string }> => {
    const response = await apiClient.post(`${SCRAP_API_PREFIX}`, data);
    return response.data;
  },

  // Cập nhật scrap order (chỉ khi status = draft)
  updateScrapOrder: async (id: number, data: CreateScrapOrderRequest): Promise<{ message: string }> => {
    const response = await apiClient.put(`${SCRAP_API_PREFIX}/${id}`, data);
    return response.data;
  },

  // Xóa scrap order (chỉ khi status = draft)
  deleteScrapOrder: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`${SCRAP_API_PREFIX}/${id}`);
    return response.data;
  },

  // Kiểm tra tồn kho → draft → ready (nếu đủ hàng)
  checkAvailability: async (id: number): Promise<{ message: string; data: ScrapOrderListItem }> => {
    const response = await apiClient.post(`${SCRAP_API_PREFIX}/${id}/check-availability`);
    return response.data;
  },

  // Hoàn thành scrap order (ready → done, trừ tồn kho)
  completeScrap: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`${SCRAP_API_PREFIX}/${id}/complete`);
    return response.data;
  },

  // Hủy scrap order (draft/ready → cancelled)
  cancelScrap: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`${SCRAP_API_PREFIX}/${id}/cancel`);
    return response.data;
  },
};