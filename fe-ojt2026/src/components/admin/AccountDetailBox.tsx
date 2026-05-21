"use client";
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { userApi } from '@/lib/api/admin/userApi';
import { roleApi } from '@/lib/api/admin/roleApi';
import { useToast } from '@/components/ui/ToastProvider';
import type { User, RoleOption, UserStatus } from '@/types/user';
import { getUserStatusText } from '@/types/user';
import { formatPhoneNumber } from '@/lib/utils';


interface Props {
  user: User;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

// Form data interface
interface FormData {
  fullname: string;
  email: string;
  phone: string;
  roleId: number | undefined;
  status: UserStatus;
}

const normalizeRoleKey = (role: string): string =>
  role
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const getCanonicalRoleKey = (role: string): string => {
  const normalized = normalizeRoleKey(role);
  const aliases: Record<string, string> = {
    admin: 'administrator',
    administrator: 'administrator',
    manager: 'manager',
    staff: 'staff',
  };

  return aliases[normalized] ?? normalized;
};

const AccountDetailBox: React.FC<Props> = ({ user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    fullname: user.Fullname,
    email: user.Email,
    phone: user.Phone,
    roleId: user.RoleId,
    status: user.Status
  });
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const rolesData = await roleApi.getRoles();
        const options = roleApi.toRoleOptions(rolesData);
        setRoleOptions(options);
      } catch {
        toast.error('Lỗi', 'Không thể tải danh sách vai trò');
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, [toast]);

  // Update formData when user prop changes
  useEffect(() => {
    let mappedRoleId = user.RoleId;
    if (!mappedRoleId && user.Role && typeof user.Role === 'string' && roleOptions.length > 0) {
      const targetRoleKey = getCanonicalRoleKey(user.Role);

      const matchedRole = roleOptions.find(opt => getCanonicalRoleKey(opt.label) === targetRoleKey);

      if (matchedRole) {
        mappedRoleId = matchedRole.value;
      }
    }

    const newFormData = {
      fullname: user.Fullname,
      email: user.Email,
      phone: formatPhoneNumber(user.Phone),
      roleId: mappedRoleId,
      status: user.Status
    };

    setFormData(newFormData);
  }, [user, roleOptions]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) return;

    // Validation
    if (!formData.fullname || formData.fullname.trim().length === 0) {
      toast.error('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length === 0) {
      toast.error('Lỗi', 'Vui lòng nhập số điện thoại');
      return;
    } else if (!/^[0-9]+$/.test(cleanPhone)) {
      toast.error('Lỗi', 'Số điện thoại chỉ chứa số');
      return;
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error('Lỗi', 'Số điện thoại phải có từ 10-11 số');
      return;
    }

    setIsSaving(true);

    try {
      // Check if role changed
      const roleChanged = formData.roleId !== user.RoleId;

      // Update user info
      const updateRequest = {
        Fullname: formData.fullname.trim(),
        Phone: cleanPhone,
      };

      await userApi.updateUser(user.Id, updateRequest);

      // Update role if it changed
      if (roleChanged && formData.roleId) {
        await userApi.updateUserRole(user.Id, formData.roleId);
      }

      // Build success message based on what changed
      const changes = [];
      if (roleChanged) changes.push('vai trò');

      const successMessage = changes.length > 0
        ? `${changes.join(', ')} đã được cập nhật`
        : 'Thông tin đã được cập nhật';

      toast.success('Thành Công', successMessage);

      if (onSuccess) {
        await onSuccess();
      } else {
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

      // Parse error message for better feedback
      let displayMessage = errorMessage;
      if (errorMessage.includes('validation') || errorMessage.includes('Validation')) {
        displayMessage = 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        displayMessage = 'Lỗi kết nối mạng, vui lòng thử lại';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        displayMessage = 'Bạn không có quyền thực hiện thao tác này';
      }

      toast.error('Lỗi', displayMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = (newRoleId: number) => {
    if (newRoleId === formData.roleId) return;
    setFormData({ ...formData, roleId: newRoleId });
  };

  const isActive = formData.status === 'Active';

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white w-full max-w-2xl mx-auto rounded-[40px] shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col">

        {/* Header - KFC Red gradient with Name and ID */}
        <div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F] p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold border-2 border-white/30 uppercase">
              {formData.fullname.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Chỉnh Sửa Tài Khoản</h2>
              <p className="text-xs text-white/70 font-medium mt-0.5">
                Mã Nhân Viên: #{user.Id} | {user.Username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-2xl border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <form className="p-6 space-y-4 overflow-y-auto flex-1" onSubmit={handleSave}>
          {/* Username - Read only */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tên Đăng Nhập</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={user.Username}
                disabled
                className="w-full px-4 py-3 pl-12 bg-gray-100 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Name Field - Editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Họ Và Tên</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                value={formData.fullname}
                onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                placeholder="Nhập họ và tên"
                className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Phone Field - Editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Số Điện Thoại</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                placeholder="Nhập số điện thoại"
                className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:ring-2 focus:ring-red-50 outline-none transition-all"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Email Field - Read only (backend doesn't allow email update) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Công Tác</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 pl-12 pr-32 bg-gray-100 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed"
              />
              {/* Email Verification Status Badge */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {user.IsActiveEmail === true ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Đã Xác Nhận
                  </span>
                ) : user.IsActiveEmail === false ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider rounded-full">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1 8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Chưa Xác Nhận
                  </span>
                ) : (
                  <span className="text-gray-400 text-[10px]">—</span>
                )}
              </div>
            </div>
          </div>

          {/* Role Dropdown - Editable */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vai Trò</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016" />
                </svg>
              </div>
              <select
                value={formData.roleId ?? ''}
                onChange={(e) => {
                  handleRoleChange(Number(e.target.value));
                }}
                className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-xl text-sm font-semibold text-[#E4002B] outline-none cursor-pointer appearance-none focus:ring-2 focus:ring-red-50 transition-all"
                disabled={loadingRoles || isSaving}
              >
                {loadingRoles ? (
                  <option value="" disabled>Đang tải...</option>
                ) : roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-2xl border border-white/10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-[2] py-3.5 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-lg shadow-red-200 hover:bg-[#B8001F] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang Lưu...
                </>
              ) : (
                'Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountDetailBox;
