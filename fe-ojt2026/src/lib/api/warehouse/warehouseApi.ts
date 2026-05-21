import axios from "../../axios";
const API_PREFIX = "/api/v1/inventory";

// Types for warehouse, location, current warebhouse
export const warehouseApi = {
  // Existing getLocations call
  getLocations: async (
    params: { ManagerId?: string | number; NameId?: string | number },
    pageIndex = 1,
    pageSize = 100
  ) => {
    const queryParams: Record<string, string | number | undefined> = { page: pageIndex, pageSize };

    let targetId = params.ManagerId;
    if (!targetId || targetId === "null" || targetId === "undefined") {
      targetId = params.NameId;
    }

    if (targetId && targetId !== "null" && targetId !== "undefined") {
      queryParams.managerId = targetId;
    }

    const response = await axios.get(`${API_PREFIX}/Locations`, {
      params: queryParams
    });
    return response.data;
  },

  // Get all warehouses
  getWarehouses: async () => {
    const response = await axios.get(`${API_PREFIX}/Warehouses/all`);
    return response.data;
  },

  // Get warehouses for current user/manager (uses claims-based endpoint)
  getWarehousesForCurrentUser: async () => {
    const response = await axios.get(`${API_PREFIX}/Warehouses/all/warehouse/managerId`);
    return response.data;
  },

  // Get warehouse by ID
  getWarehouseById: async (id: number) => {
    const response = await axios.get(`${API_PREFIX}/Warehouses/${id}`);
    return response.data;
  },

  // Create warehouse
  createWarehouse: async (data: {
    Name: string;
    WarehouseCode: string;
    Address?: string;
    Phone?: string;
    Email?: string;
    ManagerId?: number;
    WarehouseType?: string;
    AreaSqm?: number;
    Notes?: string;
  }): Promise<{ message: string; warehouse: import("@/types/warehouse/warehouse").Warehouse }> => {
    const response = await axios.post(`${API_PREFIX}/Warehouses`, data);
    return response.data;
  },

  // Update warehouse
  updateWarehouse: async (
    id: number,
    data: {
      Name: string;
      WarehouseCode: string;
      Address?: string | null;
      Phone?: string | null;
      Email?: string | null;
      ManagerId?: number | null;
      WarehouseType?: string | null;
      AreaSqm?: number | null;
      Notes?: string | null;
      IsActive?: boolean;
    }
  ): Promise<{ message: string; warehouse: import("@/types/warehouse/warehouse").Warehouse }> => {
    const response = await axios.put(`${API_PREFIX}/Warehouses/${id}`, data);
    return response.data;
  },

  // Delete warehouse
  deleteWarehouse: async (id: number): Promise<{ message: string }> => {
    const response = await axios.delete(`${API_PREFIX}/Warehouses/${id}`);
    return response.data;
  },

  // Deactivate warehouse
  deactivateWarehouse: async (id: number): Promise<{ message: string }> => {
    const response = await axios.patch(`${API_PREFIX}/Warehouses/${id}/deactivate`);
    return response.data;
  },

  // Activate warehouse
  activateWarehouse: async (id: number): Promise<{ message: string }> => {
    const response = await axios.patch(`${API_PREFIX}/Warehouses/${id}/activate`);
    return response.data;
  },
};
