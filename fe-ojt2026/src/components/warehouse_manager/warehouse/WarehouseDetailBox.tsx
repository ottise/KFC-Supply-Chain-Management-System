"use client";

import React, { useState, useEffect } from "react";
import { X, Warehouse, MapPin, Phone, Mail, Building2, User, Calendar, Edit2, Trash2 } from "lucide-react";
import type { Warehouse as WarehouseType } from "@/types/warehouse/warehouse";
import { userApi } from "@/lib/api/admin/userApi";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface Props {
  warehouse: WarehouseType;
  close: () => void;
  onUpdate: () => void;
  onEdit: (warehouse: WarehouseType) => void;
  onDelete: (id: number) => Promise<{ message: string }>;
}

export default function WarehouseDetailBox({
  warehouse,
  close,
  onUpdate,
  onEdit,
  onDelete,
}: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { success, error: showError } = useToast();

  // Fetch manager name by ManagerId
  useEffect(() => {
    const fetchManagerName = async () => {
      if (warehouse.ManagerId) {
        try {
          const user = await userApi.getUserById(warehouse.ManagerId);
          setManagerName(user.Fullname || (warehouse.ManagerId ? `#${warehouse.ManagerId}` : null));
        } catch {
          setManagerName(null);
        }
      }
    };
    fetchManagerName();
  }, [warehouse.ManagerId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => close(), 200);
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      await onDelete(warehouse.Id);
      success("Thành công", `Kho "${warehouse.Name}" đã được xóa`);
      handleClose();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : err instanceof Object && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
            "Có lỗi xảy ra khi xóa kho"
          : "Có lỗi xảy ra khi xóa kho";
      showError("Lỗi xóa kho", errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-2xl shadow-2xl max-w-[1100px] w-full max-h-[92vh] flex flex-col z-50 ${
          isClosing
            ? "animate-out fade-out zoom-out-95 duration-200"
            : "animate-in fade-in zoom-in-95 duration-300"
        }`}
      >
        {/* Header - KFC Red */}
        <div className="bg-[#E4002B] text-white px-8 py-5 rounded-t-2xl flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Chi tiết kho</h2>
              <p className="text-xs text-white/70 font-medium uppercase tracking-wider">
                {warehouse.WarehouseCode}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="hover:opacity-80 transition-opacity p-2 hover:bg-white/10 rounded-lg"
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              {warehouse.Name}
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
              Thông tin chi tiết kho hàng
            </p>
          </div>

          {/* Status Badge */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                warehouse.IsActive
                  ? "bg-green-100/50 text-green-700 border-green-200"
                  : "bg-gray-100/50 text-gray-600 border-gray-200"
              }`}>
                {warehouse.IsActive ? "Hoạt động" : "Tạm ngưng"}
              </span>
              <span className="text-xs text-gray-400">
                Trạng thái kho hàng
              </span>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Building2 className="w-4 h-4 text-[#E4002B]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">
                  Thông tin cơ bản
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Mã kho
                  </label>
                  <p className="text-sm font-bold text-gray-900 uppercase">
                    {warehouse.WarehouseCode || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Tên kho
                  </label>
                  <p className="text-sm font-bold text-gray-900">
                    {warehouse.Name || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Loại kho
                  </label>
                  <p className="text-sm font-bold text-gray-900">
                    {warehouse.WarehouseType || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Diện tích (m²)
                  </label>
                  <p className="text-sm font-bold text-gray-900">
                    {warehouse.AreaSqm ? `${warehouse.AreaSqm} m²` : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Info Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Phone className="w-4 h-4 text-[#E4002B]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">
                  Thông tin liên hệ
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Địa chỉ
                  </label>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-bold text-gray-900">
                      {warehouse.Address || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Số điện thoại
                  </label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">
                      {warehouse.Phone || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">
                      {warehouse.Email || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Manager Info Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <User className="w-4 h-4 text-[#E4002B]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">
                  Quản lý
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Người quản lý
                  </label>
                  <p className="text-sm font-bold text-gray-900">
                    {managerName || (warehouse.ManagerId ? `#${warehouse.ManagerId}` : "Chưa phân công")}
                  </p>
                </div>
              </div>
            </div>

            {/* Timestamps Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <Calendar className="w-4 h-4 text-[#E4002B]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-700">
                  Thời gian
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-sm font-bold text-gray-900">
                    {warehouse.CreatedAt ? new Date(warehouse.CreatedAt).toLocaleDateString("vi-VN") : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                    Cập nhật lần cuối
                  </label>
                  <p className="text-sm font-bold text-gray-900">
                    {warehouse.UpdatedAt ? new Date(warehouse.UpdatedAt).toLocaleDateString("vi-VN") : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {warehouse.Notes && (
            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-700 mb-3">
                Ghi chú
              </h3>
              <p className="text-sm font-bold text-gray-600">
                {warehouse.Notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Xóa
              </>
            )}
          </button>
          <button
            onClick={() => onEdit(warehouse)}
            className="px-8 py-3.5 bg-[#E4002B] text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Chỉnh sửa
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa kho "${warehouse.Name}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
