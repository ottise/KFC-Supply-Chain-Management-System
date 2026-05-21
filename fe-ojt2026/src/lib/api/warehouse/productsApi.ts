import apiClient from "../../axios";
import type {
  Product,
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
  CalculatePriceRequest,
  CalculatePriceResponse
} from "@/types/warehouse/masterData";

const PRODUCTS_API_PREFIX = "/api/v1/inventory/products";

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  categoryId?: number;
}

export const productsApi = {
  // Lấy danh sách sản phẩm (phân trang + filter)
  getProducts: async (params: GetProductsParams = {}): Promise<ProductResponse> => {
    const response = await apiClient.get<ProductResponse>(PRODUCTS_API_PREFIX, {
      params,
    });
    return response.data;
  },

  // Lấy sản phẩm theo location
  getProductsByLocation: async (locationId: number): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>(`${PRODUCTS_API_PREFIX}/location/${locationId}`);
    return response.data;
  },

  // Lấy chi tiết sản phẩm theo ID
  getProductById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`${PRODUCTS_API_PREFIX}/${id}`);
    return response.data;
  },

  // Lấy chi tiết sản phẩm theo mã (Code)
  getProductByCode: async (code: string): Promise<Product> => {
    const response = await apiClient.get<Product>(`${PRODUCTS_API_PREFIX}/code/${code}`);
    return response.data;
  },

  // Tạo mới sản phẩm
  createProduct: async (data: CreateProductRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(PRODUCTS_API_PREFIX, data);
    return response.data;
  },

  // Cập nhật sản phẩm
  updateProduct: async (id: number, data: UpdateProductRequest): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`${PRODUCTS_API_PREFIX}/${id}`, data);
    return response.data;
  },

  // Lưu trữ mềm sản phẩm (archive)
  softDeleteProduct: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${PRODUCTS_API_PREFIX}/${id}`);
    return response.data;
  },

  // Khôi phục sản phẩm đã lưu trữ
  restoreProduct: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`${PRODUCTS_API_PREFIX}/${id}/restore`);
    return response.data;
  },

  // Tính toán giá bán gợi ý dựa trên markup
  calculatePrice: async (data: CalculatePriceRequest): Promise<CalculatePriceResponse> => {
    const response = await apiClient.post<CalculatePriceResponse>(
      `${PRODUCTS_API_PREFIX}/calculate-price`,
      data
    );
    return response.data;
  },
};
