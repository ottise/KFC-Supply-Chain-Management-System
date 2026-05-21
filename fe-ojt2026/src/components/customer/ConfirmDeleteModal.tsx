"use client";
import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  customerEmail?: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customerEmail
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting customer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white relative">
          <h2 className="text-lg font-bold uppercase tracking-widest">
            Xác Nhận Xóa Khách Hàng
          </h2>

        </div>

        {/* Modal Body */}
        <div className="p-8">
          <div className="text-center space-y-4">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            {/* Warning Message */}
            <p className="text-gray-900 text-lg font-medium mb-2">
              Bạn có chắc chắn muốn xóa khách hàng này?
            </p>

            {customerEmail && (
              <p className="text-gray-600 text-sm">
                Email: <span className="font-semibold">{customerEmail}</span>
              </p>
            )}

            {/* Warning Note */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                <span className="font-bold">Lưu ý:</span> Khách hàng bị xóa sẽ chuyển sang trạng thái "Ngừng hoạt động" và không còn được tìm thấy trong danh sách tìm kiếm. Tuy nhiên, dữ liệu vẫn được lưu trong hệ thống.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-4 bg-gray-50 flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirm}
            className="flex-[2] py-4 bg-red-600 text-white font-bold rounded-xl text-[10px] uppercase shadow-lg shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang Xóa...
              </>
            ) : (
              'Xóa Khách Hàng'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
