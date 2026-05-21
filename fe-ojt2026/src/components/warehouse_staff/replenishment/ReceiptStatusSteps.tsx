"use client";
export default function ReceiptStatusSteps({ currentStatus }: { currentStatus: string }) {
  const steps = ["Nháp", "Sẵn sàng", "Một phần", "Đã hoàn thành"];
  
  const getActiveIndex = (status: string) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("draft") || s.includes("nháp") || s.includes("dự thảo")) return 0;
    if (s.includes("ready") || s.includes("confirmed") || s.includes("sẵn sàng")) return 1;
    if (s.includes("partial") || s.includes("một phần")) return 2;
    if (s.includes("completed") || s.includes("hoàn thành") || s.includes("hoàn tất")) return 3;
    return -1;
  };

  const activeIndex = getActiveIndex(currentStatus);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 w-fit">
      {steps.map((step, index) => {
        const isActive = activeIndex === index;
        const isPast = activeIndex > index;
        return (
          <div key={step} className="flex items-center">
            <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              isActive ? "bg-gray-900 text-white shadow-sm" :
              isPast ? "bg-green-100 text-green-700 border border-green-200" :
              "bg-gray-100 text-gray-400"
            }`}>
              {step}
            </div>
            {index < steps.length - 1 && <span className="text-gray-300 text-xs font-light px-0.5">›</span>}
          </div>
        );
      })}
    </div>
  );
}