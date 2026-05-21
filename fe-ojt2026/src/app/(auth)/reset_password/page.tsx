"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/api/authApi";
import { useToast } from "@/components/ui/ToastProvider";
import { getResetToken, removeResetToken } from "@/lib/utils/authUtils";
import type { ResetPasswordRequest } from "@/types/auth";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const otpCode = getResetToken() || ""; // Get OTP from sessionStorage instead of URL
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // Redirect if no email or otp provided
  useEffect(() => {
    if (!email || !otpCode) {
      router.push("/forget_password");
    }
  }, [email, otpCode, router]);

  // Password strength indicator
  useEffect(() => {
    let score = 0;
    if (password.length > 0) score = 1;
    if (password.length > 4) score = 2;
    if (password.length > 8) score = 3;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length > 8) score = 4;
    setStrength(score);
  }, [password]);

  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      setPasswordError("Mật khẩu phải có ít nhất 8 ký tự");
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError("Mật khẩu phải có ít nhất 1 chữ hoa");
      return false;
    }
    if (!/[a-z]/.test(pwd)) {
      setPasswordError("Mật khẩu phải có ít nhất 1 chữ thường");
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError("Mật khẩu phải có ít nhất 1 chữ số");
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      setPasswordError("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateConfirmPassword = (confirm: string): boolean => {
    if (confirm !== password) {
      setConfirmError("Mật khẩu xác nhận không khớp");
      return false;
    }
    setConfirmError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmValid) {
      toast.error("Lỗi", "Vui lòng kiểm tra lại mật khẩu");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        email,
        otpCode,
        newPassword: password,
        confirmPassword,
      });

      setIsSuccess(true);
      toast.success("Đặt lại mật khẩu thành công!", "Đang chuyển hướng đến trang đăng nhập...");

      // Clear reset token after successful reset
      removeResetToken();

      // Redirect to sign_in after 5 seconds
      setTimeout(() => {
        router.push("/sign_in");
      }, 5000);
    } catch (err: unknown) {
      console.error("Reset password error:", err);

      const errorResponse = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string; Message?: string; Error?: string };
        };
      };

      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

      if (!errorResponse.response) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      } else {
        const status = errorResponse.response.status;
        const serverMessage =
          errorResponse.response.data?.message ||
          errorResponse.response.data?.Message ||
          errorResponse.response.data?.error ||
          errorResponse.response.data?.Error;

        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (status === 400) {
          errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (status === 404) {
          errorMessage = "OTP không hợp lệ hoặc đã hết hạn";
        }
      }

      setError(errorMessage);
      toast.error("Đặt lại mật khẩu thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !otpCode) {
    return null;
  }

  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-tight">
        Đặt lại mật khẩu
      </h2>
      <p className="text-gray-500 mb-8 text-sm">
        Vui lòng tạo mật khẩu mới mạnh hơn để bảo vệ tài khoản.
      </p>

      {isSuccess ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-xl text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="font-bold text-lg mb-1">Đặt lại mật khẩu thành công!</p>
          <p className="text-sm">Mật khẩu của bạn đã được cập nhật</p>
          <p className="text-xs text-green-600 mt-3">Đang chuyển hướng đến trang đăng nhập trong 5 giây...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) validatePassword(e.target.value);
                }}
                onBlur={() => validatePassword(password)}
                disabled={isLoading}
                className={`w-full px-4 py-3 mt-1 border rounded-lg focus:ring-2 focus:ring-[#E4002B] outline-none bg-gray-50 transition-all ${
                  passwordError ? "border-red-500" : "border-gray-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {passwordError && (
                <p className="mt-1 text-sm text-red-500">{passwordError}</p>
              )}

              {/* Password Strength Indicator */}
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                      strength >= level ? "bg-[#E4002B]" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                Độ mạnh mật khẩu
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmError) validateConfirmPassword(e.target.value);
                }}
                onBlur={() => validateConfirmPassword(confirmPassword)}
                disabled={isLoading}
                className={`w-full px-4 py-3 mt-1 border rounded-lg focus:ring-2 focus:ring-[#E4002B] outline-none bg-gray-50 transition-all ${
                  confirmError ? "border-red-500" : "border-gray-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {confirmError && (
                <p className="mt-1 text-sm text-red-500">{confirmError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E4002B] text-white font-bold py-3.5 rounded-lg hover:bg-red-700 shadow-lg shadow-red-100 uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật mật khẩu"
              )}
            </button>
          </form>
        </>
      )}
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Đang tải...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
