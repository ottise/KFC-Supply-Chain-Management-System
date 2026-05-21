import apiClient from '@/lib/axios';
import type { Role, RoleOption } from '@/types/user';

const AUTH_API_PREFIX = '/api/v1/auth';

export const roleApi = {
  // Get all roles
  getRoles: async (): Promise<Role[]> => {
    try {
      const response = await apiClient.get(`${AUTH_API_PREFIX}/Role`);

      // Validate response
      if (!response.data) {
        return [];
      }

      // Check if data is an array
      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data;
    } catch (error: any) {
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  },

  // Get role by id
  getRole: async (id: number): Promise<Role> => {
    const { data } = await apiClient.get<Role>(
      `${AUTH_API_PREFIX}/Role/${id}`
    );
    return data;
  },

  // Create role (admin only)
  createRole: async (name: string): Promise<Role> => {
    const { data } = await apiClient.post<Role>(
      `${AUTH_API_PREFIX}/Role`,
      { Name: name }
    );
    return data;
  },

  // Update role (admin only)
  updateRole: async (id: number, name: string): Promise<Role> => {
    const { data } = await apiClient.put<Role>(
      `${AUTH_API_PREFIX}/Role/${id}`,
      { Name: name }
    );
    return data;
  },

  // Delete role (admin only)
  deleteRole: async (id: number): Promise<void> => {
    await apiClient.delete(`${AUTH_API_PREFIX}/Role/${id}`);
  },

  // Helper: Convert Role[] to RoleOption[]
  toRoleOptions: (roles: Role[]): RoleOption[] => {
    // Null check - prevent runtime errors
    if (!roles || !Array.isArray(roles)) {
      return [];
    }

    // Empty array check
    if (roles.length === 0) {
      return [];
    }

    const options = roles.map((role: any) => {
      // BACKEND RETURNS LOWERCASE PROPERTIES: id, name
      // Try multiple property name variations
      const id = role.Id || role.id || role.ID || 0;
      const name = role.Name || role.name || role.NAME || 'Unknown Role';

      // Safety check - use null/undefined check instead of falsy check
      if (id === null || id === undefined || name === null || name === undefined || name === '') {
        return { value: 0, label: 'Unknown Role' };
      }

      return {
        value: id,
        label: name,
      };
    });

    return options;
  },
};

export default roleApi;
