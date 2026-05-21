const stats = [
  { number: "150+", label: "Cửa Hàng Tại VN" },
  { number: "27.000+", label: "Cửa Hàng Toàn Cầu" },
  { number: "70+", label: "Năm Kinh Nghiệm" },
  { number: "145+", label: "Quốc Gia" },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-black text-white">
      <div className="max-w-[1400px] mx-auto px-10 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl lg:text-5xl font-black text-[#E4002B]">
                {stat.number}
              </div>
              <div className="text-xs lg:text-sm font-bold text-gray-400 uppercase tracking-wider mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
