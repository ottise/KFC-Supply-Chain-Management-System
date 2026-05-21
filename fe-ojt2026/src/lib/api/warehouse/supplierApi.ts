import apiClient from "../../axios";
import type {
    SupplierFromAPI,
    Supplier,
    SupplierResponseFromAPI,
    SupplierResponse,
    CreateSupplierRequest,
    UpdateSupplierRequest
} from "@/types/warehouse/partners";

const SUPPLIERS_API_PREFIX = "/api/v1/inventory/Suppliers";

export interface GetSuppliersParams {
    page?: number;
    pageSize?: number;
    search?: string;
    isActive?: boolean;
}

// Helper function to map API response to FE type
// Since BE doesn't return IsActive, we determine it from the isActive query param used
const mapSupplierFromAPI = (supplier: SupplierFromAPI, isActive: boolean): Supplier => {
    return {
        ...supplier,
        IsActive: isActive
    } as Supplier;
};

export const supplierApi = {
    // Lấy danh sách nhà cung cấp (phân trang + filter)
    getSuppliers: async (params: GetSuppliersParams = {}): Promise<SupplierResponse> => {
        const response = await apiClient.get<SupplierResponseFromAPI>(SUPPLIERS_API_PREFIX, {
            params: {
                page: params.page,
                pageSize: params.pageSize,
                search: params.search || undefined,
                isActive: params.isActive,
            },
        });

        // Determine IsActive based on the query param sent
        // If isActive param was explicitly set, use that value for all returned items
        // If not set (undefined), we don't know the status -> default true (will be overridden by dual-call logic)
        const isActiveValue = params.isActive !== undefined ? params.isActive : true;

        const mappedItems = response.data.Items.map(item => mapSupplierFromAPI(item, isActiveValue));

        return {
            ...response.data,
            Items: mappedItems
        };
    },

    // Helper: fetch ALL pages for a given isActive filter (BE max pageSize = 100)
    _fetchAllPages: async (isActive: boolean, search?: string): Promise<Supplier[]> => {
        const allItems: Supplier[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
            const response = await apiClient.get<SupplierResponseFromAPI>(SUPPLIERS_API_PREFIX, {
                params: {
                    page: currentPage,
                    pageSize: 100, // BE max allowed
                    search: search || undefined,
                    isActive,
                },
            });
            const mapped = response.data.Items.map(item => mapSupplierFromAPI(item, isActive));
            allItems.push(...mapped);
            totalPages = response.data.TotalPages;
            currentPage++;
        } while (currentPage <= totalPages);

        return allItems;
    },

    /** Chỉ NCC đang hoạt động (IsActive), phân trang đủ toàn bộ — dùng cho dropdown phiếu nhập. */
    getAllActiveSuppliers: async (params: { search?: string } = {}): Promise<Supplier[]> => {
        return supplierApi._fetchAllPages(true, params.search);
    },

    // Lấy tất cả suppliers với status chính xác bằng cách gọi 2 API (active + inactive)
    getAllSuppliersWithStatus: async (params: { search?: string } = {}): Promise<{
        activeItems: Supplier[];
        inactiveItems: Supplier[];
    }> => {
        const [activeItems, inactiveItems] = await Promise.all([
            supplierApi._fetchAllPages(true, params.search),
            supplierApi._fetchAllPages(false, params.search),
        ]);

        return { activeItems, inactiveItems };
    },

    // Lấy chi tiết nhà cung cấp theo ID
    getSupplierById: async (id: number): Promise<Supplier> => {
        const response = await apiClient.get<SupplierFromAPI>(`${SUPPLIERS_API_PREFIX}/${id}`);
        // Detail endpoint only returns active suppliers (BE filters IsActive == true)
        return mapSupplierFromAPI(response.data, true);
    },

    // Tạo mới nhà cung cấp
    createSupplier: async (data: CreateSupplierRequest): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(SUPPLIERS_API_PREFIX, data);
        return response.data;
    },

    // Cập nhật thông tin nhà cung cấp
    updateSupplier: async (id: number, data: UpdateSupplierRequest): Promise<{ message: string }> => {
        const response = await apiClient.put<{ message: string }>(`${SUPPLIERS_API_PREFIX}/${id}`, data);
        return response.data;
    },

    // Xóa mềm nhà cung cấp (soft delete)
    deleteSupplier: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(`${SUPPLIERS_API_PREFIX}/${id}`);
        return response.data;
    },

    // Khôi phục nhà cung cấp đã xóa
    reactivateSupplier: async (id: number): Promise<{ message: string }> => {
        const response = await apiClient.post<{ message: string }>(`${SUPPLIERS_API_PREFIX}/${id}/reactivate`);
        return response.data;
    },
};
