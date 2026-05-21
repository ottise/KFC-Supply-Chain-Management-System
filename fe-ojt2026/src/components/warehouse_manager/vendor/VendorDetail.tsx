import { useState } from "react";
import type { Supplier } from "@/types/warehouse/partners";
import { X, Users, Mail, Phone, MapPin, Globe, Edit, Trash2, ShieldCheck, ShieldAlert, Save } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface VendorDetailProps {
  supplier: Supplier;
  onClose: () => void;
  onUpdate: (id: number, data: Partial<Supplier>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleStatus: (id: number, currentlyActive: boolean) => Promise<void>;
  isUpdating?: boolean;
  updateError?: string | null;
}

export default function VendorDetail({
  supplier,
  onClose,
  onUpdate,
  onDelete,
  onToggleStatus,
  isUpdating = false,
  updateError = null
}: VendorDetailProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    Name: supplier.Name,
    ContactPerson: supplier.ContactPerson || "",
    Phone: supplier.Phone || "",
    Email: supplier.Email || "",
    Address: supplier.Address || "",
  });
  const [localError, setLocalError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);

  const handleSave = async () => {
    setLocalError(null);

    // Validation
    if (!formData.Name.trim()) {
      setLocalError("Tên nhà cung ứng không được để trống");
      return;
    }

    try {
      await onUpdate(supplier.Id, {
        Name: formData.Name,
        ContactPerson: formData.ContactPerson || undefined,
        Phone: formData.Phone || undefined,
        Email: formData.Email || undefined,
        Address: formData.Address || undefined,
      });
      setIsEditing(false);
    } catch {
      // Error is handled by parent component
    }
  };

  const handleCancel = () => {
    setFormData({
      Name: supplier.Name,
      ContactPerson: supplier.ContactPerson || "",
      Phone: supplier.Phone || "",
      Email: supplier.Email || "",
      Address: supplier.Address || "",
    });
    setIsEditing(false);
    setLocalError(null);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      await onDelete(supplier.Id);
      onClose();
    } catch {
      // Error is handled by parent component
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setShowStatusConfirm(true);
  };

  const handleConfirmToggleStatus = async () => {
    setShowStatusConfirm(false);
    setIsTogglingStatus(true);
    try {
      await onToggleStatus(supplier.Id, supplier.IsActive);
    } catch {
      // Error is handled by parent component
    } finally {
      setIsTogglingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header - Red Theme */}
        <div className="bg-[#E4002B] p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">Chi tiết nhà cung cấp</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border backdrop-blur-sm text-[9px] font-black uppercase tracking-widest ${supplier.IsActive ? 'bg-green-500/20 border-green-500/30 text-green-100' : 'bg-gray-500/20 border-gray-500/30 text-gray-100'
                  }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${supplier.IsActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  {supplier.IsActive ? 'Đang hoạt động' : 'Ngừng kết nối'}
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
          {/* Error Messages */}
          {(updateError || localError) && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-[12px] font-bold text-red-600 flex items-start gap-3 leading-tight animate-in slide-in-from-top-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-sm shadow-red-500/50" />
              <span>{updateError || localError}</span>
            </div>
          )}

          {/* Nội dung chính: Tên nhà cung ứng */}
          <div className="relative group p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-red-50/30 hover:border-red-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Tên pháp nhân</p>
            {isEditing ? (
              <input
                className="w-full text-2xl font-black uppercase text-gray-900 tracking-tight bg-white border-b-2 border-[#E4002B] outline-none px-2 py-1 rounded-t-lg transition-all"
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                disabled={isUpdating}
                autoFocus
              />
            ) : (
              <h2 className="text-2xl font-black uppercase text-gray-900 tracking-tight leading-tight">
                {formData.Name}
              </h2>
            )}
            {!isEditing && (
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Edit className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Section: Thông tin liên hệ */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-gray-100"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Thông tin liên hệ</p>
                <div className="h-[2px] flex-1 bg-gray-100"></div>
              </div>

              <div className="space-y-6">
                {[
                  { label: "Email đối tác", key: "Email", icon: Mail },
                  { label: "Điện thoại", key: "Phone", icon: Phone },
                  { label: "Địa chỉ kinh doanh", key: "Address", icon: MapPin },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <field.icon className="w-3.5 h-3.5 text-[#E4002B]" /> {field.label}
                    </p>
                    {isEditing ? (
                      <input
                        className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] outline-none transition-all"
                        value={(formData as Record<string, string>)[field.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        disabled={isUpdating}
                      />
                    ) : (
                      <p className="text-sm font-black text-gray-800 px-1 leading-relaxed">{(formData as Record<string, string>)[field.key] || '---'}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Người đại diện */}
            <section className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-[2px] flex-1 bg-gray-100"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Người phụ trách</p>
                <div className="h-[2px] flex-1 bg-gray-100"></div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#E4002B]" /> Họ & Tên đại diện
                </p>
                {isEditing ? (
                  <input
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] outline-none transition-all"
                    value={formData.ContactPerson}
                    onChange={(e) => setFormData({ ...formData, ContactPerson: e.target.value })}
                    disabled={isUpdating}
                  />
                ) : (
                  <p className="text-sm font-black text-gray-800 px-1 leading-relaxed">{formData.ContactPerson || '---'}</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-between items-center shrink-0">
          <div className="flex gap-3">
            {!isEditing && (
              <button
                onClick={handleToggleStatus}
                disabled={isTogglingStatus}
                className={`p-2.5 rounded-xl border transition-all ${supplier.IsActive
                  ? 'bg-orange-50 border-orange-100 text-orange-500 hover:bg-orange-100'
                  : 'bg-green-50 border-green-100 text-green-500 hover:bg-green-100'
                  }`}
                title={supplier.IsActive ? "Tạm ngắt kết nối" : "Kích hoạt lại đối tác"}
              >
                {supplier.IsActive ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </button>
            )}
            {!isEditing && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2.5 bg-red-50 border border-red-100 text-[#E4002B] rounded-xl hover:bg-red-100 transition-all"
                title="Xóa nhà cung cấp"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-8 py-2.5 bg-red-500 text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg"
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2.5 text-[11px] font-black text-gray-500 uppercase hover:text-gray-900 transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="px-10 py-2.5 bg-[#E4002B] text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-md shadow-red-200"
                >
                  {isUpdating ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa nhà cung ứng "${supplier.Name}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={showStatusConfirm}
        title="Xác nhận thay đổi trạng thái"
        message={`Bạn có chắc chắn muốn ${supplier.IsActive ? "ngừng hoạt động" : "kích hoạt lại"} nhà cung ứng này?`}
        confirmText={supplier.IsActive ? "Ngừng hoạt động" : "Kích hoạt"}
        cancelText="Hủy bỏ"
        type="warning"
        isLoading={isTogglingStatus}
        onConfirm={handleConfirmToggleStatus}
        onCancel={() => setShowStatusConfirm(false)}
      />
    </div>
  );
}