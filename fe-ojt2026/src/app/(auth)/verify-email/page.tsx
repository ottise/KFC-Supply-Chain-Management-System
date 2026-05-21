"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/api/authApi";
import { useToast } from "@/components/ui/ToastProvider";

function VerifyEmailContent() {
  const router = useRouter();
  const toast = useToast();

  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Load email from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedEmail = localStorage.getItem('pending_verification_email');
      if (storedEmail) {
        setEmail(storedEmail);
      } else {
        // No email found, redirect to sign in
        router.push('/sign_in');
      }
    }
  }, [router]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (val: string, index: number) => {
    // Allow only numbers
    if (!/^\d*$/.test(val)) return;

    // Take only last character
    const char = val.slice(-1);

    // Use functional update to avoid stale closure
    setOtp(prevOtp => {
      const newOtp = [...prevOtp];
      newOtp[index] = char;
      return newOtp;
    });

    setError("");

    // Auto-focus next input if char was entered
    if (char && index < 5) {
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
    const pasteData = e.clipboardData.getData("text");

    // Remove all non-digit characters
    const cleanData = pasteData.replace(/\D/g, '').slice(0, 6);

    if (cleanData.length === 0) return;

    const newOtp = [...otp];
    cleanData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError("");

    const nextIndex = cleanData.length < 6 ? cleanData.length : 5;
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số");
      toast.error("Lỗi", "Vui lòng nhập đầy đủ 6 số");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      await authService.verifyEmail({ email, otpCode });

      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_verification_email');
      }

      toast.success("Xác thực thành công!", "Đang chuyển hướng đến trang đăng nhập...");

      setTimeout(() => {
        router.push('/sign_in');
      }, 2000);
    } catch (err: unknown) {
      const errorResponse = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string; [key: string]: unknown };
        };
      };

      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

      if (!errorResponse.response) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      } else {
        const status = errorResponse.response.status;
        const serverMessage = errorResponse.response.data?.message || errorResponse.response.data?.error;

        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (status === 400) {
          errorMessage = "Mã xác thực không hợp lệ";
        } else if (status === 404) {
          errorMessage = "Email không tồn tại trong hệ thống";
        } else if (status === 422) {
          errorMessage = errorResponse.response.data?.message || "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (status === 429) {
          errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau.";
        }
      }

      setError(errorMessage);
      toast.error("Xác thực thất bại", errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setError("");

    try {
      await authService.sendVerificationEmail(email);
      setCountdown(30);
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
      toast.success("Gửi lại mã thành công!", "Mã mới đã được gửi đến email của bạn");
    } catch (err: unknown) {
      const errorResponse = err as {
        response?: {
          status?: number;
          data?: { message?: string; error?: string };
        };
      };

      let errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại sau.";

      if (!errorResponse.response) {
        errorMessage = "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      } else {
        const status = errorResponse.response.status;
        const serverMessage = errorResponse.response.data?.message || errorResponse.response.data?.error;

        if (serverMessage) {
          errorMessage = serverMessage;
        } else if (status === 404) {
          errorMessage = "Email không tồn tại trong hệ thống";
        } else if (status === 429) {
          errorMessage = "Quá nhiều yêu cầu. Vui lòng thử lại sau.";
        }
      }

      setError(errorMessage);
      toast.error("Gửi lại mã thất bại", errorMessage);
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
        Xác Thực
      </h2>
      <p className="text-gray-500 mb-10 text-sm">
        Nhập mã 6 chữ số đã được gửi đến: <span className="font-semibold">{email}</span>
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
              className={`w-full h-14 md:h-16 text-center text-2xl font-bold border-2 rounded-xl focus:border-[#E4002B] focus:ring-4 focus:ring-red-50 outline-none transition-all bg-gray-50 text-gray-900 ${error ? "border-red-500" : "border-gray-200"
                }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={otp.join("").length !== 6 || isVerifying}
          className="w-full bg-[#E4002B] text-white font-bold py-4 rounded-xl hover:bg-red-700 shadow-lg shadow-red-100 uppercase tracking-widest mt-6 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isVerifying ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang xác thực...
            </>
          ) : "Xác Thực Email"}
        </button>
      </div>

      <div className="mt-10">
        <p className="text-gray-500 text-sm">Không nhận được mã?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className={`font-bold text-sm mt-1 transition-colors ${countdown > 0 || isResending
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
