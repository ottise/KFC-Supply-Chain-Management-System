import apiClient from "@/lib/axios";
import type {
  Customer,
  CustomerResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  GetCustomerParams
} from "@/types/customer";

const CUSTOMERS_API_PREFIX = "/api/v1/inventory/Customers";

export const customersApi = {
  // Lấy danh sách khách hàng (phân trang + filter)
  getCustomers: async (params: GetCustomerParams = {}): Promise<CustomerResponse> => {
    const response = await apiClient.get<any>(CUSTOMERS_API_PREFIX, {
      params,
    });
    
    // Normalize response to ensure compatibility with backend casing
    const data = response.data || {};
    return {
      Items: data.Items || data.items || data.data || [],
      Page: data.Page ?? data.page ?? data.pageIndex ?? 1,
      PageSize: data.PageSize ?? data.pageSize ?? 10,
      TotalItems: data.TotalItems ?? data.totalItems ?? 0,
      TotalPages: data.TotalPages ?? data.totalPages ?? 0,
      HasNext: data.HasNext ?? data.hasNext ?? false,
      HasPrevious: data.HasPrevious ?? data.hasPrevious ?? false
    };
  },

  // Lấy chi tiết khách hàng theo email
  getCustomerByEmail: async (email: string): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`${CUSTOMERS_API_PREFIX}/${email}`);
    return response.data;
  },

  // Tạo mới khách hàng
  createCustomer: async (data: CreateCustomerRequest): Promise<Customer> => {
    const payload = {
      ...data,
      customerName: data.name
    };
    const response = await apiClient.post<Customer>(CUSTOMERS_API_PREFIX, payload);
    return response.data;
  },

  // Cập nhật khách hàng theo ID
  updateCustomer: async (id: number, data: UpdateCustomerRequest): Promise<Customer> => {
    const payload = {
      ...data,
      customerName: data.name
    };
    const response = await apiClient.put<Customer>(`${CUSTOMERS_API_PREFIX}/${id}`, payload);
    return response.data;
  },

  // Soft delete khách hàng (ẩn)
  softDeleteCustomer: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${CUSTOMERS_API_PREFIX}/${id}`);
    return response.data;
  },

  // Kích hoạt lại khách hàng bị xóa
  reactivateCustomer: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(`${CUSTOMERS_API_PREFIX}/${id}/reactivate`);
    return response.data;
  },
};
