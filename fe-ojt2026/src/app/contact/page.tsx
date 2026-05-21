"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    location: "",
    phone: "",
    request: "",
  });
  const { success } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success("Thành công", "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong 24-48 giờ.");
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="flex items-center justify-between h-20 px-6 lg:px-12 bg-white border-b border-gray-100 w-full sticky top-0 z-[1000]">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg"
            alt="KFC Logo"
            className="w-10 h-10 object-contain"
          />
          <span className="text-lg font-bold text-gray-900">KFC Việt Nam</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Về Trang Chủ</span>
        </Link>
      </header>

      {/* Content */}
      <div className="py-12 px-6 lg:px-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
              Liên Hệ
            </h1>
            <p className="text-gray-500 mt-2">
              Quan tâm đến hợp tác? Liên hệ với đội ngũ của chúng tôi.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Họ Tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Địa Điểm
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Thành Phố Hồ Chí Minh"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+84 xxx xxx xxx"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Tin Nhắn *
                </label>
                <textarea
                  name="request"
                  rows={5}
                  value={formData.request}
                  onChange={handleChange}
                  placeholder="Cho chúng tôi biết về sự quan tâm của bạn đối với KFC..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm focus:border-[#E4002B] focus:ring-2 focus:ring-red-100 transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#E4002B] text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all uppercase text-sm tracking-wider cursor-pointer"
              >
                Gửi Tin Nhắn
              </button>
            </form>
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            Chúng tôi thường phản hồi trong vòng 24-48 giờ
          </p>
        </div>
      </div>
    </div>
  );
}
