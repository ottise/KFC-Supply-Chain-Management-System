import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="max-w-[1400px] mx-auto px-10 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg"
                alt="KFC Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-lg font-bold">KFC Việt Nam</span>
            </div>
            <p className="text-gray-400 text-sm max-w-md">
              Hệ thống Quản lý Chuỗi Cung Ứng cho hoạt động kinh doanh KFC Việt Nam.
              Tối ưu hóa doanh nghiệp của bạn với nền tảng quản lý toàn diện của chúng tôi.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4">
              Liên Kết Nhanh
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/sign_in" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Đăng Nhập
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Liên Hệ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider mb-4">
              Về Chúng Tôi
            </h4>
            <p className="text-gray-400 text-sm">
              KFC Việt Nam cam kết mang món gà rán yêu thích thế giới đến các cộng đồng trên cả nước thông qua hợp tác kinh doanh thành công.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Hệ Thống SCM KFC Việt Nam. Bảo lưu mọi quyền.
          </p>
          <p className="text-gray-600 text-xs">
            Phát triển bởi KFC Việt Nam
          </p>
        </div>
      </div>
    </footer>
  );
}
