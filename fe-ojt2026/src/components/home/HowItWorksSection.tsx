const steps = [
  {
    number: 1,
    title: "Liên Hệ",
    description: "Liên hệ với chúng tôi để bắt đầu hành trình",
  },
  {
    number: 2,
    title: "Đánh Giá",
    description: "Đội ngũ chúng tôi xem xét hồ sơ của bạn",
  },
  {
    number: 3,
    title: "Thiết Lập",
    description: "Chọn địa điểm, đào tạo & chuẩn bị",
  },
  {
    number: 4,
    title: "Khai Trương",
    description: "Mở cửa với sự hỗ trợ toàn diện",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 px-10 lg:px-16 bg-gray-50">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-gray-900">
            Quy Trình Tham Gia
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            Bắt đầu hành trình hợp tác với quy trình 4 bước đơn giản
          </p>
        </div>

        {/* Desktop: Horizontal timeline */}
        <div className="hidden md:flex justify-between items-start relative">
          {/* Connecting line */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-200 mx-20" />

          {steps.map((step, index) => (
            <div
              key={step.number}
              className="flex flex-col items-center relative z-10 flex-1"
            >
              {/* Number circle */}
              <div className="w-16 h-16 rounded-full bg-[#E4002B] text-white flex items-center justify-center text-xl font-black mb-6">
                {step.number}
              </div>
              <h4 className="text-lg font-bold uppercase tracking-tight text-gray-900 mb-2">
                {step.title}
              </h4>
              <p className="text-sm text-gray-500 text-center max-w-[160px]">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="md:hidden space-y-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-start gap-6">
              {/* Number circle */}
              <div className="w-12 h-12 rounded-full bg-[#E4002B] text-white flex items-center justify-center text-lg font-black flex-shrink-0">
                {step.number}
              </div>
              <div className="pt-2">
                <h4 className="text-lg font-bold uppercase tracking-tight text-gray-900 mb-1">
                  {step.title}
                </h4>
                <p className="text-sm text-gray-500">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
