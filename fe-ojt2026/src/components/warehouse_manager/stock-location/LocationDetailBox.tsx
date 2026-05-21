"use client";

import React, { useState } from "react";
import { Info, X, MapPin, Database, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import type { Location } from "@/types/warehouse/locations";

interface Props {
  location: Location;
  close: () => void;
  onUpdate: () => void;
  onToggleStatus: (id: number, currentStatus: boolean) => Promise<void>;
  locationMap?: Record<number, string>;
}

export default function LocationDetailBox({ location, close, onUpdate, onToggleStatus, locationMap }: Props) {
  const [isClosing, setIsClosing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => close(), 200);
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      await onToggleStatus(location.Id, location.IsActive);
      onUpdate();
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={handleClose}
      />

      <div
        className={`relative bg-white w-full max-w-xl rounded-[2rem] shadow-2xl flex flex-col overflow-hidden ${isClosing
          ? "animate-out fade-out zoom-out-95 duration-200"
          : "animate-in fade-in zoom-in-95 duration-300"
          }`}
      >
        {/* Header */}
        <div className="bg-[#E4002B] p-7 text-white relative shadow-[0_4px_15px_rgba(228,0,43,0.2)]">
          <div className="flex items-center gap-3 text-left">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-white-400 font-bold uppercase tracking-widest italic">
                Chi tiết vị trí kho
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-2xl border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6 text-left overflow-y-auto max-h-[70vh]">
          <div className="flex justify-between items-start border-b border-gray-100 pb-6">
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Tên vị trí / Khu vực
              </label>
              <p className="text-xl font-black text-gray-900 uppercase leading-tight">
                {location.Name}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all ${location.IsActive
                    ? "bg-green-50 text-green-500 border-green-100"
                    : "bg-gray-50 text-gray-400 border-gray-100"
                    }`}
                >
                  {location.IsActive ? (
                    <><CheckCircle2 className="w-3 h-3" /> Hoạt động</>
                  ) : (
                    <><AlertCircle className="w-3 h-3" /> Tạm ngưng</>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-blue-50/40 rounded-3xl border border-blue-100/50 group transition-all hover:bg-blue-50 hover:shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                  Loại vị trí
                </label>
              </div>
              <p className="text-sm font-black text-blue-900 uppercase">
                {location.Type}
              </p>
            </div>

            <div className="p-5 bg-purple-50/40 rounded-3xl border border-purple-100/50 group transition-all hover:bg-purple-50 hover:shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest">
                  Mã kho
                </label>
              </div>
              <p className="text-sm font-black text-purple-900 uppercase">
                WH-{location.WarehouseId}
              </p>
            </div>
          </div>

          <div className="p-5 bg-gray-50/50 rounded-3xl border border-gray-200/50">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                Vị trí kho tổng
              </label>
            </div>
            <p className="text-sm font-bold text-gray-700">
              {location.ParentId ? (locationMap?.[location.ParentId] || `ID ${location.ParentId}`) : "Không có kho tổng"}
            </p>
          </div>

          {/* Quick Stats or Footer Info */}
          <div className="pt-4 flex flex-col gap-3">
            <div className="p-6 bg-gray-50 border border-gray-100 rounded-[2rem] flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Quản lý trạng thái</p>
              <div className="flex items-center gap-4">
                <span className={`text-[11px] font-black uppercase ${!location.IsActive ? 'text-gray-900' : 'text-gray-300'}`}>Tạm ngưng</span>
                <button
                  onClick={handleToggle}
                  disabled={loading}
                  className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${location.IsActive ? 'bg-[#E4002B]' : 'bg-gray-300'
                    } ${loading ? 'opacity-50 cursor-wait' : ''}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out ${location.IsActive ? 'translate-x-8' : 'translate-x-0'
                      }`}
                  />
                </button>
                <span className={`text-[11px] font-black uppercase ${location.IsActive ? 'text-[#E4002B]' : 'text-gray-300'}`}>Hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
