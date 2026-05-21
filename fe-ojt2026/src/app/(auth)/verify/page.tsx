"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/api/authApi";
import { useToast } from "@/components/ui/ToastProvider";
import { storeResetToken } from "@/lib/utils/authUtils";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const toast = useToast();

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      router.push("/forget_password");
    }
  }, [email, router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (val: string, index: number) => {
    if (/[^0-9]/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);
    setError("");

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = [...otp];
    pasteData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError("");

    const nextIndex = pasteData.length < 6 ? pasteData.length : 5;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số OTP");
      toast.error("Lỗi", "Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    try {
      const response = await authService.verifyOtp({ otpCode });

      if (response.valid) {
        // Store OTP as reset token in sessionStorage
        storeResetToken(otpCode);

        toast.success("Xác thực thành công!", "Đang chuyển hướng đến trang đặt lại mật khẩu...");

        // Redirect to reset password page WITHOUT OTP in URL
        router.push(`/reset_password?email=${encodeURIComponent(email)}`);
      } else {
        setError(response.message || "OTP không hợp lệ hoặc đã hết hạn");
        toast.error("Lỗi", response.message || "OTP không hợp lệ hoặc đã hết hạn");
      }
    } catch (err: unknown) {
      console.error("Verify OTP error:", err);

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
          errorMessage = "OTP không hợp lệ";
        } else if (status === 404) {
          errorMessage = "OTP không tồn tại hoặc đã hết hạn";
        }
      }

      setError(errorMessage);
      toast.error("Xác thực OTP thất bại", errorMessage);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      await authService.forgotPassword(email);
      setCountdown(30);
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
      toast.success("Gửi lại OTP thành công!", "Mã mới đã được gửi đến email của bạn");
    } catch (err: unknown) {
      console.error("Resend OTP error:", err);

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
        } else if (status === 404) {
          errorMessage = "Email không tồn tại trong hệ thống";
        } else if (status === 400) {
          errorMessage = "Dữ liệu không hợp lệ";
        } else if (status === 429) {
          errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau vài phút.";
        }
      }

      setError(errorMessage);
      toast.error("Gửi lại OTP thất bại", errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 uppercase tracking-tight">
        Xác thực Email
      </h2>
      <p className="text-gray-500 mb-10 text-sm">
        Nhập mã 6 chữ số đã được gửi đến email nhân sự của bạn.
      </p>

      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <div className="flex justify-between gap-2 md:gap-3">
          {otp.map((data, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              value={data}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              className={`w-full h-14 md:h-16 text-center text-2xl font-bold border-2 rounded-xl focus:border-[#E4002B] focus:ring-4 focus:ring-red-50 outline-none transition-all bg-gray-50 text-gray-900 ${
                error ? "border-red-500" : "border-gray-200"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={otp.join("").length !== 6 || isResending}
          className="w-full bg-[#E4002B] text-white font-bold py-4 rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 uppercase tracking-widest mt-6 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isResending
            ? "Đang gửi..."
            : countdown > 0
            ? `Gửi lại mã mới (${countdown}s)`
            : "Gửi lại mã mới"}
        </button>
      </div>

      <div className="mt-10">
        <p className="text-gray-500 text-sm">Không nhận được mã?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className={`font-bold text-sm mt-1 transition-colors ${
            countdown > 0 || isResending
              ? "text-gray-400 cursor-not-allowed"
              : "text-[#E4002B] hover:underline"
          }`}
        >
          {isResending
            ? "Đang gửi..."
            : countdown > 0
            ? `Gửi lại mã mới (${countdown}s)`
            : "Gửi lại mã mới"}
        </button>
      </div>

      <div className="mt-6 text-center">
        <Link href="/sign_in" className="text-[#E4002B] font-bold hover:underline text-sm">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
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

export default function VerifyPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyContent />
    </Suspense>
  );
}
