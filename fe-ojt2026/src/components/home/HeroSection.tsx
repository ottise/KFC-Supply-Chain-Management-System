"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="h-[85vh] w-full flex items-center hero-section text-white px-10 lg:px-16">
      <div className="max-w-3xl">
        <span className="bg-[#E4002B] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
          Cơ Hội Kinh Doanh
        </span>
        <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter mt-6 leading-tight">
          Hợp Tác Kinh Doanh{" "}
          <br />
          <span className="text-[#E4002B]">Cùng KFC Phát Triển</span>
        </h2>
        <p className="text-gray-300 text-lg mt-6 font-medium max-w-xl">
          Tận dụng sức mạnh của thương hiệu gà rán hàng đầu thế giới để xây dựng doanh nghiệp bền vững của riêng bạn.
        </p>
        <div className="mt-10 flex gap-4">
          <Link
            href="/sign_in"
            className="px-8 py-4 bg-[#E4002B] text-white font-bold uppercase text-[11px] tracking-widest rounded-full hover:scale-105 transition-all cursor-pointer"
          >
            Bắt Đầu Ngay
          </Link>
          <Link
            href="/contact"
            className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 font-bold uppercase text-[11px] tracking-widest rounded-full hover:bg-white/20 transition-all cursor-pointer"
          >
            Liên Hệ
          </Link>
        </div>
      </div>
    </section>
  );
}
