"use client";

import React from "react";
import { Transfer, TransferStatus } from '@/types/warehouse';

interface Props {
  transfers: Transfer[];
  onSelect: (transfer: Transfer) => void;
}

// Status configuration with colors and labels
const STATUS_CONFIG: Record<TransferStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  DRAFT: { label: 'Nháp', bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
  WAITING: { label: 'Chờ xử lý', bgColor: 'bg-yellow-50/50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200/50' },
  READY: { label: 'Đã sẵn sàng', bgColor: 'bg-blue-50/50', textColor: 'text-blue-700', borderColor: 'border-blue-200/50' },
  DONE: { label: 'Hoàn tất', bgColor: 'bg-emerald-50/60', textColor: 'text-emerald-700', borderColor: 'border-emerald-200/50' },
  CANCELLED: { label: 'Đã hủy', bgColor: 'bg-red-50/50', textColor: 'text-red-700', borderColor: 'border-red-200/50' },
};

const TransferTable: React.FC<Props> = ({ transfers, onSelect }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-[22%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Mã phiếu / Ngày tạo</th>
            <th className="w-[16%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Loại hình</th>
            <th className="w-[24%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Vị trí xuất</th>
            <th className="w-[20%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Người phụ trách</th>
            <th className="w-[18%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
          {transfers.map((t, idx) => {
            const statusKey = (t.status || 'DRAFT').toUpperCase() as TransferStatus;
            const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];

            return (
              <tr
                key={idx}
                onClick={() => onSelect(t)}
                className="group hover:bg-red-50/20 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-[13px] font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors line-clamp-1">
                      {t.code}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        ĐẶT: {t.date || "—"}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  {t.documentType === 'TRANSFER' ? (
                    <div className="flex items-center gap-2 w-fit px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-1.5 h-1.5 bg-gray-900 rounded-full"></div>
                      <span className="text-[9px] font-black text-gray-900 uppercase tracking-tighter">Nội bộ</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-fit px-3 py-1.5 bg-red-50/80 rounded-xl border border-red-100">
                      <div className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></div>
                      <span className="text-[9px] font-black text-[#E4002B] uppercase tracking-tighter">Giao hàng</span>
                    </div>
                  )}
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-gray-900 text-[11px] uppercase tracking-tighter" title={t.fromLocationName}>
                      {t.fromLocationName || "Kho KFC"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 mt-0.5 border-l-2 border-gray-200 pl-2 leading-relaxed line-clamp-1" title={t.destination}>
                      {t.destination || "Vị trí chưa xác định"}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-gray-600 truncate underline decoration-gray-200 decoration-1 underline-offset-4">{t.responsible || "—"}</span>
                  </div>
                </td>

                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase rounded-full border transition-all shadow-sm ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}`}>
                    {statusConfig.label}
                  </span>
                </td>
              </tr>
            );
          })}
          {transfers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-20 text-center">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không tìm thấy dữ liệu phù hợp</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransferTable;