import React, { useState, useEffect } from 'react';
import { X, Layers, Hash, Info, CheckCircle2, Save, Trash2 } from 'lucide-react';
import { uomService, Uom } from '@/lib/api/warehouse/UomApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  unit: Uom | null;
  onRefresh: () => Promise<void>;
  allUnits: Uom[];
}

const UnitDetail: React.FC<Props> = ({ isOpen, onClose, unit, onRefresh, allUnits }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<Partial<Uom>>({});
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  useEffect(() => {
    if (unit) setFormData({ ...unit });
  }, [unit]);

  const handleReset = () => {
    if (unit) setFormData({ ...unit });
  };

  if (!isOpen || !unit) return null;

  const showNotification = (msg: string, type: 'success' | 'error') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const baseUnit = allUnits.find(u => u.Category === unit.Category && u.IsBaseUnit);
  const baseUnitName = baseUnit?.Name || "Gốc";

  const handleUpdate = async () => {
    if (!formData.Name?.trim() || !unit.Id) return;
    try {
      setIsUpdating(true);

      if (unit.IsBaseUnit) {
        await uomService.updateUomsBaseUnit(unit.Id, {
          Name: formData.Name.trim()
        });
      } else {
        await uomService.updateUoms(unit.Id, {
          Name: formData.Name.trim(),
          Category: unit.Category,
          ConversionRatio: formData.ConversionRatio || 1,
          IsBaseUnit: false
        });
      }

      await onRefresh();
      showNotification("Đã cập nhật thành công!", "success");
    } catch (error) {
      console.error("Lỗi Network/CORS:", error);
      showNotification("Lỗi kết nối Server!", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* CSS inline for scrollbar-hide */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Toast notification - matching KFC theme */}
      {toast.show && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[700] px-8 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-top duration-300 ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-600' : 'bg-white border-red-100 text-red-600'
          }`}>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`} />
            <span className="text-[12px] font-black uppercase tracking-widest">{toast.msg}</span>
          </div>
        </div>
      )}

      <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl ">
        {/* Header */}
        <div className="bg-[#E4002B] p-7 text-white relative shadow-[0_4px_15px_rgba(228,0,43,0.2)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg ">
              <Layers className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest line-clamp-1">Hiệu chỉnh đơn vị</h2>
              <div className="flex items-center gap-2 mt-1 opacity-90">
                <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest">Hệ thống quản lý đơn vị tính</p>
                {unit.IsBaseUnit && (
                  <span className="text-[9px] font-black bg-white/20 text-white px-2 py-0.5 rounded-lg uppercase border border-white/30">Master Unit</span>
                )}
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

        {/* Form Body */}
        <div className="p-8 space-y-7 overflow-y-auto scrollbar-hide bg-white min-h-[400px]">
          {/* 1. Tên đơn vị (Giữ nguyên thứ tự) */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Info className="w-3.5 h-3.5 text-[#E4002B]" /> Tên đơn vị mới <span className="text-[#E4002B]">*</span>
            </label>
            <input
              type="text"
              value={formData.Name || ""}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-[14px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/5 outline-none transition-all hover:shadow-md uppercase"
            />
          </div>

          {/* 2. Visual Conversion Display (Giữ nguyên thứ tự) */}
          <div className={`p-8 rounded-[30px] transition-all relative overflow-hidden group shadow-xl border ${unit.IsBaseUnit ? 'bg-gray-50 border-gray-100' : 'bg-gray-900 text-white border-gray-800'}`}>
            {!unit.IsBaseUnit && (
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Layers className="w-32 h-32 text-[#E4002B]" />
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-center relative z-10">
              <div className="flex-1">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${unit.IsBaseUnit ? 'text-gray-500' : 'text-gray-400'}`}>Giá trị</p>
                <div className={`text-5xl font-black ${unit.IsBaseUnit ? 'text-gray-900' : 'text-white'}`}>1</div>
                <p className={`text-[12px] font-black uppercase mt-3 line-clamp-1 ${unit.IsBaseUnit ? 'text-gray-600' : 'text-red-100'}`}>{formData.Name || "..."}</p>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className={`text-3xl font-black transition-all ${unit.IsBaseUnit ? 'text-gray-300' : 'text-white/40'}`}>=</div>
              </div>

              <div className="flex-1">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${unit.IsBaseUnit ? 'text-gray-500' : 'text-[#E4002B]/90'}`}>Quy đổi</p>
                <div className="relative inline-block w-full">
                  <input
                    type="number"
                    value={unit.IsBaseUnit ? 1 : (formData.ConversionRatio ?? 0)}
                    disabled={unit.IsBaseUnit}
                    onChange={(e) => setFormData({ ...formData, ConversionRatio: Number(e.target.value) })}
                    className={`w-full bg-transparent text-center text-4xl font-black outline-none transition-all ${unit.IsBaseUnit ? 'text-gray-400' : 'text-[#E4002B] focus:scale-110 focus:brightness-125'}`}
                  />
                </div>
                <p className={`text-[12px] font-black uppercase mt-3 line-clamp-1 ${unit.IsBaseUnit ? 'text-gray-600' : 'text-[#E4002B] brightness-110'}`}>
                  {unit.IsBaseUnit ? "Chính nó" : baseUnitName}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Loại đơn vị display (Giữ nguyên thứ tự) */}
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100/50 flex items-center gap-4 transition-all hover:border-red-200">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md border border-red-50">
              <CheckCircle2 className="w-6 h-6 text-[#E4002B]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Danh mục đơn vị tính</p>
              <p className="text-[15px] font-black text-gray-900 uppercase mt-0.5 truncate">{unit.Category}</p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50/80 border-t border-gray-100 px-8 py-6 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleReset}
            className="group flex items-center gap-3 px-8 py-4 text-[12px] font-black text-gray-600 bg-gray-200/70 uppercase hover:text-white hover:bg-gray-700 transition-all active:scale-95 rounded-2xl"
          >
            <Trash2 className="w-5 h-5 group-hover:rotate-[-20deg] transition-transform duration-300" />
            <span>Đặt lại</span>
          </button>

          <button
            onClick={handleUpdate}
            disabled={isUpdating || !formData.Name?.trim()}
            className="group relative overflow-hidden px-12 py-4 text-[12px] font-black text-white uppercase bg-[#E4002B] rounded-2xl hover:bg-[#B30022] hover:shadow-[0_10px_25px_-5px_rgba(228,0,43,0.4)] transition-all active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-3">
              {isUpdating ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              )}
              <span>{isUpdating ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitDetail;
