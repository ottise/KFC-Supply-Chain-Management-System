import { useState, useCallback } from 'react';
import { userApi } from '@/lib/api/admin/userApi';
import { roleApi } from '@/lib/api/admin/roleApi';
import type { User } from '@/types/user';
import { useToast } from '@/components/ui/ToastProvider';

const normalizeUser = (user: any): User => ({
  ...user,
  Id: user.Id || user.id || user.ID,
  Username: user.Username || user.username || user.USERNAME,
  Email: user.Email || user.email || user.EMAIL,
  Fullname: user.Fullname || user.fullname || user.FULLNAME || user.Name || user.name || 'Unknown User',
  Phone: user.Phone || user.phone || user.PHONE,
  RoleId: user.RoleId || user.roleId,
  Status: user.Status || user.status || user.STATUS,
  ManagerId: user.ManagerId || user.managerId,
  RoleName: user.Role || user.role || user.ROLE,
  IsActiveEmail: user.IsActiveEmail !== undefined ? user.IsActiveEmail : user.isActiveEmail !== undefined ? user.isActiveEmail : false,
});

export function useStaffAssignment() {
  const [managers, setManagers] = useState<User[]>([]);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [staffList, setStaffList] = useState<User[]>([]);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [unassignedStaff, setUnassignedStaff] = useState<User[]>([]);
  const [managerStaffCounts, setManagerStaffCounts] = useState<Record<number, number>>({});
  const [loadingStaffCounts, setLoadingStaffCounts] = useState(true);
  
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const toast = useToast();

  const handleApiError = (error: unknown, defaultMessage: string) => {
    console.error(defaultMessage, error);
    const errorMessage = error instanceof Error ? error.message : 'Lỗi hệ thống';
    toast.error('Lỗi', errorMessage);
  };

  // Helper to fetch all users via pagination to bypass 100 items/page limit
  const fetchAllSystemUsers = async () => {
    let page = 1;
    let fetchedUsers: any[] = [];
    while (true) {
      const response = await userApi.getUsers(page, 100);
      fetchedUsers = [...fetchedUsers, ...(response.items || [])];
      if (!response.hasNext) break;
      page++;
    }
    return fetchedUsers;
  };

  // Pre-calculate counts of staff per manager continuously to detect lonely managers
  const fetchAllStaffCounts = useCallback(async () => {
    try {
      setLoadingStaffCounts(true);
      const allUsers = (await fetchAllSystemUsers()).map(normalizeUser);
      
      const counts: Record<number, number> = {};
      allUsers.forEach(u => {
        if (u.ManagerId) {
          counts[u.ManagerId] = (counts[u.ManagerId] || 0) + 1;
        }
      });
      setManagerStaffCounts(counts);
    } catch (error) {
      console.error('Could not fetch staff counts:', error);
    } finally {
      setLoadingStaffCounts(false);
    }
  }, []);

  const fetchManagers = useCallback(async () => {
    setLoadingManagers(true);
    try {
      // Get role ID for "Manager"
      const roles = await roleApi.getRoles();
      const managerRole = roles.find((r: any) => r.Name?.toLowerCase() === 'manager' || r.name?.toLowerCase() === 'manager' || r.Name?.toLowerCase() === 'quản lý');
      
      if (managerRole) {
        // Fetch users with Manager role (omitting 'Active' to prevent potential 500 errors from backend filter parsing)
        const response = await userApi.getUsers(1, 100, undefined, (managerRole as any).Id || (managerRole as any).id);
        setManagers((response.items || []).map(normalizeUser));
      } else {
        // Fallback: just fetch all and filter client side if role not found
        const response = await userApi.getUsers(1, 100);
        setManagers((response.items || []).map(normalizeUser).filter((u: any) => 
          typeof u.Role === 'string' ? u.Role.toLowerCase().includes('manager') : false
        ));
      }
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách Quản lý');
    } finally {
      setLoadingManagers(false);
    }
  }, [toast]);

  const fetchStaffByManager = useCallback(async (managerId: number) => {
    setLoadingStaff(true);
    setStaffList([]);
    try {
      const roles = await roleApi.getRoles();
      const staffRole = roles.find((r: any) => r.Name?.toLowerCase() === 'staff' || r.name?.toLowerCase() === 'staff' || r.Name?.toLowerCase() === 'nhân viên');
      
      const response = await userApi.getUsers(1, 100, undefined, (staffRole as any)?.Id || (staffRole as any)?.id);
      
      // Filter by ManagerId - assuming User type has ManagerId
      const allStaff = (response.items || []).map(normalizeUser);
      const assigned = allStaff.filter(u => u.ManagerId === managerId);
      setStaffList(assigned);
      
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách Nhân viên');
    } finally {
      setLoadingStaff(false);
    }
  }, [toast]);

  const fetchUnassignedStaff = useCallback(async () => {
    setLoadingUnassigned(true);
    try {
      // Fetch all users and filter locally to bypass strict role ID lookups 
      // (in case role name changes or 'staffRole' match fails).
      // (in case role name changes or 'staffRole' match fails).
      const allUsers = (await fetchAllSystemUsers()).map(normalizeUser);
      
      const unassigned = allUsers.filter(u => 
        !u.ManagerId && 
        u.RoleName && 
        (u.RoleName.toLowerCase().includes('staff') || u.RoleName.toLowerCase().includes('nhân viên'))
      );
      setUnassignedStaff(unassigned);
    } catch (error) {
      handleApiError(error, 'Không thể tải danh sách Nhân viên chưa phân bổ');
    } finally {
      setLoadingUnassigned(false);
    }
  }, [toast]);

  const assignStaffToManager = async (staffIds: number[], managerId: number) => {
    setIsAssigning(true);
    try {
      // Loop through and assign each (or if backend supports bulk, use bulk)
      const promises = staffIds.map(staffId => userApi.assignManager(staffId, managerId));
      await Promise.all(promises);
      
      toast.success('Thành Công', `Đã phân công ${staffIds.length} nhân viên thành công`);
      
      // Refresh lists
      await fetchStaffByManager(managerId);
      await fetchUnassignedStaff();
      await fetchAllStaffCounts();
      return true;
    } catch (error) {
      handleApiError(error, 'Lỗi khi phân công nhân viên');
      return false;
    } finally {
      setIsAssigning(false);
    }
  };

  const unassignStaff = async (staffId: number, currentManagerId?: number) => {
    try {
      await userApi.unassignManager(staffId);
      toast.success('Thành Công', 'Đã xóa nhân viên khỏi sự quản lý');
      
      // Refresh lists
      if (currentManagerId) {
        await fetchStaffByManager(currentManagerId);
      }
      await fetchUnassignedStaff();
      await fetchAllStaffCounts();
      return true;
    } catch (error) {
      handleApiError(error, 'Lỗi khi gỡ phân công nhân viên');
      return false;
    }
  };

  const bulkUnassignStaff = async (staffIds: number[], currentManagerId?: number) => {
    try {
      const promises = staffIds.map(id => userApi.unassignManager(id));
      await Promise.all(promises);
      toast.success('Thành Công', `Đã xóa ${staffIds.length} nhân viên khỏi sự quản lý`);
      
      if (currentManagerId) {
        await fetchStaffByManager(currentManagerId);
      }
      await fetchUnassignedStaff();
      await fetchAllStaffCounts();
      return true;
    } catch (error) {
      handleApiError(error, 'Lỗi khi gỡ phân công nhiều nhân viên');
      return false;
    }
  };

  // Filtered lists for the UI
  const filteredManagers = managers.filter(m => 
    m.Fullname.toLowerCase().includes(managerSearchQuery.toLowerCase()) || 
    m.Email.toLowerCase().includes(managerSearchQuery.toLowerCase())
  );

  const filteredStaffList = staffList.filter(s => 
    s.Fullname.toLowerCase().includes(staffSearchQuery.toLowerCase()) || 
    s.Email.toLowerCase().includes(staffSearchQuery.toLowerCase())
  );

  return {
    managers: filteredManagers,
    staffList: filteredStaffList,
    managerSearchQuery,
    setManagerSearchQuery,
    staffSearchQuery,
    setStaffSearchQuery,
    managerStaffCounts,
    unassignedStaff,
    loadingManagers,
    loadingStaff,
    loadingUnassigned,
    isAssigning,
    fetchManagers,
    fetchStaffByManager,
    fetchUnassignedStaff,
    fetchAllStaffCounts,
    assignStaffToManager,
    unassignStaff,
    bulkUnassignStaff,
    loadingStaffCounts,
  };
}
