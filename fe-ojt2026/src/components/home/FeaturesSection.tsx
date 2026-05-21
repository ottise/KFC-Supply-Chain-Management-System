const features = [
  {
    number: "01.",
    title: "Thương Hiệu Uy Tín",
    description:
      "Hơn 70 năm kinh nghiệm và niềm tin của hàng triệu khách hàng tại Việt Nam và trên toàn thế giới.",
  },
  {
    number: "02.",
    title: "Hỗ Trợ Vận Hành",
    description:
      "Chúng tôi đồng hành cùng bạn từ khâu chọn địa điểm, đào tạo nhân viên đến chiến lược marketing.",
  },
  {
    number: "03.",
    title: "Chuỗi Cung Ứng",
    description:
      "Hệ thống cung ứng nguyên liệu tiêu chuẩn quốc tế, đảm bảo chất lượng đồng nhất cho mọi cửa hàng.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 px-10 lg:px-16 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {features.map((feature) => (
          <div key={feature.number} className="space-y-4">
            <div className="text-4xl font-black text-[#E4002B]">
              {feature.number}
            </div>
            <h4 className="text-xl font-bold uppercase tracking-tight text-gray-900">
              {feature.title}
            </h4>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
