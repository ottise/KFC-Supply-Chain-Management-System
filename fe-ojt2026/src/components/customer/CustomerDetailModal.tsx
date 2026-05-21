import React, { useCallback } from 'react';
import { X, User, Mail, Phone, MapPin, Activity, Edit, Calendar, Clock, Sparkles } from 'lucide-react';
import type { Customer } from '@/types/customer';
import { formatPhoneNumber } from '@/lib/utils';

// Format date as DD/MM/YYYY HH:mm
const formatShortDate = (dateString: string | null) => {
  if (!dateString) return 'chưa xác định';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onStartEdit?: (customer: Customer) => void;
}

// Memoized status badge component
const StatusBadge = React.memo(({ isActive }: { isActive: boolean }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-sm text-[10px] font-black uppercase tracking-widest ${isActive
      ? 'bg-green-500/10 border-green-500/20 text-green-600'
      : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
      }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-400'}`} />
      {isActive ? 'Đang hoạt động' : 'Ngừng kết nối'}
    </div>
  );
});

StatusBadge.displayName = 'StatusBadge';

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onStartEdit
}) => {
  const handleStartEdit = useCallback(() => {
    if (customer && onStartEdit) {
      onStartEdit(customer);
    }
  }, [customer, onStartEdit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header - Red Theme */}
        <div className="bg-[#E4002B] p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate max-w-[300px]">Hồ Sơ Khách Hàng</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)] mr-1" />
                {customer && <StatusBadge isActive={customer.IsActive} />}
              </div>
            </div>
          </div>
          <button onClick={onClose} type="button" className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
          {customer ? (
            <div className="space-y-8">
              {/* Profile Card */}
              <div className="relative group p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-red-50/30 hover:border-red-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-[#E4002B]" /> Thông tin chính
                </p>
                <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight leading-tight">
                  {customer.CustomerName}
                </h2>
              </div>

              {/* Informational Sections */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-[2px] flex-1 bg-gray-100"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Dữ liệu liên hệ</p>
                  <div className="h-[2px] flex-1 bg-gray-100"></div>
                </div>

                <div className="space-y-6">
                  {/* Email */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#E4002B]" /> Địa chỉ Email
                    </p>
                    <p className="text-sm font-black text-gray-800 px-1">{customer.Email || '---'}</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#E4002B]" /> Số điện thoại
                    </p>
                    <p className="text-sm font-black text-gray-800 px-1">{formatPhoneNumber(customer.Phone) || '---'}</p>
                  </div>

                  {/* Address */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#E4002B]" /> Địa chỉ liên lạc
                    </p>
                    <p className="text-sm font-black text-gray-800 px-1 leading-relaxed">{customer.Address || '---'}</p>
                  </div>
                </div>
              </section>

              {/* Metadata Display */}
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                    Tạo: <span className="text-gray-600 ml-1">{formatShortDate(customer.CreatedAt)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                    Cập nhật: <span className="text-gray-600 ml-1">{formatShortDate(customer.UpdatedAt)}</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <Activity className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Dữ liệu trống</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handleStartEdit}
            disabled={!customer?.IsActive}
            className="px-10 py-3 text-[13px] font-black text-white uppercase bg-[#E4002B] rounded-lg shadow-md shadow-red-200 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            <Edit className="w-4.5 h-4.5" />
            Chỉnh Sửa Hồ Sơ
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailModal;
