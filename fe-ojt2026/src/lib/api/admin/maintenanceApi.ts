/* eslint-disable @typescript-eslint/no-explicit-any */
import apiClient from '@/lib/axios';
import type {
  MaintenanceResponse,
  CreateMaintenanceRequest,
  UpdateMaintenanceRequest,
  PagedMaintenanceResponse,
  MaintenanceStatusResponse,
} from '@/types/maintenance';

const MAINTENANCE_API_PREFIX = '/api/v1/system/maintenance';

export const maintenanceApi = {
  // Get current maintenance status (AllowAnonymous)
  getMaintenanceStatus: async (): Promise<MaintenanceStatusResponse> => {
    try {
      const { data } = await apiClient.get<MaintenanceStatusResponse>(
        `${MAINTENANCE_API_PREFIX}/status`
      );
      return data;
    } catch (error: unknown) {
      const axiosError = error as any;
      console.error('[maintenanceApi] getMaintenanceStatus error detail:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      return { isActive: false };
    }
  },

  // Get upcoming scheduled maintenance (AllowAnonymous)
  getUpcomingMaintenance: async (limit: number = 5): Promise<MaintenanceResponse[]> => {
    try {
      const { data } = await apiClient.get<MaintenanceResponse[]>(
        `${MAINTENANCE_API_PREFIX}/upcoming`,
        { params: { limit } }
      );
      return data;
    } catch (error: unknown) {
      const axiosError = error as any;
      console.error('[maintenanceApi] getUpcomingMaintenance error detail:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      return [];
    }
  },

  // Get all maintenance tickets (paginated, Admin only)
  getMaintenanceList: async (
    page: number = 1,
    pageSize: number = 10,
    keyword?: string,
    status?: string
  ): Promise<PagedMaintenanceResponse> => {
    try {
      const { data } = await apiClient.get<PagedMaintenanceResponse>(
        `${MAINTENANCE_API_PREFIX}`,
        {
          params: { page, pageSize, keyword, status },
        }
      );
      return data;
    } catch (error: unknown) {
      console.error('[maintenanceApi] getMaintenanceList error:', error);
      return { items: [], totalCount: 0, page, pageSize };
    }
  },

  // Get maintenance ticket by ID (Admin only)
  getMaintenanceById: async (id: string): Promise<MaintenanceResponse> => {
    const { data } = await apiClient.get<MaintenanceResponse>(
      `${MAINTENANCE_API_PREFIX}/${id}`
    );
    return data;
  },

  // Create new maintenance ticket (Admin only)
  createMaintenance: async (
    request: CreateMaintenanceRequest
  ): Promise<MaintenanceResponse> => {
    const { data } = await apiClient.post<MaintenanceResponse>(
      `${MAINTENANCE_API_PREFIX}`,
      {
        reason: request.reason,
        startTime: request.startTime,
        endTime: request.endTime,
      }
    );
    return data;
  },

  // Update maintenance ticket (Admin only)
  updateMaintenance: async (
    id: string,
    request: UpdateMaintenanceRequest
  ): Promise<void> => {
    await apiClient.put(`${MAINTENANCE_API_PREFIX}/${id}`, {
      reason: request.reason,
      startTime: request.startTime,
      endTime: request.endTime,
      status: request.status,
    });
  },

  // Cancel/delete maintenance ticket (Admin only)
  cancelMaintenance: async (id: string): Promise<void> => {
    await apiClient.delete(`${MAINTENANCE_API_PREFIX}/${id}`);
  },

  // Stop ongoing maintenance immediately (Admin only)
  stopMaintenanceNow: async (): Promise<MaintenanceResponse> => {
    const { data } = await apiClient.post<MaintenanceResponse>(
      `${MAINTENANCE_API_PREFIX}/stop-now`
    );
    return data;
  },

  // Start maintenance immediately (Admin only)
  startMaintenanceNow: async (endTime: string, reason: string): Promise<MaintenanceResponse> => {
    const { data } = await apiClient.post<MaintenanceResponse>(
      `${MAINTENANCE_API_PREFIX}/start-now`,
      {
        endTime,
        reason,
      }
    );
    return data;
  },

  // Activate a scheduled maintenance ticket (Admin only)
  activateMaintenance: async (id: string): Promise<MaintenanceResponse> => {
    const { data } = await apiClient.post<MaintenanceResponse>(
      `${MAINTENANCE_API_PREFIX}/${id}/activate`
    );
    return data;
  },
};

export default maintenanceApi;
