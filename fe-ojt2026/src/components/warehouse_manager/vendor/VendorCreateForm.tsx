import { useState } from "react";
import type { CreateSupplierRequest } from "@/types/warehouse/partners";
import { X, UserPlus, Mail, Phone, MapPin, BadgeCheck, Globe } from "lucide-react";

interface VendorCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateSupplierRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export default function VendorCreateForm({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  error = null
}: VendorCreateFormProps) {
  const [formData, setFormData] = useState<CreateSupplierRequest>({
    Name: "",
    ContactPerson: "",
    Phone: "",
    Email: "",
    Address: ""
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setValidationError(null);

    // Validation
    if (!formData.Name.trim()) {
      setValidationError("Tên nhà cung ứng không được để trống");
      return;
    }

    try {
      await onSave(formData);
    } catch {
      // Error is handled by parent component
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
              <h2 className="text-xl font-black uppercase tracking-widest">Thêm nhà cung cấp</h2>
              <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-1">Hệ thống đối tác chiến lược</p>
            </div>
          </div>
          <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white">
          {/* Error Messages */}
          {(error || validationError) && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[12px] font-bold text-red-600 flex items-start gap-3 leading-tight animate-in slide-in-from-top-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-sm shadow-red-500/50" />
              <span>{error || validationError}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-[#E4002B]" /> Tên nhà cung ứng <span className="text-[#E4002B]">*</span>
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 placeholder:text-gray-400"
                value={formData.Name}
                onChange={e => setFormData({ ...formData, Name: e.target.value })}
                placeholder="Nhập tên đối tác/công ty..."
                disabled={isLoading}
              />
            </div>

            {/* Email & Phone Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#E4002B]" /> Email
                </label>
                <input
                  type="email"
                  className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 placeholder:text-gray-400"
                  value={formData.Email || ""}
                  onChange={e => setFormData({ ...formData, Email: e.target.value })}
                  placeholder="partner@example.com"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#E4002B]" /> Số điện thoại
                </label>
                <input
                  className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 placeholder:text-gray-400"
                  value={formData.Phone || ""}
                  onChange={e => setFormData({ ...formData, Phone: e.target.value })}
                  placeholder="0987 XXX XXX"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E4002B]" /> Địa chỉ kinh doanh
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 placeholder:text-gray-400"
                value={formData.Address || ""}
                onChange={e => setFormData({ ...formData, Address: e.target.value })}
                placeholder="Số nhà, Tên đường, Quận/Huyện..."
                disabled={isLoading}
              />
            </div>

            {/* Contact Person */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#E4002B]" /> Người đại diện liên hệ
              </label>
              <input
                className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 placeholder:text-gray-400"
                value={formData.ContactPerson || ""}
                onChange={e => setFormData({ ...formData, ContactPerson: e.target.value })}
                placeholder="Họ và tên người đại diện..."
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end shrink-0">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-10 py-3 text-[13px] font-black text-white uppercase bg-[#E4002B] rounded-lg shadow-md shadow-red-200 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-white" />
                Lưu nhà cung ứng
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}