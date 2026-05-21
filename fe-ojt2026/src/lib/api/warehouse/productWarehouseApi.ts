import apiClient from "../../axios";

const API_PREFIX = "/api/v1/inventory/ProductWarehouses";

export interface ProductWarehouseItem {
    Id: number;
    ProductId: number;
    ProductName: string;
    ProductCode: string;
    CategoryName: string;
    CategoryId: number | null;
    BaseUomId: number | null;
    BaseUomName: string;
    WarehouseId: number;
    WarehouseName: string;
    IsActive: boolean | null;
    CreatedAt: string | null;
    CreatedById: number | null;
    MinQty: number | null;
    MaxQty: number | null;
    SalePrice: number | null;
    HasReorderingRule: boolean;
}

export interface ProductWarehouseResponse {
    Items: ProductWarehouseItem[];
    Page: number;
    PageSize: number;
    TotalItems: number;
    TotalPages: number;
    HasNext: boolean;
    HasPrevious: boolean;
}

export interface GetProductWarehouseParams {
    search?: string;
    searchField?: string;
    isActive?: boolean;
    categoryId?: number;
    page?: number;
    pageSize?: number;
}

export const productWarehouseApi = {
    /** Lấy tất cả sản phẩm trong các kho (theo manager token) */
    getAll: async (params: GetProductWarehouseParams = {}): Promise<ProductWarehouseResponse> => {
        const response = await apiClient.get<ProductWarehouseResponse>(API_PREFIX, { params });
        return response.data;
    },

    /** Lấy sản phẩm theo kho cụ thể */
    getByWarehouse: async (warehouseId: number, params: GetProductWarehouseParams = {}): Promise<ProductWarehouseResponse> => {
        const response = await apiClient.get<ProductWarehouseResponse>(`${API_PREFIX}/warehouse/${warehouseId}`, { params });
        return response.data;
    },

    /** Thêm sản phẩm vào kho */
    addProduct: async (productId: number, warehouseId: number): Promise<ProductWarehouseItem> => {
        const response = await apiClient.post<ProductWarehouseItem>(API_PREFIX, { ProductId: productId, WarehouseId: warehouseId });
        return response.data;
    },

    /** Soft-delete sản phẩm khỏi kho */
    removeProduct: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`${API_PREFIX}/${id}`);
        return response.data;
    },

    /** Đổi trạng thái sản phẩm trong kho */
    changeStatus: async (id: number, isActive: boolean): Promise<ProductWarehouseItem> => {
        const response = await apiClient.put<ProductWarehouseItem>(`${API_PREFIX}/${id}/status`, { IsActive: isActive });
        return response.data;
    },
};
