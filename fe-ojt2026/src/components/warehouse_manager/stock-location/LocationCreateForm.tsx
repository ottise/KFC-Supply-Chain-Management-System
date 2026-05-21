"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Database, Layers, Info, Loader2, Plus } from "lucide-react";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import OdooDropdown from "@/components/common/OdooDropdown";
import type { Location, CreateLocationRequest } from "@/types/warehouse/locations";
import type { Warehouse } from "@/types/warehouse/warehouse";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateLocationRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  allLocations?: Location[];
}

export default function LocationCreateForm({ isOpen, onClose, onSave, isLoading, error: externalError, allLocations = [] }: Props) {
  const [formData, setFormData] = useState<CreateLocationRequest>({
    Name: "",
    Type: "Internal",
    WarehouseId: 1,
    ParentId: null,
  });

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loadingWarehouses, setLoadingWarehouses] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchWarehouses = async () => {
        setLoadingWarehouses(true);
        try {
          const data = await warehouseApi.getWarehouses();
          setWarehouses(data);
          if (data.length > 0 && !formData.WarehouseId) {
            setFormData(prev => ({ ...prev, WarehouseId: data[0].Id }));
          }
        } catch (err) {
          console.error("Lỗi khi tải danh sách kho:", err);
        } finally {
          setLoadingWarehouses(false);
        }
      };
      fetchWarehouses();
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, formData.WarehouseId]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setFormData({ Name: "", Type: "Internal", WarehouseId: 1, ParentId: null });
      setLocalError(null);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Name.trim()) {
      setLocalError("Vui lòng nhập tên vị trí");
      nameRef.current?.focus();
      return;
    }
    setLocalError(null);
    try {
      await onSave(formData);
      handleClose();
    } catch (err: unknown) {
      console.error('Error saving location:', err);
      const errorMessage = err instanceof Error ? err.message : "Có lỗi xảy ra khi lưu vị trí.";
      setLocalError(errorMessage);
    }
  };

  if (!isOpen) return null;

  const typeOptions = [
    { label: "View (Kho tổng)", value: "View" },
    { label: "Internal (Vị trí lưu trữ)", value: "Internal" },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[998] animate-in fade-in duration-200"
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <form
          onSubmit={handleSubmit}
          className={`relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden ${isClosing ? "animate-out fade-out zoom-out-95 duration-200" : "animate-in fade-in zoom-in-95 duration-300"
            }`}
        >
          {/* Header */}
          <div className="bg-[#E4002B] p-7 text-white relative shadow-[0_4px_15px_rgba(228,0,43,0.2)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest leading-none">Thêm Vị Trí</h2>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-[#E4002B] rounded-full animate-pulse" />
                  Hệ thống quản lý kho vận
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-2xl border border-white/10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto">
            {(localError || externalError) && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-shake">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                <span className="text-xs font-bold text-red-600">{localError || externalError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-3 h-3 text-[#E4002B]" /> Tên vị trí (Grid/Bin) <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  className="w-full bg-white border border-gray-200 px-6 py-4 rounded-2xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                  placeholder="VD: Khoang A-01, Kệ B..."
                  value={formData.Name}
                  onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                />
              </div>

              {/* Type & Warehouse */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-3 h-3 text-[#E4002B]" /> Loại vị trí
                  </label>
                  <OdooDropdown<{ label: string; value: string }>
                    items={typeOptions}
                    value={typeOptions.find((o) => o.value === formData.Type) || null}
                    onChange={(item) => setFormData({ ...formData, Type: item.value as unknown as string })}
                    displayField="label"
                    placeholder="Chọn loại"
                    className="w-full"
                    portal
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-3 h-3 text-[#E4002B]" /> Kho vận
                  </label>
                  <OdooDropdown<Warehouse>
                    items={warehouses}
                    value={warehouses.find((wh) => wh.Id === formData.WarehouseId) || null}
                    onChange={(item) => setFormData({ ...formData, WarehouseId: Number(item.Id) })}
                    displayField="Name"
                    placeholder="Chọn kho"
                    className="w-full"
                    loading={loadingWarehouses}
                    portal
                  />
                </div>
              </div>

              {/* Parent Id */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Database className="w-3 h-3 text-[#E4002B]" /> Vị trí kho tổng (Để trống nếu là gốc)
                </label>
                <OdooDropdown<Location>
                  items={allLocations.filter(loc => loc.Type === 'View')}
                  value={allLocations.find((loc) => loc.Id === formData.ParentId) || null}
                  onChange={(item) => setFormData({ ...formData, ParentId: Number(item.Id) })}
                  displayField="Name"
                  placeholder="Chọn vị trí cha (nếu có)"
                  className="w-full"
                  portal
                  showSearch
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="p-6 bg-gray-50 flex gap-4 mt-auto">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-4 bg-red-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-white" />
                  Lưu vị trí mới
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}