"use client";
import React from 'react';
import { X, Check, Loader2 } from 'lucide-react';

interface ConfirmReactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  customerEmail?: string;
}

const ConfirmReactivateModal: React.FC<ConfirmReactivateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customerEmail
}) => {
  const [isReactivating, setIsReactivating] = React.useState(false);

  const handleConfirm = async () => {
    setIsReactivating(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error reactivating customer:', error);
    } finally {
      setIsReactivating(false);
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
        <div className="bg-gradient-to-r from-green-600 to-green-800 p-6 text-white relative">
          <h2 className="text-lg font-bold uppercase tracking-widest">
            Xác Nhận Kích Hoạt Lại Khách Hàng
          </h2>

        </div>

        {/* Modal Body */}
        <div className="p-8">
          <div className="text-center space-y-4">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Message */}
            <p className="text-gray-900 text-lg font-medium mb-2">
              Bạn có chắc chắn muốn kích hoạt lại khách hàng này?
            </p>

            {customerEmail && (
              <p className="text-gray-600 text-sm">
                Email: <span className="font-semibold">{customerEmail}</span>
              </p>
            )}

            {/* Info Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                <span className="font-bold">Thông tin:</span> Khách hàng được kích hoạt sẽ xuất hiện trong danh sách và có thể thực hiện các giao dịch bình thường.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-4 bg-gray-50 flex gap-3">
          <button
            type="button"
            disabled={isReactivating}
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={isReactivating}
            onClick={handleConfirm}
            className="flex-[2] py-4 bg-green-600 text-white font-bold rounded-xl text-[10px] uppercase shadow-lg shadow-green-100 hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isReactivating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang Kích Hoạt...
              </>
            ) : (
              'Kích Hoạt Lại'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReactivateModal;
