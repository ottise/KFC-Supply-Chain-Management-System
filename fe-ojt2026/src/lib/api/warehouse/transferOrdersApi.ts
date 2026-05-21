import apiClient from "../../axios";
import type {
    CreateTransferOrderRequest,
    UpdateTransferOrderRequest,
    AddTransferItemRequest,
    TransferOrderDetail,
    TransferStatusCount,
    PagedTransferOrders,
    CheckAvailabilityResult,
} from "@/types/warehouse/transferOrders";
const API_PREFIX = "/api/v1/inventory/TransferOrders";
export interface GetTransferOrdersParams {
    status?: string;
    transferNo?: string;
    locationName?: string;
    createdBy?: string;
    page?: number;
    pageSize?: number;
    createdById?: number;
}
export const transferOrdersApi = {
    // 1. Lấy danh sách (phân trang)
    getTransferOrders: async (params: GetTransferOrdersParams = {}): Promise<PagedTransferOrders> => {
        const response = await apiClient.get(API_PREFIX, { params });
        return response.data;
    },
    // 2. Lấy chi tiết theo ID
    getTransferById: async (id: number): Promise<TransferOrderDetail> => {
        const response = await apiClient.get(`${API_PREFIX}/${id}`);
        return response.data;
    },
    // 3. Đếm số lượng theo status
    getStatusCount: async (): Promise<TransferStatusCount> => {
        const response = await apiClient.get(`${API_PREFIX}/status-count`);
        return response.data;
    },
    // 4. Tạo mới
    createTransfer: async (data: CreateTransferOrderRequest): Promise<{ message: string, data: TransferOrderDetail }> => {
        const response = await apiClient.post(API_PREFIX, data);
        return response.data;
    },
    // 4b. Tạo mới và lấy về data (bao gồm Id)
    createTransferByLocation: async (data: CreateTransferOrderRequest): Promise<{ message: string, data: TransferOrderDetail }> => {
        const response = await apiClient.post(`${API_PREFIX}/create-by-location`, data);
        return response.data;
    },
    // 5. Cập nhật header
    updateTransfer: async (id: number, data: UpdateTransferOrderRequest): Promise<{ message: string }> => {
        const response = await apiClient.put(`${API_PREFIX}/${id}`, data);
        return response.data;
    },
    // 6. Xóa
    deleteTransfer: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete(`${API_PREFIX}/${id}`);
        return response.data;
    },
    // 7. Thêm item vào transfer order
    addItem: async (id: number, data: AddTransferItemRequest): Promise<{ message: string }> => {
        const response = await apiClient.post(`${API_PREFIX}/${id}/items`, data);
        return response.data;
    },
    // 8. Cập nhật item
    updateItem: async (id: number, itemId: number, data: AddTransferItemRequest): Promise<{ message: string }> => {
        const response = await apiClient.put(`${API_PREFIX}/${id}/items/${itemId}`, data);
        return response.data;
    },
    // 9. Xóa item
    deleteItem: async (id: number, itemId: number): Promise<{ message: string }> => {
        const response = await apiClient.delete(`${API_PREFIX}/${id}/items/${itemId}`);
        return response.data;
    },
    // 10. Kiểm tra tồn kho
    checkAvailability: async (id: number): Promise<CheckAvailabilityResult> => {
        const response = await apiClient.post(`${API_PREFIX}/${id}/check-availability`);
        return response.data;
    },
    // 11. Hoàn thành
    completeTransfer: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post(`${API_PREFIX}/${id}/complete`);
        return response.data;
    },
    // 12. Hủy
    cancelTransfer: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post(`${API_PREFIX}/${id}/cancel`);
        return response.data;
    },
};