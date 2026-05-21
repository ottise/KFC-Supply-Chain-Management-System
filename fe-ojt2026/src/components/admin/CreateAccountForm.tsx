"use client";
import React, { useState, useCallback, useEffect } from 'react';
import { userApi } from '@/lib/api/admin/userApi';
import { roleApi } from '@/lib/api/admin/roleApi';
import { useToast } from '@/components/ui/ToastProvider';
import type { RoleOption } from '@/types/user';
import { formatPhoneNumber, validateEmail } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
}

// Function to generate random password
const generatePassword = (): string => {
  const length = 12;
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill rest
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

const CreateAccountForm: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    roleId: 0
  });
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);

      try {
        const rolesData = await roleApi.getRoles();
        const options = roleApi.toRoleOptions(rolesData);

        setRoleOptions(options);

        // Set default role if available
        if (rolesData && rolesData.length > 0 && rolesData[0]?.Id !== undefined) {
          setFormData(prev => ({ ...prev, roleId: rolesData[0].Id }));
        }
      } catch {
        toast.error('Lỗi', 'Không thể tải danh sách vai trò');
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegeneratePassword = useCallback(() => {
    setPassword(generatePassword());
    setIsCopied(false);
  }, []);

  const handleCopyPassword = useCallback(() => {
    navigator.clipboard.writeText(password);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Comprehensive Validation
    const newErrors: Record<string, string> = {};

    // Username validation
    if (!formData.username || formData.username.trim().length === 0) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
    } else if (!/^[a-zA-Z0-9_@.]+$/.test(formData.username)) {
      newErrors.username = 'Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch dưới, @ và chấm';
    }

    // Fullname validation
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = 'Vui lòng nhập họ và tên';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    // Email validation
    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ (ví dụ: abc@domain.com)';
    }

    // Phone validation
    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length === 0) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]+$/.test(cleanPhone)) {
      newErrors.phone = 'Số điện thoại chỉ chứa số';
    } else if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      newErrors.phone = 'Số điện thoại phải có từ 10-11 số';
    }

    // Role validation
    if (!formData.roleId || formData.roleId === 0) {
      newErrors.roleId = 'Vui lòng chọn vai trò';
    }

    setErrors(newErrors);

    // Stop if any errors
    if (Object.keys(newErrors).length > 0) {
      toast.error('Lỗi', 'Vui lòng điền đúng và đủ các thông tin bắt buộc');
      return;
    }

    setIsSubmitting(true);

    try {
      const createUserRequest = {
        Username: formData.username.trim(),
        Password: password,
        Email: formData.email.trim(),
        Fullname: formData.name.trim(),
        Phone: formData.phone.replace(/\s+/g, ''),
        RoleId: formData.roleId,
      };

      await userApi.createUser(createUserRequest);

      toast.success('Thành Công', 'Tài khoản người dùng đã được tạo thành công');

      if (onSuccess) {
        await onSuccess();
      } else {
        onClose();
      }
    } catch (error: unknown) {
      let errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

      if (error && typeof error === 'object' && 'response' in error) {
        const axErr = error as any;
        if (axErr.response?.data?.message) {
          errorMessage = axErr.response.data.message;
        } else if (axErr.response?.data?.title) {
          errorMessage = axErr.response.data.title;
        }
      }

      // Parse error message for better feedback
      let displayMessage = errorMessage;
      if (errorMessage.includes('already exists') || errorMessage.includes('đã tồn tại') || errorMessage.includes('Trùng')) {
        displayMessage = 'Tên đăng nhập hoặc email, sđt đã tồn tại trong hệ thống';
      } else if (errorMessage.includes('validation') || errorMessage.includes('Validation') || errorMessage.includes('lệ')) {
        displayMessage = 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại';
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        displayMessage = 'Lỗi kết nối mạng, vui lòng thử lại';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        displayMessage = 'Bạn không có quyền thực hiện thao tác này';
      }

      toast.error('Lỗi Tạo Tài Khoản', displayMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Main Container with KFC styling */}
      <div className="bg-white w-full max-w-4xl mx-auto rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">

        {/* Header - KFC Red theme */}
        <div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F] py-4 px-6 text-white text-center relative shrink-0">
          <h2 className="text-lg font-bold uppercase tracking-widest">Tạo Tài Khoản Mới</h2>
          <p className="text-xs text-white/70 mt-0.5">Thêm nhân viên mới vào hệ thống</p>
          <button
            onClick={onClose}
            type="button"
            className="absolute right-6 top-6 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body - 3-Column Layout */}
        <form className="p-6 space-y-4 overflow-y-auto flex-1 flex flex-col justify-between" onSubmit={handleSubmit}>

          <div className="space-y-4">
            {/* Row 1: Username + Full Name (Left) + Email + Phone (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Column: Username + Fullname */}
            <div className="space-y-3">
              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                  Tên Đăng Nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      if (errors.username) setErrors({ ...errors, username: '' });
                    }}
                    className={`w-full px-4 py-2.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm font-medium border ${errors.username ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-red-200'}`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {errors.username && <p className="text-red-500 text-[10px] ml-1 font-bold">{errors.username}</p>}
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                  Họ Và Tên
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên nhân viên"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-4 py-2.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm font-medium border ${errors.name ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-red-200'}`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-[10px] ml-1 font-bold">{errors.name}</p>}
              </div>
            </div>

            {/* Right Column: Email + Phone */}
            <div className="space-y-3">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                  Email Công Tác
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    placeholder="email@gmail.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`w-full px-4 py-2.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm font-medium border ${errors.email ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-red-200'}`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] ml-1 font-bold">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-2">
                  Số Điện Thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) });
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    className={`w-full px-4 py-2.5 pl-12 bg-gray-50 rounded-xl focus:ring-2 focus:ring-red-100 outline-none transition-all text-sm font-medium border ${errors.phone ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-red-200'}`}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-[10px] ml-1 font-bold">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Row 2: Role (Center/Full Width) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Vai Trò</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <select
                value={formData.roleId || ''}
                onChange={(e) => {
                  setFormData({ ...formData, roleId: Number(e.target.value) });
                  if (errors.roleId) setErrors({ ...errors, roleId: '' });
                }}
                className={`w-full px-4 py-2.5 pl-12 bg-gray-50 rounded-xl outline-none text-sm font-medium border appearance-none cursor-pointer ${errors.roleId ? 'border-red-400 bg-red-50' : 'border-transparent focus:border-red-200'}`}
                disabled={loadingRoles || isSubmitting}
                required
              >
                {loadingRoles ? (
                  <option value="">Đang tải...</option>
                ) : roleOptions.length === 0 ? (
                  <option value="">Không có vai trò</option>
                ) : (
                  <option value="">-- Chọn vai trò --</option>
                )}
                {roleOptions.map((option) => (
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
            {errors.roleId && <p className="text-red-500 text-[10px] ml-1 font-bold">{errors.roleId}</p>}
          </div>

          {/* Row 3: Auto-generated Password (Center/Full Width) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Mật Khẩu Tự Động Sinh</label>
            <div className="p-2.5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="w-full px-4 py-2 pl-12 bg-white rounded-xl text-sm font-mono font-bold text-gray-700 border border-gray-200 overflow-hidden">
                    {showPassword ? password : '••••••••'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    isCopied
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Đã Sao Chép
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Sao Chép
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tạo Mới
                </button>
              </div>
              <p className="text-[10px] text-gray-500 text-center">
                Mật khẩu sẽ được gửi đến email của nhân viên
              </p>
            </div>
          </div>

          </div>
          
          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex gap-3 mt-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingRoles || roleOptions.length === 0}
              className="flex-[2] py-3 bg-[#E4002B] text-white font-bold rounded-xl text-[10px] uppercase shadow-lg shadow-red-100 hover:bg-[#B8001F] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang Tạo...
                </>
              ) : (
                'Xác Nhận Tạo Tài Khoản'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccountForm;
