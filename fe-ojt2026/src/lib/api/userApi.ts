import apiClient from '@/lib/axios';
import { User } from '@/types/user';

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
}

export interface UpdateUserRequest {
  fullname: string;
  phone: string;
}

interface EmployeeApiResponse {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  phone?: string;
  roleId: number;
  status: string;
  managerId?: number;
}

const API_PREFIX = '/api/v1/auth';

export const userApi = {
  // Update current user profile
  updateProfile: async (id: string, userData: UpdateUserRequest): Promise<{ message: string }> => {
    // API Route in Gateway: PUT /api/v1/auth/User/{id}
    const { data } = await apiClient.put<{ message: string }>(`${API_PREFIX}/User/${id}`, userData);
    return data;
  },

  // Change password - PUT /api/v1/auth/User/{id}/password
  changePassword: async (id: string, passwordData: ChangePasswordRequest): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>(`${API_PREFIX}/User/${id}/password`, passwordData);
    return data;
  },

  // Get employees for current manager
  getEmployees: async (): Promise<User[]> => {
    try {
      const { data } = await apiClient.get<EmployeeApiResponse[]>(`${API_PREFIX}/User/employees`);
      return (data || []).map(u => ({
        Id: u.id,
        Username: u.username,
        Email: u.email,
        Fullname: u.fullname || u.username,
        Phone: u.phone || '',
        RoleId: u.roleId,
        Status: u.status,
        ManagerId: u.managerId
      } as User));
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      return [];
    }
  },
};

export default userApi;
