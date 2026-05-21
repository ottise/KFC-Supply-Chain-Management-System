import Link from "next/link";

export function CTASection() {
  return (
    <section className="py-20 px-10 lg:px-16 bg-[#E4002B]">
      <div className="max-w-[1400px] mx-auto text-center">
        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-white">
          Sẵn Sàng Bắt Đầu Hành Trình Cùng KFC?
        </h2>
        <p className="text-white/80 mt-4 max-w-xl mx-auto text-lg">
          Tham gia cùng 150+ đối tác thành công tại Việt Nam
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign_in"
              className="px-8 py-4 bg-white text-[#E4002B] font-bold uppercase text-[11px] tracking-widest rounded-full hover:scale-105 transition-all cursor-pointer"
            >
              Đăng Nhập Ngay
            </Link>
          <Link
            href="/contact"
            className="px-8 py-4 bg-transparent text-white border-2 border-white font-bold uppercase text-[11px] tracking-widest rounded-full hover:bg-white/10 transition-all cursor-pointer"
          >
            Liên Hệ
          </Link>
        </div>
      </div>
    </section>
  );
}
