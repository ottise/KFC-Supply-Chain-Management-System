"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Warehouse, Loader2, Plus } from "lucide-react";
import type { Warehouse as WarehouseType } from "@/types/warehouse/warehouse";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";

interface CreateData {
  Name: string;
  WarehouseCode: string;
  Address?: string;
  Phone?: string;
  Email?: string;
  WarehouseType?: string;
  AreaSqm?: number;
  Notes?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  warehouse?: WarehouseType | null;
}

export default function WarehouseForm({
  isOpen,
  onClose,
  onSave,
  isLoading,
  error: externalError,
  warehouse,
}: Props) {
  const isEditMode = !!warehouse;
  const { user } = useAuthContext();
  const { error: showError, success: showSuccess } = useToast();

  const [formData, setFormData] = useState<CreateData>(() => {
    if (warehouse) {
      return {
        Name: warehouse.Name || "",
        WarehouseCode: warehouse.WarehouseCode || "",
        Address: warehouse.Address || "",
        Phone: warehouse.Phone || "",
        Email: warehouse.Email || "",
        WarehouseType: warehouse.WarehouseType || "",
        AreaSqm: warehouse.AreaSqm || undefined,
        Notes: warehouse.Notes || "",
      };
    }
    return {
      Name: "",
      WarehouseCode: "",
      Address: "",
      Phone: "",
      Email: "",
      WarehouseType: "",
      AreaSqm: undefined,
      Notes: "",
    };
  });

  const [isClosing, setIsClosing] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  // Validation
  const validateForm = (): string | null => {
    // WarehouseCode validation
    if (!formData.WarehouseCode.trim()) {
      return "Mã kho là bắt buộc";
    }
    if (formData.WarehouseCode.length > 15) {
      return "Mã kho không được vượt quá 15 ký tự";
    }
    if (!/^[A-Za-z0-9-_]+$/.test(formData.WarehouseCode)) {
      return "Mã kho chỉ chứa chữ cái, số và dấu gạch ngang (-)";
    }

    // Name validation
    if (!formData.Name.trim()) {
      return "Tên kho là bắt buộc";
    }
    if (formData.Name.length > 255) {
      return "Tên kho không được vượt quá 255 ký tự";
    }

    // Email validation (if provided)
    if (formData.Email && formData.Email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.Email)) {
        return "Email không hợp lệ";
      }
      if (formData.Email.length > 255) {
        return "Email không được vượt quá 255 ký tự";
      }
    }

    // Phone validation (if provided) - Vietnamese phone format
    if (formData.Phone && formData.Phone.trim()) {
      const phoneRegex = /^(0[0-9]{9,10})$/;
      if (!phoneRegex.test(formData.Phone.replace(/\s/g, ""))) {
        return "Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0)";
      }
    }

    // Address length
    if (formData.Address && formData.Address.length > 500) {
      return "Địa chỉ không được vượt quá 500 ký tự";
    }

    // WarehouseType length
    if (formData.WarehouseType && formData.WarehouseType.length > 100) {
      return "Loại kho không được vượt quá 100 ký tự";
    }

    // AreaSqm validation
    if (formData.AreaSqm !== undefined && formData.AreaSqm < 0) {
      return "Diện tích phải là số dương";
    }

    return null;
  };

  // Focus name field when form opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setFormData({
        Name: "",
        WarehouseCode: "",
        Address: "",
        Phone: "",
        Email: "",
        WarehouseType: "",
        AreaSqm: undefined,
        Notes: "",
      });
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationError = validateForm();
    if (validationError) {
      showError("Lỗi validation", validationError);
      return;
    }

    try {
      // Auto-set ManagerId = current user.id when creating new warehouse
      const dataToSave = isEditMode
        ? formData
        : { ...formData, ManagerId: user?.id ? Number(user.id) : undefined };

      await onSave(dataToSave);
      showSuccess(
        isEditMode ? "Thành công" : "Thành công",
        isEditMode ? "Kho đã được cập nhật" : "Kho đã được tạo mới"
      );
      handleClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err instanceof Object && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Có lỗi xảy ra khi lưu kho"
          : "Có lỗi xảy ra khi lưu kho";
      showError("Lỗi", errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
        <form
          onSubmit={handleSubmit}
          className={`relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] ${
            isClosing ? "animate-out fade-out zoom-out-95 duration-200" : ""
          }`}
        >
          {/* Header - KFC Red */}
          <div className="bg-[#E4002B] text-white px-8 py-5 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  {isEditMode ? "Chỉnh sửa kho" : "Thêm kho mới"}
                </h2>
                <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                  {isEditMode ? "Cập nhật thông tin kho" : "Tạo mới kho hàng"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="hover:rotate-90 transition-all p-2 hover:bg-white/10 rounded-lg"
              aria-label="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto flex-1">
            {/* Page Title */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                {isEditMode ? "Cập nhật thông tin kho hàng" : "Nhập thông tin kho hàng mới"}
              </p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* WarehouseCode */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Mã kho <span className="text-red-500">*</span>
                </label>
                <input
                  ref={codeRef}
                  type="text"
                  className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm uppercase"
                  placeholder="VD: WH-HCM-01"
                  value={formData.WarehouseCode}
                  onChange={(e) =>
                    setFormData({ ...formData, WarehouseCode: e.target.value.toUpperCase() })
                  }
                  maxLength={15}
                />
                <p className="text-[9px] text-gray-400">Tối đa 15 ký tự, không dấu</p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  Tên kho <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                  placeholder="VD: Kho Hồ Chí Minh"
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData({ ...formData, Name: e.target.value })
                  }
                  maxLength={255}
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                  placeholder="VD: 123 Nguyễn Huệ, Q1, TP.HCM"
                  value={formData.Address}
                  onChange={(e) =>
                    setFormData({ ...formData, Address: e.target.value })
                  }
                  maxLength={500}
                />
              </div>

              {/* WarehouseType */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Loại kho
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                  placeholder="VD: Kho chính, Kho phụ"
                  value={formData.WarehouseType}
                  onChange={(e) =>
                    setFormData({ ...formData, WarehouseType: e.target.value })
                  }
                  maxLength={100}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                  placeholder="VD: 0909123456"
                  value={formData.Phone}
                  onChange={(e) =>
                    setFormData({ ...formData, Phone: e.target.value })
                  }
                  maxLength={50}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                  placeholder="VD: kho.hcm@kfc.com"
                  value={formData.Email}
                  onChange={(e) =>
                    setFormData({ ...formData, Email: e.target.value })
                  }
                  maxLength={255}
                />
              </div>

              {/* AreaSqm */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Diện tích (m²)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                    placeholder="VD: 500"
                    value={formData.AreaSqm || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        AreaSqm: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                    m²
                  </span>
                </div>
              </div>
            </div>

            {/* Notes - Full width */}
            <div className="mt-5 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Ghi chú
              </label>
              <textarea
                className="w-full bg-white border border-gray-200 px-5 py-3.5 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm resize-none"
                placeholder="Nhập ghi chú về kho (nếu có)..."
                rows={3}
                value={formData.Notes}
                onChange={(e) =>
                  setFormData({ ...formData, Notes: e.target.value })
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all active:scale-95 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3.5 bg-[#E4002B] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {isEditMode ? "Lưu thay đổi" : "Thêm kho mới"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
