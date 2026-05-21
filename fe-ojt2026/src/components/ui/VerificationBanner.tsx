"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface VerificationBannerProps {
  onDismiss?: () => void;
}

export default function VerificationBanner({ onDismiss }: VerificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();
  const [storedEmail, setStoredEmail] = useState<string>("");

  useEffect(() => {
    // Get email from localStorage or user
    const email = user?.email || "";
    setStoredEmail(email);
  }, [user]);

  useEffect(() => {
    // Show banner with animation delay
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Banner content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-8 transform transition-all">
        {/* Close button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Đóng"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Title and message */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
          Email Chưa Được Xác Thực
        </h3>
        <p className="text-gray-600 text-center mb-4">
          Vui lòng xác thực email để tiếp tục sử dụng các tính năng của hệ thống.
        </p>

        {/* Email display */}
        {storedEmail && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-sm text-gray-500 mb-1">Email đăng ký:</p>
            <p className="font-semibold text-gray-900">{storedEmail}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Link
            href="/verify-email"
            className="block w-full bg-[#E4002B] text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-all text-center"
          >
            Xác Thực Email Ngay
          </Link>
          <button
            onClick={handleDismiss}
            className="block w-full text-gray-600 font-medium py-3 hover:text-gray-800 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
