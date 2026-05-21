"use client";

import { useState, useEffect } from 'react';
import { stockDocumentsApi } from '@/lib/api/warehouse/stockDocumentsApi';
import type { StockDocumentDetail } from '@/types/warehouse/stockDocuments';

interface MoveDetailProps {
  moveId: number;
  onBack: () => void;
}

export default function MoveDetailView({ moveId, onBack }: MoveDetailProps) {
  const [data, setData] = useState<StockDocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const parseApiDate = (dateStr?: string | null) => {
    if (!dateStr) return null;

    const raw = String(dateStr).trim().replace(' ', 'T');
    const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
    const normalized = hasTimezone ? raw : `${raw}Z`;

    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateTime = (dateStr?: string | null) => {
    const d = parseApiDate(dateStr);
    if (!d) return '---';

    return d.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatQty = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '0.00';
    return Number(value).toFixed(2);
  };

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const result = await stockDocumentsApi.getStockDocumentById(moveId);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch stock document detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [moveId]);

  if (loading) {
    return (
      <div className="bg-white rounded-[2.5rem] p-20 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Đang tải chi tiết...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-[2.5rem] p-20 flex flex-col items-center gap-4">
        <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Không tìm thấy thông tin chi tiết</p>
        <button onClick={onBack} className="text-[10px] font-black uppercase text-[#E4002B] hover:underline">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm animate-in slide-in-from-right-10 duration-500 overflow-hidden">
      {/* Control Bar */}
      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#E4002B] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại danh sách
        </button>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white border border-gray-200 text-[10px] font-black uppercase rounded-xl hover:bg-gray-50">In phiếu</button>
        </div>
      </div>

      <div className="p-10">
        {/* Header Info */}
        <div className="mb-10">
          <span className="text-[10px] font-black text-[#E4002B] uppercase tracking-[0.2em]">{data.DocumentType}</span>
          <h1 className="text-3xl font-black text-gray-900 mt-2">{data.DocumentNo}</h1>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Trạng thái</span>
              <span className="text-xs font-bold text-gray-900 uppercase">{data.Status}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Địa điểm nguồn</span>
              <span className="text-xs font-bold text-gray-700">{data.FromLocationName || '---'}</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Ngày tạo</span>
              <span className="text-xs font-bold text-gray-900">
                {formatDateTime(data.CreatedAt)}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Địa điểm đích</span>
              <span className="text-xs font-bold text-[#E4002B]">{data.ToLocationName || '---'}</span>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Sản phẩm</th>
                <th className="px-6 py-4">Số lô/Sê-ri</th>
                <th className="px-6 py-4 text-right">Kế hoạch</th>
                <th className="px-6 py-4 text-right">Thực tế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold">
              {data.Items.map((item) => (
                <tr key={item.Id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-gray-900 uppercase">{item.ProductName || '---'}</td>
                  <td className="px-6 py-4 text-gray-400 font-mono">{item.LotNumber || item.LotId || '---'}</td>
                  <td className="px-6 py-4 text-right">{formatQty(item.PlannedQty)} {item.UomName || ''}</td>
                  <td className="px-6 py-4 text-right text-[#E4002B]">{formatQty(item.ActualQty)} {item.UomName || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
