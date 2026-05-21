/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X, Printer, Play, XCircle, Trash2, Loader2 } from 'lucide-react';
import type { ScrapOrderListItem, ScrapOrderDetail, ScrapStatus } from '@/types/warehouse/scrap';
import { useToast } from '@/components/ui/ToastProvider';

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: 'Nháp', bg: 'bg-gray-100', text: 'text-gray-600' },
  ready: { label: 'Sẵn sàng', bg: 'bg-blue-50', text: 'text-blue-600' },
  done: { label: 'Hoàn tất', bg: 'bg-green-50', text: 'text-green-600' },
  cancelled: { label: 'Đã hủy', bg: 'bg-red-50', text: 'text-red-500' },
};

interface Props {
  scrap: ScrapOrderListItem;
  onClose: () => void;
  onGetDetail: (id: number) => Promise<ScrapOrderDetail | null>;
  onCheckAvailability: (id: number) => Promise<{ success: boolean; failData?: any[] }>;
  onComplete: (id: number) => Promise<boolean>;
  onCancel: (id: number) => Promise<boolean>;
  onDelete: (id: number) => Promise<boolean>;
  onEdit?: (scrap: ScrapOrderListItem) => void;
  actionLoading: boolean;
}

function parseApiDate(dateStr?: string) {
  if (!dateStr) return null;
  const raw = dateStr.trim().replace(' ', 'T');
  const hasTimezone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw);
  const normalized = hasTimezone ? raw : `${raw}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(dateStr?: string) {
  const d = parseApiDate(dateStr);
  if (!d) return '—';
  return d.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ScrapDetail({
  scrap, onClose, onGetDetail,
  onCheckAvailability, onComplete, onCancel, onDelete, onEdit,
  actionLoading,
}: Props) {
  const [detail, setDetail] = useState<ScrapOrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const load = async () => {
      setLoadingDetail(true);
      try {
        const data = await onGetDetail(scrap.Id);
        setDetail(data);
      } catch (err) {
        console.error('Error in ScrapDetail load:', err);
      } finally {
        setLoadingDetail(false);
      }
    };
    load();
  }, [scrap.Id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rawStatus = (detail?.Status || scrap.Status || 'draft') as string;
  const status = rawStatus.toLowerCase() as ScrapStatus;

  interface ActionResponse {
    success: boolean;
    failData?: any[];
  }

  const handleAction = async (
    action: () => Promise<boolean | ActionResponse>,
    isCheckAvailability = false,
    successMessage?: string
  ) => {
    const result = await action();
    const success = typeof result === 'boolean' ? result : result.success;

    if (success) {
      if (isCheckAvailability) {
        const load = async () => {
          setLoadingDetail(true);
          try {
            const data = await onGetDetail(scrap.Id);
            setDetail(data);
          } finally {
            setLoadingDetail(false);
          }
        };
        load();
      } else {
        if (successMessage) {
          toast.success(successMessage);
        }
        onClose();
      }
    }
  };

  // Derived summary values
  const totalItems = detail?.Items?.length ?? 0;
  const totalQty = detail?.Items?.reduce((sum, it) => sum + (Number(it.Quantity) || 0), 0) ?? 0;

  const statusSteps = [
    { key: 'draft', label: 'Nháp' },
    { key: 'ready', label: 'Sẵn sàng' },
    { key: 'done', label: 'Hoàn tất' },
  ];
  const isTerminal = status === 'done' || status === 'cancelled';

  // Status label for summary card
  const summaryStatusLabel = STATUS_MAP[status]?.label ?? String(scrap.Status ?? '—');

  const modalContent = (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" aria-hidden="true" />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-3 animate-in zoom-in-95 duration-200 pointer-events-none overflow-y-auto overscroll-contain">
        <div className="bg-white rounded-[2rem] border border-[#E4002B]/30 shadow-sm w-[1100px] max-w-[96vw] h-[min(88vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] min-h-0 flex flex-col pointer-events-auto overflow-hidden animate-in fade-in duration-300 my-auto">

          {/* ── Header đỏ ── */}
          <div className="relative z-[2] shrink-0 px-5 py-2 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-1.5 shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
                Phiếu tiêu hủy phế phẩm
              </p>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-0.5">
                {scrap.ScrapNo}
              </h2>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">
                Chi tiết đơn loại bỏ phế phẩm
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-2 right-5 shrink-0 p-2.5 rounded-xl border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-all"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Status steps */}
            <div className="flex flex-wrap justify-center items-center gap-2">
              {statusSteps.map((step, idx) => {
                const isActive = status === step.key || (status === 'cancelled' && step.key === 'draft');
                return (
                  <React.Fragment key={step.key}>
                    {idx > 0 && <span className="text-white/50 text-xs font-light">›</span>}
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${
                        isActive
                          ? 'bg-white text-[#E4002B] border-white shadow-md'
                          : 'bg-white/10 text-white/80 border-white/30'
                      }`}
                    >
                      {step.label}
                    </span>
                  </React.Fragment>
                );
              })}
              {status === 'cancelled' && (
                <>
                  <span className="text-white/50 text-xs font-light">›</span>
                  <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border bg-white text-[#E4002B] border-white shadow-md">
                    Đã hủy
                  </span>
                </>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5">
            {loadingDetail ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-4">
                <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đang tải chi tiết đơn hàng...</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-4 overflow-hidden">

                {/* LEFT: Bảng sản phẩm tiêu hủy */}
                <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
                  <div className="shrink-0 flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Sản phẩm tiêu hủy</h4>
                    </div>
                    {detail?.Items && detail.Items.length > 0 && (
                      <div className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                        {detail.Items.length} mặt hàng
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    {detail?.Items && detail.Items.length > 0 ? (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest">Sản phẩm</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center w-[160px]">Mã lô</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center w-[100px]">Số lượng</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest w-[160px]">Lý do</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {detail.Items.map((item) => (
                            <tr key={item.Id} className="hover:bg-red-50/20 transition-colors">
                              <td className="px-4 py-4">
                                <p className="text-xs font-bold text-gray-900 mb-0.5">{item.ProductName || `Product #${item.ProductId}`}</p>
                                <code className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">SKU: {item.ProductCode || `#${item.ProductId}`}</code>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="px-3 py-1 bg-red-50 text-[#E4002B] text-[10px] font-black rounded-lg border border-red-100 shadow-sm inline-block min-w-[100px]">
                                  {item.LotNumber || `Lot #${item.LotId}`}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <p className="text-sm font-black text-gray-900">{item.Quantity}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">{item.UomName || '—'}</p>
                              </td>
                              <td className="px-4 py-4">
                                <p className="text-[11px] font-bold text-gray-500 leading-snug line-clamp-2 italic">
                                  {item.Reason ? `"${item.Reason}"` : '—'}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-10 gap-3">
                        <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                          <XCircle className="w-7 h-7 text-gray-200" />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Không có sản phẩm</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Thông tin + Summary + Actions */}
                <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">

                  {/* Thông tin chi tiết (scroll) */}
                  <div className="flex-1 min-h-0 min-w-0 overflow-y-auto px-0.5 pr-2.5 pb-1.5 pt-0.5 custom-scrollbar space-y-3">
                    {/* Trạng thái & Người tạo */}
                    <div className="bg-gray-50/50 p-4 rounded-[1.5rem] border border-gray-100 flex justify-between items-center shadow-sm">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Người tạo</label>
                        {detail?.CreatedByName ? (
                          <span className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-black rounded-xl">
                            {detail.CreatedByName}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-gray-400">—</span>
                        )}
                      </div>
                      <div className="text-right">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Ngày tạo</label>
                        <p className="text-xs font-black text-gray-900">{formatDateTime(detail?.CreatedAt)}</p>
                      </div>
                    </div>

                    {/* Tuyến đường kho */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                            <Play className="w-3.5 h-3.5" />
                          </div>
                          <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Vị trí nguồn</label>
                        </div>
                        <p className="text-xs font-black text-gray-900 mb-1">{detail?.LocationName || `Location #${detail?.LocationId}`}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{detail?.WarehouseName || `Warehouse #${detail?.WarehouseId}`}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-red-50 text-red-600 rounded-xl">
                            <XCircle className="w-3.5 h-3.5" />
                          </div>
                          <label className="text-[9px] font-black text-red-600 uppercase tracking-widest">Vị trí phế phẩm</label>
                        </div>
                        <p className="text-xs font-black text-gray-900 mb-1">{detail?.ToLocationName || 'SCRAP'}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Khu vực tiêu hủy</p>
                        </div>
                      </div>
                    </div>

                    {/* Timestamps */}
                    {(detail?.ConfirmedAt || detail?.CompletedAt) && (
                      <div className="flex gap-3">
                        {detail?.ConfirmedAt && (
                          <div className="flex-1 p-4 bg-blue-50/20 rounded-2xl border border-blue-100/50">
                            <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Xác nhận lúc</label>
                            <p className="text-[10px] font-black text-blue-900">{formatDateTime(detail.ConfirmedAt)}</p>
                          </div>
                        )}
                        {detail?.CompletedAt && (
                          <div className="flex-1 p-4 bg-green-50/20 rounded-2xl border border-green-100/50">
                            <label className="text-[9px] font-black text-green-400 uppercase tracking-widest block mb-1">Hoàn thành lúc</label>
                            <p className="text-[10px] font-black text-green-900">{formatDateTime(detail.CompletedAt)}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary card đỏ + Actions */}
                  <div className="shrink-0 w-full px-0.5 pr-2.5 pb-1.5 box-border">
                    <div className="w-full rounded-[1.25rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-3 py-2.5 flex flex-col gap-2 box-border min-w-0">
                      {/* Summary header */}
                      <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                        <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap uppercase tracking-[0.08em]">
                          {formatDateTime(detail?.CreatedAt).split(' ')[1] ?? '—'}
                        </p>
                      </div>

                      {/* Summary rows */}
                      <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">
                        <div className="flex gap-2 items-baseline min-w-0">
                          <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                          <div className="flex flex-1 min-w-0 justify-between gap-2">
                            <span className="text-white/80 uppercase">Số mặt hàng</span>
                            <span className="text-white tabular-nums">{totalItems}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-baseline min-w-0">
                          <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                          <div className="flex flex-1 min-w-0 justify-between gap-2">
                            <span className="text-white/80 uppercase">Tổng số lượng</span>
                            <span className="text-white tabular-nums">{totalQty}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-baseline min-w-0">
                          <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                          <div className="flex flex-1 min-w-0 justify-between gap-2">
                            <span className="text-white/80 uppercase">Trạng thái</span>
                            <span className="text-white text-right truncate max-w-[55%]">{summaryStatusLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="shrink-0 pt-1.5 border-t border-white/15">
                        {status === 'draft' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleAction(() => onCheckAvailability(scrap.Id), true)}
                              disabled={actionLoading}
                              className="flex-[2] basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-current" /> : <Play className="w-3.5 h-3.5 text-current" />}
                              Kiểm tra tồn kho
                            </button>
                            {onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(scrap)}
                                disabled={actionLoading}
                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                              >
                                Điều chỉnh
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAction(() => onDelete(scrap.Id))}
                              disabled={actionLoading}
                              className="shrink-0 w-8 h-8 text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50 flex items-center justify-center"
                              title="Xóa đơn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {status === 'ready' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleAction(() => onComplete(scrap.Id), false, 'Hoàn thành đơn thành công')}
                              disabled={actionLoading}
                              className="flex-[2] basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-current" /> : <CheckCircle2 className="w-3.5 h-3.5 text-current" />}
                              Xác nhận hoàn thành
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(() => onCancel(scrap.Id))}
                              disabled={actionLoading}
                              className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                            >
                              Hủy đơn
                            </button>
                          </div>
                        )}

                        {isTerminal && (
                          <button
                            type="button"
                            className="w-full min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white/90 rounded-full border border-white opacity-100 cursor-not-allowed flex items-center justify-center gap-1.5"
                            disabled
                          >
                            <Printer className="w-3.5 h-3.5 text-current" />
                            In phiếu kho
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}