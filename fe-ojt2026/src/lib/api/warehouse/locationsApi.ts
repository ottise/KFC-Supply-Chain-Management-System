import apiClient from "../../axios";
import type { Location } from "@/types/warehouse/locations";

const LOCATIONS_API_PREFIX = "/api/v1/inventory/locations";

export interface GetLocationsParams {
  page?: number;
  pageSize?: number;
  warehouseId?: number;
  isActive?: boolean;
  search?: string;
  isParent?: boolean;
  parentId?: number;
  managerId?: number;
}

export interface PagedLocationResult {
  Items: Location[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
}

export const locationsApi = {
  // Lấy danh sách vị trí (phân trang + filter)
  getLocations: async (params: GetLocationsParams = {}): Promise<PagedLocationResult> => {
    try {
      const response = await apiClient.get<PagedLocationResult>(LOCATIONS_API_PREFIX, {
        params,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404 || axiosError.response?.status === 400) {
        return {
          Items: [],
          Page: 1,
          PageSize: params.pageSize || 10,
          TotalItems: 0,
          TotalPages: 0
        };
      }
      throw error;
    }
  },

  // Lấy tất cả vị trí (không phân trang)
  getAllLocations: async (): Promise<Location[]> => {
    const response = await apiClient.get<Location[]>(`${LOCATIONS_API_PREFIX}/all`);
    return response.data;
  },

  // Lấy chi tiết vị trí theo ID
  getLocationById: async (id: number): Promise<Location> => {
    const response = await apiClient.get<Location>(`${LOCATIONS_API_PREFIX}/${id}`);
    return response.data;
  },

  // Tạo mới vị trí
  createLocation: async (data: Partial<Location>): Promise<{ message: string; location: Location }> => {
    const response = await apiClient.post<{ message: string; location: Location }>(LOCATIONS_API_PREFIX, data);
    return response.data;
  },

  // Cập nhật vị trí
  updateLocation: async (id: number, data: Partial<Location>): Promise<{ message: string; location: Location }> => {
    const response = await apiClient.put<{ message: string; location: Location }>(`${LOCATIONS_API_PREFIX}/${id}`, data);
    return response.data;
  },

  // Vô hiệu hóa vị trí
  deactivateLocation: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`${LOCATIONS_API_PREFIX}/${id}/deactivate`);
    return response.data;
  },

  // Kích hoạt vị trí
  activateLocation: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>(`${LOCATIONS_API_PREFIX}/${id}/activate`);
    return response.data;
  },

  // Xóa vị trí
  deleteLocation: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`${LOCATIONS_API_PREFIX}/${id}`);
    return response.data;
  },
};
