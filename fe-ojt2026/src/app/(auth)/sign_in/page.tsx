"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import { getRedirectPath } from '@/lib/utils/authUtils';
import type { LoginRequest } from '@/types/auth';

export default function SignInPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState<LoginRequest>({
    EmailOrUsername: '',
    Password: '',
  });
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.EmailOrUsername || !formData.Password) {
      setError('Vui lòng nhập đầy đủ thông tin đăng nhập');
      toast.error('Lỗi', 'Vui lòng nhập đầy đủ thông tin đăng nhập');
      return;
    }

    try {
      const user = await login(formData);
      toast.success('Đăng nhập thành công!', 'Đang chuyển hướng...');

      // Verify token is stored before redirecting
      await new Promise(resolve => setTimeout(resolve, 200));

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token không được lưu. Vui lòng thử lại.');
      }


      const redirectPath = getRedirectPath(user.role);
      router.push(redirectPath);
    } catch (err: unknown) {
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';

      // Safe error handling
      try {
        if (err instanceof Error) {
          const errorMsg = err.message || '';
          if (errorMsg === 'Network Error' || !navigator.onLine) {
            errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
          } else if (errorMsg.includes('timeout')) {
            errorMessage = 'Kết nối bị quá thời gian. Vui lòng thử lại.';
          } else if (errorMsg.includes('401')) {
            errorMessage = 'Email hoặc mật khẩu không đúng.';
          } else if (errorMsg.includes('403')) {
            errorMessage = 'Tài khoản của bạn đã bị khóa.';
          } else if (errorMsg.includes('500')) {
            errorMessage = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
          } else {
            errorMessage = errorMsg;
          }
        }

        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError?.response) {
          const status = axiosError.response.status;
          const serverMessage = axiosError.response.data?.message;

          if (serverMessage) {
            // Check if it's the unverified email error
            if (serverMessage.toLowerCase().includes('xác thực email')) {
              if (typeof window !== 'undefined') {
                localStorage.setItem('pending_verification_email', formData.EmailOrUsername);
              }
              toast.error('Tài khoản chưa xác thực', 'Đang chuyển hướng đến trang xác thực email...');
              router.push('/verify-email');
              return;
            }
            errorMessage = serverMessage;
          } else if (status === 401) {
            errorMessage = 'Email hoặc mật khẩu không đúng.';
          } else if (status === 403) {
            errorMessage = 'Tài khoản của bạn đã bị khóa.';
          } else if (status === 500) {
            errorMessage = 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.';
          }
        }
      } catch {
        // Silently handle error
      }

      setError(errorMessage);
      toast.error('Đăng nhập thất bại', errorMessage);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Chào Mừng Trở Lại</h2>
      <p className="text-gray-500 mb-8">Vui lòng đăng nhập để tiếp tục quản lý hệ thống.</p>


      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email hoặc Tên đăng nhập</label>
          <input
            type="text"
            name="EmailOrUsername"
            placeholder="email@kfc.com hoặc username"
            value={formData.EmailOrUsername}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3.5 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] outline-none transition-all bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mật Khẩu</label>
          <input
            type="password"
            name="Password"
            placeholder="•••••••"
            value={formData.Password}
            onChange={handleChange}
            disabled={isLoading}
            className="w-full px-4 py-3.5 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E4002B] outline-none transition-all bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex items-center justify-end">
          <Link
            href="/forget_password"
            title="Quên mật khẩu"
            className="text-sm font-semibold text-[#E4002B] hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#E4002B] text-white font-bold py-3.5 rounded-lg hover:bg-red-700 transition-all shadow-lg uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Đang đăng nhập...
            </>
          ) : (
            'Đăng Nhập'
          )}
        </button>
      </form>

    </>
  );
}
