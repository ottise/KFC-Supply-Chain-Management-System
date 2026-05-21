"use client";
import React, { useState, useCallback, useEffect } from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import CreateAccountForm from '@/components/admin/CreateAccountForm';
import AccountDetailBox from '@/components/admin/AccountDetailBox';
import UserFilter from '@/components/admin/UserFilter';
import Pagination from '@/components/admin/Pagination';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useUsers } from '@/hooks/useUsers';
import { userApi } from '@/lib/api/admin/userApi';
import { useToast } from '@/components/ui/ToastProvider';
import type { User } from '@/types/user';
import { formatPhoneNumber } from '@/lib/utils';
import { useSidebarContext } from '@/lib/contexts/SidebarContext';

export default function AdminManageAccount() {
  const getRoleDisplay = (user: User): string => {
    // Backend sends role as string (e.g., "Manager", "Admin", "Staff")
    // Just return it directly
    if (typeof user.Role === 'string') {
      return user.Role;
    }

    // Fallback for object roles (if backend sends objects in future)
    if (user.Role && typeof user.Role === 'object') {
      const roleObject = user.Role as Partial<Record<'Name' | 'name' | 'NAME', string>>;
      const name = roleObject.Name || roleObject.name || roleObject.NAME || 'Unknown';
      return name;
    }

    return '-';
  };

  const getRoleDotClass = (roleName: string): string => {
    const lower = roleName.toLowerCase();
    if (lower.includes('admin') || lower.includes('quản trị')) return 'bg-purple-500 shadow-purple-200';
    if (lower.includes('manager') || lower.includes('quản lý')) return 'bg-blue-500 shadow-blue-200';
    if (lower.includes('staff') || lower.includes('nhân viên')) return 'bg-teal-500 shadow-teal-200';
    return 'bg-gray-400 shadow-gray-200';
  };

  const [showCreate, setShowCreate] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { isCollapsed } = useSidebarContext();
  const [isTogglingStatus, setIsTogglingStatus] = useState<number | null>(null);
  const toast = useToast();

  // Use useUsers hook for data fetching
  const {
    users,
    loading,
    error,
    pagination,
    searchTerm,
    roleFilter,
    statusFilter,
    activeEmailFilter,
    changePage,
    search,
    filterByRole,
    filterByStatus,
    filterByActiveEmail,
    clearFilters,
    refresh,
  } = useUsers(1, 10);

  const errorShownRef = React.useRef(false);

  useEffect(() => {
    if (error && !errorShownRef.current) {
      toast.error('Lỗi tải dữ liệu', error);
      errorShownRef.current = true;
    } else if (!error) {
      errorShownRef.current = false;
    }
  }, [error, toast]);

  const handleCreateAccount = () => {
    setShowCreate(true);
  };

  const handleAccountCreated = useCallback(async () => {
    setShowCreate(false);
    await refresh();
  }, [refresh]);

  const handleUserSelected = useCallback((user: User) => {
    setSelectedUser(user);
  }, []);

  const handleAccountClosed = useCallback(() => {
    setSelectedUser(null);
  }, []);

  const handleAccountUpdated = useCallback(async () => {
    setSelectedUser(null);
    await refresh();
  }, [refresh]);

  const handleToggleStatus = async (e: React.MouseEvent, userToToggle: User) => {
    e.stopPropagation();
    if (isTogglingStatus === userToToggle.Id) return;

    setIsTogglingStatus(userToToggle.Id);
    try {
      if (userToToggle.Status === 'Active') {
        await userApi.deleteUser(userToToggle.Id);
        toast.success('Thành Công', 'Đã khóa tài khoản thành công');
      } else {
        await userApi.reactivateUser(userToToggle.Id);
        toast.success('Thành Công', 'Đã kích hoạt tài khoản thành công');
      }
      await refresh();
    } catch {
      toast.error('Lỗi', 'Không thể đổi trạng thái tài khoản');
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const isLoading = loading;

  return (
    <>
      <AdminNavbar />
      <AdminSidebar
        activePage="account"
      />

      <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="w-full max-w-[1920px] mx-auto">


          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight font-sans">
                DANH SÁCH <span className="text-[#E4002B]">TÀI KHOẢN</span>
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                Quản lý các tài khoản người dùng
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <UserFilter
            onSearch={search}
            onRoleFilter={filterByRole}
            onStatusFilter={filterByStatus}
            onActiveEmailFilter={filterByActiveEmail}
            onClearFilters={clearFilters}
            searchValue={searchTerm}
            roleValue={roleFilter}
            statusValue={statusFilter}
            activeEmailValue={activeEmailFilter}
            onCreateAccount={handleCreateAccount}
          />

          <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-x-auto w-full">
            {isLoading ? (
              <TableSkeleton rows={5} />
            ) : users.length === 0 ? (
              <EmptyState
                type="accounts"
                action={{
                  label: '+ Tạo Tài Khoản',
                  onClick: handleCreateAccount
                }}
              />
            ) : (
              <>
                <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
                  <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[5%]">MÃ</th>
                      <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[25%]">NHÂN VIÊN</th>
                      <th className="px-4 md:px-6 py-5 hidden md:table-cell whitespace-nowrap w-[25%]">EMAIL</th>
                      <th className="px-4 md:px-6 py-5 hidden md:table-cell whitespace-nowrap w-[15%]">SỐ ĐIỆN THOẠI</th>
                      <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[10%]">VAI TRÒ</th>
                      <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[10%]">XÁC NHẬN</th>
                      <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[10%]">TRẠNG THÁI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr
                        key={user.Id}
                        onClick={() => handleUserSelected(user)}
                        className="hover:bg-red-50/50 transition-colors group [&_*]:cursor-pointer select-none cursor-pointer"
                      >
                        <td className="px-4 md:px-6 py-6">
                          <span className="font-bold text-gray-400 group-hover:text-[#E4002B]">#{user.Id}</span>
                        </td>
                        <td className="px-4 md:px-6 py-6">
                          <div className="flex items-center gap-1">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 text-sm">{user.Fullname}</span>
                              <span className="text-sm text-gray-500 md:hidden">{user.Email}</span>
                              <span className="text-[10px] text-gray-400">@{user.Username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-6 hidden md:table-cell">
                          <span className="font-semibold text-gray-500">{user.Email}</span>
                        </td>
                        <td className="px-4 md:px-6 py-6 hidden md:table-cell whitespace-nowrap">
                          <span className="font-semibold text-gray-500">{user.Phone ? formatPhoneNumber(user.Phone) : '-'}</span>
                        </td>
                        <td className="px-4 md:px-6 py-6 text-center">
                          <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full">
                            <span className={`w-2 h-2 rounded-full shadow-sm ${getRoleDotClass(getRoleDisplay(user))}`}></span>
                            <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                              {getRoleDisplay(user)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-6 text-center">
                          {user.IsActiveEmail === true ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full whitespace-nowrap">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Đã Xác Nhận
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full whitespace-nowrap">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1 8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Chưa Xác Nhận
                            </span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center items-center">
                            {user.IsActiveEmail ? (
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(e, user)}
                                disabled={isTogglingStatus === user.Id}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 shadow-inner transition-colors focus:outline-none ${user.Status === 'Active' ? 'bg-red-500' : 'bg-gray-300'} ${isTogglingStatus === user.Id ? 'opacity-50 cursor-wait' : ''}`}
                                title={user.Status === 'Active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                              >
                                <span className="sr-only">Toggle status</span>
                                <span
                                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-md ${user.Status === 'Active' ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm font-medium">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  pageSize={10}
                  onPageChange={changePage}
                />
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCreate && <CreateAccountForm onClose={() => setShowCreate(false)} onSuccess={handleAccountCreated} />}
      {selectedUser && (
        <AccountDetailBox
          user={selectedUser}
          onClose={handleAccountClosed}
          onSuccess={handleAccountUpdated}
        />
      )}
    </>
  );
}
