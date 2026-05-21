// User entity from backend
export interface User {
  Id: number;
  Username: string;
  Email: string;
  Fullname: string;
  Phone: string;
  RoleId: number;
  Status: UserStatus;
  ManagerId?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  IsActiveEmail?: boolean;
  Role?: Role | string;  // Accept both object (from future backend) and string (from current backend)
  RoleName?: string;
}

// Role entity
export interface Role {
  Id: number;
  Name: string;
}

// User list response with pagination (matches backend PagedResultDto<T>)
export interface UserListResponse {
  items: User[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Create user request
export interface CreateUserRequest {
  Username: string;
  Password: string;
  Email: string;
  Fullname: string;
  Phone: string;
  RoleId: number;
}

// Update user request
export interface UpdateUserRequest {
  Fullname: string;
  Phone: string;
  // Email?: string;
}

// Update user role request
export interface UpdateUserRoleRequest {
  RoleId: number;
}

// User status enum
export type UserStatus = 'Active' | 'Inactive';

// Extended user roles for admin
export type AdminUserRole =
  | 'Staff'
  | 'Manager'
  | 'Admin';

// Role options for dropdown
export interface RoleOption {
  value: number;
  label: string;
}

// Helper to get status display text
export const getUserStatusText = (status: UserStatus): string => {
  const statusMap: Record<UserStatus, string> = {
    Active: 'Hoạt Động',
    Inactive: 'Không Hoạt Động',
  };
  return statusMap[status] || status;
};

// Helper to get status color class
export const getUserStatusColorClass = (status: UserStatus): string => {
  const colorMap: Record<UserStatus, string> = {
    Active: 'bg-green-100 text-green-700 border border-green-200',
    Inactive: 'bg-gray-100 text-gray-500 border border-gray-200',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-500 border border-gray-200';
};
