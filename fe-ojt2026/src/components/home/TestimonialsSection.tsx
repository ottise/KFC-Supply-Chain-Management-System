const testimonials = [
  {
    initials: "TN",
    name: "Trần Nam",
    location: "KFC Quận 1, TP.HCM",
    rating: 5,
    quote: "Hợp tác với KFC là quyết định kinh doanh tốt nhất tôi từng đưa ra. Sự hỗ trợ từ đội ngũ tuyệt vời, và uy tín thương hiệu đã mang khách hàng đến từ ngày đầu tiên.",
  },
  {
    initials: "LH",
    name: "Lê Hằng",
    location: "KFC Cầu Giấy, Hà Nội",
    rating: 5,
    quote: "Hệ thống chuỗi cung ứng hoàn hảo. Tôi không bao giờ phải lo lắng về chất lượng hay nguồn cung nguyên liệu. Chương trình đào tạo đã chuẩn bị tốt cho tôi và đội ngũ.",
  },
  {
    initials: "PV",
    name: "Phương Vy",
    location: "KFC Đà Nẵng",
    rating: 5,
    quote: "Từ chọn địa điểm đến khai trương, KFC Việt Nam đã hướng dẫn tôi qua từng bước. Giờ vận hành cửa hàng thành công với tăng trưởng doanh thu ổn định 3 năm liên tiếp.",
  },
];

function StarIcon() {
  return (
    <svg
      className="w-5 h-5 text-[#E4002B] fill-current"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg
      className="w-8 h-8 text-[#E4002B] opacity-20"
      fill="currentColor"
      viewBox="0 0 32 32"
    >
      <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2V8z" />
    </svg>
  );
}

export function TestimonialsSection() {
  return (
    <section className="py-20 px-10 lg:px-16 bg-white">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight text-gray-900">
            Đối Tác Nói Gì Về Chúng Tôi
          </h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">
            Nghe từ những đối tác thành công trên khắp Việt Nam
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.initials}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow relative"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6">
                <QuoteIcon />
              </div>

              {/* Star rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                &quot;{testimonial.quote}&quot;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#E4002B] text-white flex items-center justify-center font-bold text-sm">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{testimonial.name}</p>
                  <p className="text-xs text-gray-500">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
