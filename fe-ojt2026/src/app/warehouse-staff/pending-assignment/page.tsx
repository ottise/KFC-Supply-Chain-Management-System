"use client";

import Link from "next/link";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { ADMIN_CONTACT } from "@/lib/constants";

export default function PendingAssignmentPage() {
  const { user } = useAuthContext();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Warning Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header with icon */}
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-8 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              Chưa Được Phân Công
            </h1>
            <p className="text-white/80 text-sm mt-2 font-medium">
              Tài khoản của bạn chưa được gán quản lý
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-6">
              <p className="text-gray-600 leading-relaxed">
                Xin chào{" "}
                <span className="font-bold text-gray-900">
                  {user?.fullname || "Nhân Viên"}
                </span>
                !
              </p>
              <p className="text-gray-600 mt-3 leading-relaxed">
                Tài khoản của bạn hiện chưa được liên kết với bất kỳ quản lý
                kho nào. Vui lòng liên hệ{" "}
                <span className="font-bold text-[#E4002B]">Quản trị viên</span>{" "}
                để được đăng ký và phân công làm việc với quản lý kho phù hợp.
              </p>
            </div>

            {/* Admin Contact Card */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5 mb-6">
              <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#E4002B]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Liên hệ Quản trị viên
              </h3>
              <div className="space-y-3">
                <a
                  href={`mailto:${ADMIN_CONTACT.EMAIL}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                    <svg
                      className="w-5 h-5 text-[#E4002B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Email</p>
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {ADMIN_CONTACT.EMAIL}
                    </p>
                  </div>
                </a>
                <a
                  href={`tel:${ADMIN_CONTACT.PHONE.replace(/[^0-9]/g, "")}`}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                    <svg
                      className="w-5 h-5 text-[#E4002B]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                    <p className="text-sm font-bold text-gray-800">
                      {ADMIN_CONTACT.PHONE}
                    </p>
                  </div>
                </a>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-amber-800 text-sm mb-1">
                    Lưu ý
                  </h3>
                  <p className="text-amber-700 text-xs leading-relaxed">
                    Sau khi Quản trị viên phê duyệt và gán bạn với một Quản lý
                    kho, bạn sẽ có thể sử dụng đầy đủ các chức năng của hệ
                    thống.
                  </p>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="space-y-4">
              <Link
                href="/warehouse-staff/profile"
                className="block w-full bg-gradient-to-r from-[#E4002B] to-[#B8001F] text-white text-center py-4 rounded-2xl font-bold uppercase tracking-wide hover:shadow-lg hover:shadow-red-200 transition-all active:scale-95"
              >
                Xem Hồ Sơ Cá Nhân
              </Link>

              <button
                onClick={() => {
                  localStorage.removeItem("auth_token");
                  localStorage.removeItem("user_info");
                  window.location.href = "/sign_in";
                }}
                className="w-full bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold uppercase tracking-wide hover:bg-gray-200 transition-all active:scale-95"
              >
                Đăng Xuất
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-400 font-medium">
              KFC Supply Chain Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
