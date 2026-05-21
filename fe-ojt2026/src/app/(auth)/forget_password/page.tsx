"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api/authApi";
import { useToast } from "@/components/ui/ToastProvider";
import { validateEmail } from "@/lib/utils";

export default function ForgetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleValidateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError("Email là bắt buộc");
      return false;
    }
    if (!validateEmail(value)) {
      setEmailError("Email không hợp lệ (ví dụ: abc@domain.com) và không chứa số hay ký tự đặc biệt sau @");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!handleValidateEmail(email)) {
      toast.error("Lỗi", "Vui lòng nhập email hợp lệ");
      return;
    }

    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
      toast.success("Gửi OTP thành công!", "Mã xác thực đã được gửi đến email của bạn");

      // Wait 5 seconds before redirect to show success message
      setTimeout(() => {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      }, 5000);
    } catch (err: unknown) {
      console.error("Forgot password error:", err);

      const errorResponse = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string; Message?: string; Error?: string };
        };
        message?: string;
        code?: string;
      };

      // Network error (no response)
      if (!errorResponse.response) {
        const errorMsg = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
        setError(errorMsg);
        toast.error("Lỗi kết nối", errorMsg);
        return;
      }

      const status = errorResponse.response.status;
      // Try multiple ways to get error message from server
      const serverMessage =
        errorResponse.response.data?.message ||
        errorResponse.response.data?.Message ||
        errorResponse.response.data?.error ||
        errorResponse.response.data?.Error;

      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

      // Use server message if available
      if (serverMessage) {
        errorMessage = serverMessage;
      } else if (status === 404) {
        errorMessage = "Email không tồn tại trong hệ thống";
      } else if (status === 400) {
        errorMessage = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại email.";
      } else if (status === 429) {
        errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.";
      } else if (status === 500) {
        errorMessage = "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
      } else {
        errorMessage = `Lỗi không xác định (${status}). Vui lòng thử lại sau.`;
      }

      setError(errorMessage);
      toast.error("Gửi OTP thất bại", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Link
        href="/sign_in"
        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-[#E4002B] mb-8 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
        </svg>
        Quay lại đăng nhập
      </Link>

      <h2 className="text-3xl font-bold text-gray-900 mb-2">Quên mật khẩu?</h2>
      <p className="text-gray-500 mb-8">Nhập email nhân sự. Chúng tôi sẽ gửi mã OTP xác thực.</p>

      {isSuccess ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-6 rounded-xl text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p className="font-bold text-lg mb-1">Gửi OTP thành công!</p>
          <p className="text-sm">Mã xác thực đã được gửi đến <strong>{email}</strong></p>
          <p className="text-xs text-green-600 mt-3">Đang chuyển hướng trong 5 giây...</p>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Email</label>
              <input
                type="email"
                placeholder="john.doe@gmail.com"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) handleValidateEmail(e.target.value);
                }}
                onBlur={() => handleValidateEmail(email)}
                disabled={isLoading}
                className={`w-full px-4 py-3 mt-1 border rounded-lg focus:ring-2 focus:ring-[#E4002B] outline-none bg-gray-50 transition-all ${
                  emailError ? "border-red-500" : "border-gray-300"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              />
              {emailError && (
                <p className="mt-1 text-sm text-red-500">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#E4002B] text-white font-bold py-3.5 rounded-lg hover:bg-red-700 shadow-lg uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </>
              ) : (
                "Tiếp tục"
              )}
            </button>
          </form>
        </>
      )}
    </>
  );
}
