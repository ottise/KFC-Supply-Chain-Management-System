import apiClient from "../../axios";

const API_PREFIX = "/api/v1/inventory/ReorderingRule";

export interface ReorderingRuleItem {
    Id: number;
    ProductWarehouseId: number | null;
    MinQty: number | null;
    MaxQty: number | null;
    TriggerType: string | null;
    IsActive: boolean | null;
    CreatedAt: string | null;
}

export interface ReorderingRuleResponse {
    Items: ReorderingRuleItem[];
    Page: number;
    PageSize: number;
    TotalItems: number;
    TotalPages: number;
    HasNext: boolean;
    HasPrevious: boolean;
}

export interface CreateReorderingRuleRequest {
    ProductWarehouseId: number;
    MinQty: number;
    MaxQty: number | null;
    TriggerType?: string;
}

export interface UpdateReorderingRuleRequest {
    MinQty?: number;
    MaxQty?: number | null;
    TriggerType?: string;
}

export interface ReorderingRuleWarningDto {
    RuleId: number;
    ProductWarehouseId: number;
    ProductId: number;
    ProductName: string;
    WarehouseId: number;
    WarehouseName: string;
    MinQty: number;
    MaxQty: number | null;
    CurrentAvailableQty: number;
    Message: string;
    BaseUomName?: string;
}

export interface ReorderingRuleWarningResponse {
    Items: ReorderingRuleWarningDto[];
    Page: number;
    PageSize: number;
    TotalItems: number;
    TotalPages: number;
    HasNext: boolean;
    HasPrevious: boolean;
}

export const reorderingRuleApi = {
    /** Lấy danh sách cảnh báo tồn kho thấp */
    getWarnings: async (params: { page?: number; pageSize?: number; warehouseId?: number; managerId?: number } = {}): Promise<ReorderingRuleWarningResponse> => {
        const response = await apiClient.get<ReorderingRuleWarningResponse>(`${API_PREFIX}/warnings`, { params });
        return response.data;
    },

    /** Lấy danh sách rule theo productWarehouseId */
    getByProductWarehouse: async (productWarehouseId: number): Promise<ReorderingRuleResponse> => {
        const response = await apiClient.get<ReorderingRuleResponse>(API_PREFIX, {
            params: { productWarehouseId, page: 1, pageSize: 100 }
        });
        return response.data;
    },

    /** Tạo rule mới */
    create: async (data: CreateReorderingRuleRequest): Promise<ReorderingRuleItem> => {
        const response = await apiClient.post<ReorderingRuleItem>(API_PREFIX, { ...data, TriggerType: "Manual" });
        return response.data;
    },

    /** Cập nhật rule */
    update: async (productWarehouseId: number, data: UpdateReorderingRuleRequest): Promise<ReorderingRuleItem> => {
        const response = await apiClient.put<ReorderingRuleItem>(`${API_PREFIX}/${productWarehouseId}`, { ...data, TriggerType: "Manual" });
        return response.data;
    },

    /** Xóa rule (soft delete) */
    delete: async (productWarehouseId: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`${API_PREFIX}/${productWarehouseId}`);
        return response.data;
    },
};
