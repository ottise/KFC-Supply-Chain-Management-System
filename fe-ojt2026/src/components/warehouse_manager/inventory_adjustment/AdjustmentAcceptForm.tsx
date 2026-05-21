import React, { useState } from 'react';
import { X, Calendar, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
  itemCount: number;
}

const AdjustmentAcceptForm: React.FC<Props> = ({ onClose, onConfirm, itemCount }) => {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col scale-in-center border border-white/20">
        <div className="bg-[#E4002B] p-7 text-white relative shadow-[0_4px_15px_rgba(228,0,43,0.2)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest">Xác nhận</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Hoàn tất {itemCount} mặt hàng</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute right-8 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2 bg-white/10 rounded-xl">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 space-y-8 text-center">
          <p className="text-sm font-bold text-gray-600">
            Bạn có chắc chắn muốn xác nhận và hoàn tất số liệu kiểm kê cho các mặt hàng đã chọn?
          </p>

          <div className="pt-4 flex gap-4">
            <button
              onClick={() => onConfirm()}
              className="flex-[2] py-4 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentAcceptForm;
