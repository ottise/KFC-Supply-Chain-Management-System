"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  return (
    <>
      <header className="flex items-center justify-between h-20 px-6 lg:px-16 bg-white w-full fixed top-0 left-0 right-0 z-[1000] shadow-sm">
        <Logo />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/sign_in"
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-white bg-[#E4002B] rounded-full hover:bg-red-700 transition-all cursor-pointer"
            >
              Đăng Nhập
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="sm:hidden p-2 text-gray-700 hover:text-[#E4002B] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      <div className="h-20"></div>
    </>
  );
}
