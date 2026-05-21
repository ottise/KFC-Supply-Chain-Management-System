"use client";
import React, { useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { maintenanceApi } from '@/lib/api/admin/maintenanceApi';
import type { MaintenanceResponse } from '@/types/maintenance';
import CustomDatePicker from './CustomDatePicker';

// Helper functions
const parseLocalDateTime = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [datePart, timePart] = dateStr.split('T');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

const toLocalDateTimeString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

interface Props {
  data: MaintenanceResponse;
  onClose: () => void;
  onUpdated?: () => void;
}

const MaintDetailBox: React.FC<Props> = ({ data, onClose, onUpdated }) => {
  const toast = useToast();
  const [reason, setReason] = useState(data.reason);
  const [startTime, setStartTime] = useState<Date>(new Date(data.startTime));
  const [endTime, setEndTime] = useState<Date>(new Date(data.endTime));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Handle close - warn if there are unsaved changes
  const handleClose = () => {
    if (hasChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  // Check if there are actual changes
  const hasChanges = () => {
    const originalStart = new Date(data.startTime);
    const originalEnd = new Date(data.endTime);
    return (
      reason !== data.reason ||
      startTime.getTime() !== originalStart.getTime() ||
      endTime.getTime() !== originalEnd.getTime()
    );
  };

  const handleUpdate = async () => {
    if (!reason.trim()) {
      toast.error('Lỗi Dữ Liệu', 'Nội dung bảo trì không được để trống.');
      return;
    }

    if (endTime <= startTime) {
      toast.error('Lỗi Dữ Liệu', 'Thời gian kết thúc phải sau thời gian bắt đầu.');
      return;
    }

    if (!hasChanges()) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await maintenanceApi.updateMaintenance(data.id, {
        reason,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: data.status,
      });

      toast.success('Cập Nhật Thành Công', 'Phiếu bảo trì đã được cập nhật thành công.');
      onUpdated?.();
    } catch (error: unknown) {
      console.error('[MaintDetailBox] Update error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật.';
      toast.error('Lỗi Cập Nhật', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await maintenanceApi.cancelMaintenance(data.id);
      toast.success('Hủy Phiếu Thành Công', 'Phiếu bảo trì đã được hủy.');
      setShowDeleteConfirm(false);
      onUpdated?.();
    } catch (error: unknown) {
      console.error('[MaintDetailBox] Delete error:', error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Đã xảy ra lỗi khi hủy phiếu.';
      toast.error('Lỗi Hủy Phiếu', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden relative my-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F] p-8 text-white relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-red-100 uppercase tracking-[0.2em]">Phiếu Bảo Trì</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-bold">{data.id}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">Chi Tiết & Cập Nhật</h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-all p-2 hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="p-8 space-y-6 scale-[0.98] origin-top" onSubmit={(e) => e.preventDefault()}>

          {/* Section: Content - Lý Do */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Lý Do / Ghi Chú
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none text-sm font-medium border-2 border-transparent focus:border-red-200 focus:bg-white resize-none transition-all"
              placeholder="Nhập lý do hoặc ghi chú cập nhật..."
            />
          </div>

          {/* Section: Execution Time with CustomDatePicker */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4 text-[#E4002B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thời Gian Thực Hiện
            </label>
            <div className="grid grid-cols-2 gap-4">
              <CustomDatePicker
                label="Bắt Đầu"
                value={startTime ? toLocalDateTimeString(startTime) : ''}
                onChange={(val) => {
                  const parsed = parseLocalDateTime(val);
                  if (parsed) setStartTime(parsed);
                }}
                placeholder="Bắt Đầu"
              />
              <CustomDatePicker
                label="Kết Thúc"
                value={endTime ? toLocalDateTimeString(endTime) : ''}
                onChange={(val) => {
                  const parsed = parseLocalDateTime(val);
                  if (parsed) setEndTime(parsed);
                }}
                placeholder="Kết Thúc"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl text-[11px] uppercase tracking-widest hover:bg-red-100 transition-all cursor-pointer"
            >
              Hủy Phiếu
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || isDeleting}
                className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={isSubmitting || isDeleting}
                className="px-8 py-3 bg-gradient-to-r from-[#E4002B] to-[#B8001F] text-white font-bold rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-red-200/50 hover:shadow-red-300/50 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang Xử Lý...
                  </>
                ) : 'Cập Nhật'}
              </button>
            </div>
          </div>
        </form>

        {/* Discard Changes Confirmation Modal */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[2rem]">
            <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Có Thay Đổi Chưa Lưu</h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn đã thay đổi nhưng chưa lưu. Nếu đóng bây giờ, các thay đổi sẽ bị mất.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Ở Lại
                </button>
                <button
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    onClose();
                  }}
                  className="flex-1 px-6 py-3 bg-yellow-500 text-white font-bold rounded-2xl hover:bg-yellow-600 transition-colors cursor-pointer"
                >
                  Đóng & Mất Thay Đổi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[2rem]">
            <div className="bg-white rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Hủy Phiếu Bảo Trì?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Phiếu bảo trì sẽ được đánh dấu là &quot;Đã Hủy&quot;. Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Không, Giữ Lại
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang Hủy...
                    </>
                  ) : 'Có, Hủy Phiếu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintDetailBox;
