"use client";
import React from 'react';
import { TransferOrderListItem } from "@/types/warehouse/transferOrders";

interface TransferTableProps {
    transfers: TransferOrderListItem[];
    onSelect: (transfer: TransferOrderListItem) => void;
}

const TransferTable: React.FC<TransferTableProps> = ({ transfers, onSelect }) => {
    const getStatusInfo = (status: string) => {
        const s = String(status).toUpperCase();
        switch (s) {
            case "DRAFT":
                return { label: "Nháp", style: "bg-gray-100 text-gray-600 border-gray-200" };
            case "WAITING":
                return { label: "Chờ xử lý", style: "bg-yellow-100 text-yellow-600 border-yellow-200" };
            case "READY":
                return { label: "Đã sẵn sàng", style: "bg-blue-100 text-blue-700 border-blue-200" };
            case "DONE":
                return { label: "Hoàn thành", style: "bg-green-100 text-green-600 border-green-200" };
            case "CANCELLED":
                return { label: "Đã hủy", style: "bg-red-100 text-red-600 border-red-200" };
            default:
                return { label: status || "Không rõ", style: "bg-gray-100 text-gray-600 border-gray-200" };
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed border-collapse">
                <thead>
                    <tr>
                        <th className="w-[24%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Mã phiếu</th>
                        <th className="w-[22%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Vị trí xuất kho</th>
                        <th className="w-[22%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Vị trí nhập kho</th>
                        <th className="w-[18%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Ngày dự kiến</th>
                        <th className="w-[14%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
                    {transfers.map((t) => (
                        <tr
                            key={t.Id}
                            onClick={() => onSelect(t)}
                            className="group hover:bg-red-50/20 transition-colors cursor-pointer"
                        >
                            <td className="px-6 py-4">
                                <div className="flex flex-col gap-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[13px] font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors truncate">
                                            {t.TransferNo}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" /></svg>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                            Đặt: {t.CreatedAt ? new Date(t.CreatedAt.endsWith('Z') ? t.CreatedAt : t.CreatedAt + 'Z').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[11px] font-bold text-gray-600 leading-tight line-clamp-2">
                                    {t.FromLocationName || '—'}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-[11px] font-black text-gray-900 leading-tight line-clamp-2">
                                    {t.ToLocationName || '—'}
                                </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                                <span className="inline-block px-3 py-1 text-[10px] font-black uppercase rounded-full border border-blue-200 bg-blue-50 text-blue-700 tabular-nums">
                                    {t.PlannedDate ? new Date(t.PlannedDate.includes('T') ? t.PlannedDate : `${t.PlannedDate}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                                </span>
                            </td>

                            <td className="px-6 py-4 text-center">
                                {(() => {
                                    const info = getStatusInfo(t.Status);
                                    return (
                                        <span className={`inline-block px-3 py-1 text-[9px] font-black uppercase rounded-full border ${info.style}`}>
                                            {info.label}
                                        </span>
                                    );
                                })()}
                            </td>

                        </tr>
                    ))}
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