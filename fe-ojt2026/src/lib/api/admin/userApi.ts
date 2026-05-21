import apiClient from '@/lib/axios';
import type {
  User,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserRoleRequest,
} from '@/types/user';

const AUTH_API_PREFIX = '/api/v1/auth';

export const userApi = {
  // Get paginated user list
  getUsers: async (
    page: number,
    pageSize: number,
    search?: string,
    roleId?: number,
    status?: string,
    isActiveEmail?: boolean,
    isUnassignedManager?: boolean
  ): Promise<UserListResponse> => {
    const { data } = await apiClient.get<UserListResponse>(
      `${AUTH_API_PREFIX}/User`,
      {
        params: {
          page,
          pageSize,
          search,
          roleId,
          status,
          isActiveEmail,
          isUnassignedManager,
          isActive: status === 'Active' ? true : status === 'Inactive' ? false : undefined,
          isDeleted: status === 'Inactive' ? true : undefined,
        },
      }
    );
    return data;
  },

  // Get user by id
  getUserById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<User>(
      `${AUTH_API_PREFIX}/User/${id}`
    );
    return data;
  },

  // Create new user (admin only)
  createUser: async (userData: CreateUserRequest): Promise<User> => {
    const { data } = await apiClient.post<User>(
      `${AUTH_API_PREFIX}/User`,
      userData
    );
    return data;
  },

  // Update user
  updateUser: async (id: number, userData: UpdateUserRequest): Promise<User> => {
    const { data } = await apiClient.put<User>(
      `${AUTH_API_PREFIX}/User/${id}`,
      userData
    );
    return data;
  },

  // Soft delete user (admin only)
  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`${AUTH_API_PREFIX}/User/${id}`);
  },

  // Reactivate user (admin only)
  reactivateUser: async (id: number): Promise<User> => {
    const { data } = await apiClient.post<User>(
      `${AUTH_API_PREFIX}/User/${id}/reactivate`
    );
    return data;
  },

  // Update user role (admin only)
  updateUserRole: async (id: number, roleId: number): Promise<{ message: string }> => {
    const { data } = await apiClient.put<{ message: string }>(
      `${AUTH_API_PREFIX}/User/${id}/user-role(admin)`,
      { RoleId: roleId }
    );
    return data;
  },

  // Assign a manager to a staff user
  assignManager: async (staffId: number, managerId: number): Promise<void> => {
    await apiClient.put(
      `${AUTH_API_PREFIX}/User/${staffId}/assign-manager/${managerId}`
    );
  },

  // Unassign manager from a staff user
  unassignManager: async (staffId: number): Promise<void> => {
    await apiClient.put(
      `${AUTH_API_PREFIX}/User/${staffId}/unassign-manager`
    );
  },

  // Get employees/staff (either for all or filtered by user context)
  getEmployees: async (): Promise<User[]> => {
    // Depending on backend, this might return a User array or a paginated response.
    // Assuming array of Users based on standard non-paginated endpoints, 
    // but if it's paginated, adjusting may be necessary later.
    const { data } = await apiClient.get<User[]>(
      `${AUTH_API_PREFIX}/User/employees`
    );
    return data;
  },
};

export default userApi;
