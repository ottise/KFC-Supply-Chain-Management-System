import { useState, useCallback, useEffect } from 'react';
import { userApi } from '@/lib/api/admin/userApi';
import { roleApi } from '@/lib/api/admin/roleApi';
import type { User, UserListResponse } from '@/types/user';
import { useToast } from '@/components/ui/ToastProvider';

export interface DashboardStats {
  totalAccounts: number;
  verifiedUsers: number;
  unassignedUsers: number;
  unverifiedUsers: number;
  disabledUsers: number;
}

const extractTotal = (data: UserListResponse): number => {
  return (data as any).totalItems ?? (data as any).TotalItems ??
         (data as any).totalCount ?? (data as any).TotalCount ?? 
         ((data.items && data.items.length) || 0);
};

const normalizeUser = (user: any): User => ({
  ...user,
  Id: user.Id || user.id || user.ID,
  Username: user.Username || user.username || user.USERNAME,
  Email: user.Email || user.email || user.EMAIL,
  Fullname: user.Fullname || user.fullname || user.FULLNAME || user.Name || user.name || 'Unknown User',
  Phone: user.Phone || user.phone || user.PHONE,
  RoleId: user.RoleId || user.roleId,
  Status: user.Status || user.status || user.STATUS,
  CreatedAt: user.CreatedAt || user.createdAt || user.CreatedDate || user.createdDate || user.CreationDate || user.creationDate || user.created_at || null,
  Role: user.Role || user.role,
});

export function useAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAccounts: 0,
    verifiedUsers: 0,
    unassignedUsers: 0,
    unverifiedUsers: 0,
    disabledUsers: 0
  });
  
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch available Roles to get ID for Staff
      const roles = await roleApi.getRoles();
      const staffRole = roles.find((r: any) => r.Name?.toLowerCase() === 'staff' || r.name?.toLowerCase() === 'staff' || r.Name?.toLowerCase() === 'nhân viên');
      const staffRoleId = staffRole ? ((staffRole as any).Id || (staffRole as any).id) : undefined;

      // 2. Fetch Aggregated Statistics in Parallel focusing on Lifecycle & Assignments
      const [
        totalRes,
        verifiedRes,
        staffRes,
        unverifiedRes,
        inactiveRes
      ] = await Promise.all([
        userApi.getUsers(1, 1),
        userApi.getUsers(1, 1, undefined, undefined, 'Active', true), // Verified & Active
        userApi.getUsers(1, 100, undefined, staffRoleId), // Prevent BE 500 error by omitting 'Active' status and using standard pageSize
        userApi.getUsers(1, 1, undefined, undefined, undefined, false), // Unverified
        userApi.getUsers(1, 1, undefined, undefined, 'Inactive') // Disabled
      ]);

      const totalAccounts = extractTotal(totalRes);
      
      // Client-side filter to avoid needing backend updates
      const unassignedCount = (staffRes.items || []).filter((u: any) => !u.ManagerId && !u.managerId).length;

      setStats({
        totalAccounts,
        verifiedUsers: extractTotal(verifiedRes),
        unassignedUsers: unassignedCount,
        unverifiedUsers: extractTotal(unverifiedRes),
        disabledUsers: extractTotal(inactiveRes)
      });

      // 3. Fetch the newest 5 users
      // Since default sort is oldest-first, the newest are on the last page.
      const pageSize = 5;
      const lastPage = Math.max(1, Math.ceil(totalAccounts / pageSize));
      const recentRes = await userApi.getUsers(lastPage, pageSize);

      let rawItems = (recentRes as any).items || (recentRes as any).Items || (recentRes as any).data || [];
      
      // If the last page has fewer than 5 items, we need to fetch the previous page to fill exactly 5 slots.
      if (rawItems.length < pageSize && lastPage > 1) {
        const prevRes = await userApi.getUsers(lastPage - 1, pageSize);
        const prevItems = (prevRes as any).items || (prevRes as any).Items || (prevRes as any).data || [];
        const needed = pageSize - rawItems.length;
        rawItems = [...prevItems.slice(-needed), ...rawItems];
      }

      // Normalize recent users so property casings don't break UI
      const normalizedUsers = rawItems.map(normalizeUser);
      
      // Reverse so the absolute newest is at index 0
      setRecentUsers(normalizedUsers.reverse());

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Lỗi', 'Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats,
    recentUsers,
    isLoading,
    refresh: fetchDashboardData
  };
}
