"use client";
import Link from 'next/dist/client/link';
import React, { useState, useCallback } from 'react';
import { formatPhoneNumber } from '@/lib/utils';
import { userApi } from '@/lib/api/userApi';
import { useToast } from '@/components/ui/ToastProvider';

interface WarehouseManagerProfile {
    fullName: string;
    phoneNumber: string;
    email: string;
    role: string;
}

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
}

interface ChangePasswordPayload {
    CurrentPassword: string;
    NewPassword: string;
}

interface Props {
    initialData?: Partial<WarehouseManagerProfile>;
    onSubmit: (data: WarehouseManagerProfile) => void;
    isLoading?: boolean;
    userId?: string;
}

const roleOptions = [
    { value: 'Warehouse Manager', label: 'Quản Lý Kho' },
    { value: 'Warehouse Staff', label: 'Nhân Viên Kho' },
];


const WarehouseManagerProfileForm: React.FC<Props> = ({
    initialData,
    onSubmit,
    isLoading = false,
    userId
}) => {
    const toast = useToast();
    const [formData, setFormData] = useState<WarehouseManagerProfile>({
        fullName: initialData?.fullName || '',
        phoneNumber: initialData?.phoneNumber || '',
        email: initialData?.email || '',
        role: initialData?.role || 'Warehouse Manager',
    });

    const [passwordForm, setPasswordForm] = useState<PasswordForm>({
        currentPassword: '',
        newPassword: '',
    });
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Cập nhật formData khi initialData từ parent thay đổi (để đồng bộ sau khi update thành công)
    React.useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                fullName: initialData.fullName || prev.fullName,
                phoneNumber: initialData.phoneNumber || prev.phoneNumber,
                email: initialData.email || prev.email,
                role: initialData.role || prev.role,
            }));
        }
    }, [initialData]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'fullName') {
            // Không cho phép nhập chữ số
            if (/\d/.test(value)) {
                return;
            }
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
            return;
        }

        if (name === 'phoneNumber') {
            // Chỉ giữ lại các chữ số
            const digitsOnly = value.replace(/\D/g, '');
            // Giới hạn tối đa 10 chữ số
            if (digitsOnly.length > 10) {
                return;
            }
            setFormData(prev => ({
                ...prev,
                [name]: formatPhoneNumber(value)
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSubmit(formData);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch (error) {
            // Error handling is managed by the parent component (alert)
            console.error('Form submission failed:', error);
        }
    };

    const validatePasswordForm = (): boolean => {
        if (!passwordForm.currentPassword) {
            return false;
        }
        if (!passwordForm.newPassword) {
            return false;
        }
        if (!confirmPassword) {
            return false;
        }
        return true;
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== confirmPassword) {
            return;
        }

        if (!userId) {
            console.error('User ID not available');
            return;
        }

        const payload: ChangePasswordPayload = {
            CurrentPassword: passwordForm.currentPassword,
            NewPassword: passwordForm.newPassword,
        };

        setIsChangingPassword(true);
        try {
            await userApi.changePassword(userId, payload);
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
            });
            setConfirmPassword('');
            setPasswordSuccess(true);
            toast.success('Thành công', 'Mật khẩu đã được cập nhật.');
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error) {
            console.error('Error changing password:', error);
            const axiosError = error as { response?: { status?: number; data?: { message?: string; errors?: unknown } } };
            const errorMessage = axiosError?.response?.data?.message;
            if (axiosError?.response?.status === 401) {
                toast.error('Lỗi', 'Mật khẩu hiện tại không đúng.');
            } else if (axiosError?.response?.status === 422) {
                toast.error('Lỗi xác thực', 'Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
            } else if (axiosError?.response?.status === 400) {
                toast.error('Lỗi', errorMessage || 'Mật khẩu mới không đáp ứng yêu cầu.');
            } else {
                toast.error('Lỗi', 'Có lỗi xảy ra khi đổi mật khẩu. Vui lòng thử lại.');
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const fullName = formData.fullName;

    return (
        <div className="space-y-8">
            {/* Success Message */}
            {showSuccessMessage && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl text-green-700 text-sm font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    ✓ Cập nhật thông tin thành công!
                </div>
            )}

            {/* Avatar Section */}
            <div className="bg-gradient-to-br from-[#E4002B] via-[#D90026] to-[#C0001F] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-xl">
                        <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black">{fullName || 'Tên của bạn'}</h2>
                        <p className="text-white/80 text-sm font-semibold">{roleOptions.find(r => r.value === formData.role)?.label}</p>
                        <p className="text-white/70 text-xs mt-1">Hệ thống KFC Vietnam</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wide transition-all ${
                            activeTab === 'profile'
                                ? 'text-[#E4002B] border-b-2 border-[#E4002B] bg-red-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Cập nhật tài khoản
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('password')}
                        className={`flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wide transition-all ${
                            activeTab === 'password'
                                ? 'text-[#E4002B] border-b-2 border-[#E4002B] bg-red-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Đổi mật khẩu
                        </div>
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeTab === 'profile' ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Success Message */}
                            {showSuccessMessage && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl text-green-700 text-sm font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    ✓ Cập nhật thông tin thành công!
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Full Name */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Họ và tên *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        placeholder="Nhập họ và tên"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 mt-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#E4002B] focus:bg-white outline-none transition-all text-sm border border-gray-200 focus:border-[#E4002B]"
                                        required
                                    />
                                </div>

                                {/* Email (Read-only) */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Địa chỉ email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full px-4 py-3 mt-2 bg-gray-100 rounded-xl outline-none transition-all text-sm border border-gray-200 text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Số điện thoại *</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        placeholder="0912 345 678"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 mt-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#E4002B] focus:bg-white outline-none transition-all text-sm border border-gray-200 focus:border-[#E4002B]"
                                        required
                                    />
                                </div>

                                {/* Role (Read-only) */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Vai trò *</label>
                                    <input
                                        type="text"
                                        name="role"
                                        value={roleOptions.find(opt => opt.value === formData.role)?.label || formData.role}
                                        disabled
                                        className="w-full px-4 py-3 mt-2 bg-gray-100 rounded-xl outline-none transition-all text-sm border border-gray-200 text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Link href="/warehouse_manager" passHref>
                                    <button
                                        type="button"
                                        className="px-8 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold uppercase tracking-wide transition-all transform hover:scale-105"
                                    >
                                        Hủy
                                    </button>
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-[#E4002B] to-[#B8001F] text-white rounded-xl font-bold uppercase tracking-wide hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isLoading ? 'Đang cập nhật...' : 'Cập nhật tài khoản'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            {/* Password Success Message */}
                            {passwordSuccess && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-xl text-green-700 text-sm font-semibold flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    ✓ Đổi mật khẩu thành công!
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Current Password */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Mật khẩu hiện tại *</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        placeholder="Nhập mật khẩu hiện tại"
                                        value={passwordForm.currentPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-3 mt-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#E4002B] focus:bg-white outline-none transition-all text-sm border border-gray-200 focus:border-[#E4002B]"
                                        required
                                    />
                                </div>

                                {/* New Password */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Mật khẩu mới *</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        placeholder="Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
                                        value={passwordForm.newPassword}
                                        onChange={handlePasswordChange}
                                        className="w-full px-4 py-3 mt-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#E4002B] focus:bg-white outline-none transition-all text-sm border border-gray-200 focus:border-[#E4002B]"
                                        required
                                        minLength={1}
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest">Xác nhận mật khẩu mới *</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 mt-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#E4002B] focus:bg-white outline-none transition-all text-sm border border-gray-200 focus:border-[#E4002B]"
                                        required
                                        minLength={1}
                                    />
                                </div>

                                {/* Password mismatch warning */}
                                {confirmPassword && passwordForm.newPassword !== confirmPassword && (
                                    <p className="text-red-500 text-sm font-semibold">Mật khẩu không khớp</p>
                                )}
                            </div>

                            {/* Submit Password Button */}
                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isChangingPassword || !validatePasswordForm()}
                                    className="px-8 py-3 bg-gradient-to-r from-[#E4002B] to-[#B8001F] text-white rounded-xl font-bold uppercase tracking-wide hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WarehouseManagerProfileForm;
