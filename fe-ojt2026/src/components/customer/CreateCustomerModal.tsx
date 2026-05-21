import React, { useState, useCallback } from 'react';
import { Mail, Phone, MapPin, X, UserPlus, BadgeCheck, Loader2 } from 'lucide-react';
import type { CreateCustomerRequest } from '@/types/customer';
import { formatPhoneNumber, validateEmail } from '@/lib/utils';


interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateCustomerRequest) => Promise<void>;
}

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [formData, setFormData] = useState<CreateCustomerRequest>({
    email: '',
    name: '',
    phone: '',
    address: '',
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email không hợp lệ (không chứa số sau @)';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên không được để trống';
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!cleanPhone) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]+$/.test(cleanPhone) || cleanPhone.length < 10 || cleanPhone.length > 11) {
      newErrors.phone = 'Số điện thoại phải từ 10-11 số hợp lệ';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Địa chỉ không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        phone: formData.phone.replace(/\s+/g, '')
      };
      await onCreate(payload);
      onClose();
      setFormData({
        email: '',
        name: '',
        phone: '',
        address: '',
        isActive: true
      });
      setErrors({});
    } catch (error) {
      console.error('Error creating customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header - Red Theme */}
        <div className="bg-[#E4002B] p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest leading-none">Thêm Khách Hàng</h2>
              <div className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                Đăng ký khách hàng mới
              </div>
            </div>
          </div>
          <button onClick={onClose} type="button" className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#E4002B]" /> Email Khách Hàng <span className="text-[#E4002B] ml-0.5">*</span>
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
                className={`w-full bg-gray-50 border px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white outline-none transition-all ${errors.email
                  ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-gray-200 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10'
                  }`}
              />
              {errors.email && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 leading-tight">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> {errors.email}
                </p>
              )}
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-[#E4002B]" /> Tên Khách Hàng <span className="text-[#E4002B] ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Họ và tên khách hàng"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
                className={`w-full bg-gray-50 border px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white outline-none transition-all ${errors.name
                  ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-gray-200 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10'
                  }`}
              />
              {errors.name && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 leading-tight">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> {errors.name}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#E4002B]" /> Số Điện Thoại <span className="text-[#E4002B] ml-0.5">*</span>
              </label>
              <input
                type="tel"
                placeholder="0912 345 678"
                value={formData.phone}
                onChange={handlePhoneChange}
                disabled={isSubmitting}
                className={`w-full bg-gray-50 border px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white outline-none transition-all ${errors.phone
                  ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-gray-200 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10'
                  }`}
              />
              {errors.phone && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 leading-tight">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E4002B]" /> Địa Chỉ Liên Hệ <span className="text-[#E4002B] ml-0.5">*</span>
              </label>
              <input
                type="text"
                placeholder="Số nhà, Tên đường, Quận/Huyện..."
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={isSubmitting}
                className={`w-full bg-gray-50 border px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white outline-none transition-all ${errors.address
                  ? 'border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-gray-200 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10'
                  }`}
              />
              {errors.address && (
                <p className="text-[11px] font-bold text-red-500 mt-1.5 flex items-center gap-1.5 leading-tight">
                  <div className="w-1 h-1 bg-red-500 rounded-full" /> {errors.address}
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-end shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-3 text-[13px] font-black text-white uppercase bg-[#E4002B] rounded-lg shadow-md shadow-red-200 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                Đang xử lý...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-white" />
                Tạo Mới Khách Hàng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomerModal;
