"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { format } from "date-fns";

export default function ReceiptDetailModal({ receipt, onClose }: any) {
  if (!receipt) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "---";
    try {
      // Đảm bảo xử lý đúng giờ UTC bằng cách thêm 'Z' nếu thiếu,
      // sau đó hiển thị theo giờ địa phương (Việt Nam)
      const date = new Date(dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`);
      return format(date, "HH:mm dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const receptions = receipt.receptions || [];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" aria-hidden="true" />
      
      <div className="relative bg-[#F8FAFC] w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
        {/* Header KFC Style */}
        <div className="bg-[#E4002B] p-6 shrink-0 flex justify-between items-center shadow-lg relative z-10">
          <div className="flex items-center gap-4">
             <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
             </div>
             <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-0.5">Lịch sử nhập kho (Nhân viên)</p>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{receipt.code}</h2>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white text-white hover:text-[#E4002B] rounded-full flex items-center justify-center transition-all duration-300 transform hover:rotate-90 shadow-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
          {/* Thông tin đơn hàng tóm tắt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nhà cung cấp</p>
              <p className="font-bold text-slate-900 truncate uppercase text-sm">{receipt.vendor || receipt.supplierName || "---"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chứng từ gốc</p>
              <p className="font-mono font-bold text-[#E4002B] text-sm">{receipt.source || receipt.origin || "---"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vị trí đến</p>
              <p className="font-bold text-slate-900 text-sm leading-snug line-clamp-3" title={String(
                receipt.locationPath
                  ? [receipt.warehouse, receipt.locationPath].filter(Boolean).join(" | ")
                  : receipt.toLocation || receipt.toLocationName || "---",
              )}>
                {receipt.locationPath
                  ? [receipt.warehouse, receipt.locationPath].filter(Boolean).join(" | ")
                  : receipt.toLocation || receipt.toLocationName || "---"}
              </p>
            </div>
            <div className="space-y-1 sm:text-right lg:text-right">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày kế hoạch</p>
               <p className="font-bold text-slate-900 text-sm">{receipt.scheduledDate || receipt.plannedDate || "---"}</p>
            </div>
          </div>

          {/* Lịch sử nhận hàng */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase flex items-center gap-3">
                <span className="w-2 h-6 bg-[#E4002B] rounded-full"></span>
                Chi tiết các đợt nhận hàng
              </h3>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">
                {receptions.length} Đợt nhận
              </span>
            </div>

            {receptions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[32px] border-2 border-dashed border-slate-200">
                 <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                 </div>
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Chưa có dữ liệu nhận hàng từng phần</p>
              </div>
            ) : (
              <div className="space-y-8 relative">
                {receptions.map((rec: any, idx: number) => (
                  <div key={rec.id} className="relative pl-8 group">
                    {/* Timeline Line */}
                    {idx !== receptions.length - 1 && (
                      <div className="absolute left-[15px] top-8 bottom-[-32px] w-0.5 bg-slate-200 border-dashed border-l"></div>
                    )}
                    
                    {/* Timeline Dot */}
                    <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white border-4 border-[#E4002B] shadow-md z-10 flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-[#E4002B] rounded-full animate-pulse"></div>
                    </div>

                    <div className="bg-white rounded-[28px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-[#E4002B]/20 transform hover:-translate-y-1">
                      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-50 flex justify-between items-center group-hover:bg-red-50/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-tight">
                            Đợt nhận hàng thứ {receptions.length - idx}
                          </h4>
                          {idx === 0 && (
                             <span className="bg-[#E4002B] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Mới nhất</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl text-slate-600 shadow-sm border border-slate-100">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                          <span className="text-[10px] font-black tabular-nums">{formatDate(rec.receivedAt)}</span>
                        </div>
                      </div>

                      <div className="p-0">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/30">
                              <th className="pl-6 pr-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Sản phẩm nhập</th>
                              <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Số lô</th>
                              <th className="pl-4 pr-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Số lượng nhận</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {rec.items.map((it: any, i2: number) => (
                              <tr key={i2} className="hover:bg-slate-50/50 transition-colors">
                                <td className="pl-6 pr-4 py-4">
                                  <p className="font-bold text-slate-900 text-xs uppercase">{it.product}</p>
                                </td>
                                <td className="px-4 py-4">
                                  <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black border border-blue-100 uppercase tracking-wider">
                                    {it.lotName || "---"}
                                  </span>
                                </td>
                                <td className="pl-4 pr-6 py-4 text-right">
                                  <div className="flex flex-col items-end">
                                    <p className="font-black text-[#E4002B] text-base leading-none">
                                      {it.quantity}
                                    </p>
                                    <span className="text-[9px] font-black text-slate-400 uppercase mt-1">{it.unit || "Đơn vị"}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] relative z-10">
           <button 
             onClick={onClose} 
             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-black transition-all shadow-lg hover:shadow-black/20 active:scale-[0.98]"
            >
              Đóng cửa sổ chi tiết
            </button>
        </div>
      </div>
    </div>
  );
}