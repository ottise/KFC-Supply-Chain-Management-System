"use client";
import React from 'react';
import { X, Calendar } from 'lucide-react';
import type { TransferOrderDetail } from "@/types/warehouse/transferOrders";

interface Props {
  transfer: TransferOrderDetail;
  onClose: () => void;
}

const STATUS_FLOW: { key: string; label: string }[] = [
  { key: 'DRAFT', label: 'Nháp' },
  { key: 'WAITING', label: 'Chờ xử lý' },
  { key: 'READY', label: 'Đã sẵn sàng' },
  { key: 'DONE', label: 'Hoàn thành' },
];

const formatDate = (date?: string | null) => {
  if (!date) return '--';
  const d = new Date(String(date).includes('T') ? String(date) : `${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('vi-VN');
};

const TransferDetail: React.FC<Props> = ({ transfer, onClose }) => {
  const currentStatus = String(transfer.Status || 'DRAFT').toUpperCase();
  const totalQty = (transfer.Items || []).reduce((sum, it) => sum + (Number(it.RequestedQty ?? it.Quantity) || 0), 0);

  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[1200px] h-[min(86vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] rounded-[2rem] border border-[#E4002B]/30 shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="relative z-[2] shrink-0 px-5 py-2 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-1.5 shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
          <div className="flex flex-col items-center text-center min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-7 bg-[#E4002B] rounded-full shrink-0" />
              <div>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Phiếu điều chuyển</p>
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-0.5">Chi tiết phiếu điều chuyển</h2>
                <p className="text-[10px] font-black text-white/85 uppercase tracking-wider mt-1">Mã phiếu: {transfer.TransferNo}</p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex flex-wrap justify-center items-center gap-2">
            {STATUS_FLOW.map((status, index) => (
              <React.Fragment key={status.key}>
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${status.key === currentStatus ? 'bg-white text-[#E4002B] border-white shadow-md' : 'bg-white/10 text-white/80 border-white/30'}`}>
                  {status.label}
                </span>
                {index < STATUS_FLOW.length - 1 && <span className="text-white/50 text-xs font-light">›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5">
          <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,438px)] gap-4 overflow-hidden">
            <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
              <div className="shrink-0 flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Danh sách sản phẩm</h4>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar pr-1">
                {(transfer.Items || []).length === 0 ? (
                  <div className="h-full min-h-[200px] rounded-[2rem] border border-[#E4002B]/25 bg-gradient-to-b from-[#fff7f8] to-white shadow-sm flex items-center justify-center">
                    <div className="text-center px-6 py-8">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không có sản phẩm</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(transfer.Items || []).map((item) => (
                      <div
                        key={item.Id}
                        className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4"
                      >
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(12rem,1fr)_190px_90px] sm:gap-3 sm:items-end">
                          <div className="min-w-0">
                            <p className="mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</p>
                            <div className="w-full h-11 rounded-[1rem] border border-gray-200 bg-gray-50/50 px-4 flex items-center text-[10px] font-bold text-gray-800 truncate">
                              {item.ProductName}
                            </div>
                          </div>

                          <div className="min-w-0">
                            <p className="mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                            <div className="grid h-11 w-full grid-cols-2 overflow-hidden rounded-[1rem] border border-gray-200 bg-white shadow-sm">
                              <div className="h-full w-full px-1.5 flex items-center justify-center text-[11px] font-black tabular-nums text-gray-900">
                                {Number(item.RequestedQty ?? item.Quantity) || 0}
                              </div>
                              <div className="flex min-w-0 items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                                {item.UomName || '--'}
                              </div>
                            </div>
                          </div>

                          <div className="h-11 rounded-[1rem] border border-gray-200/90 bg-gray-50/60 text-[9px] font-black uppercase tracking-widest text-gray-600 flex items-center justify-center">
                            {item.LotNumber || '--'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-0.5 pr-2.5 pb-1.5 pt-0.5">
                <div className="min-h-0 max-h-full overflow-y-auto custom-scrollbar rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-md shadow-gray-200/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Thông tin điều chuyển</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho xuất (nguồn)</label>
                      <div className="w-full h-10 rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3.5 flex items-center text-[10px] font-bold text-gray-800">
                        {transfer.FromLocationName || '--'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho nhận (đích)</label>
                      <div className="w-full h-10 rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3.5 flex items-center text-[10px] font-bold text-gray-800">
                        {transfer.ToLocationName || '--'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ngày tạo phiếu</label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={formatDate(transfer.CreatedAt)}
                            className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-10 bg-gray-100/60 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 outline-none cursor-not-allowed kfc-form-field-shadow"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ngày dự kiến</label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={formatDate(transfer.PlannedDate)}
                            className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-10 bg-gray-100/60 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 outline-none cursor-not-allowed kfc-form-field-shadow"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ghi chú phiếu điều chuyển</label>
                      <input
                        type="text"
                        className="w-full h-10 rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3.5 text-[10px] leading-none font-bold text-gray-800 outline-none"
                        value={transfer.Note || ''}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full px-0.5 pr-2.5 pb-1.5 box-border">
                <div className="w-full rounded-[1.25rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-3 py-2.5 flex flex-col gap-2 box-border min-w-0">
                  <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                    <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap uppercase tracking-[0.08em]">
                      Ngày tạo {formatDate(transfer.CreatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">
                    <div className="flex gap-2 items-baseline min-w-0 justify-between">
                      <span className="text-white/80 uppercase">Số sản phẩm</span>
                      <span className="text-white tabular-nums">{(transfer.Items || []).length}</span>
                    </div>
                    <div className="flex gap-2 items-baseline min-w-0 justify-between">
                      <span className="text-white/80 uppercase">Tổng số lượng điều chuyển</span>
                      <span className="text-white tabular-nums">{totalQty}</span>
                    </div>
                    <div className="flex gap-2 items-baseline min-w-0 justify-between">
                      <span className="text-white/80 uppercase">Trạng thái</span>
                      <span className="text-white">{STATUS_FLOW.find(x => x.key === currentStatus)?.label || currentStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferDetail;
