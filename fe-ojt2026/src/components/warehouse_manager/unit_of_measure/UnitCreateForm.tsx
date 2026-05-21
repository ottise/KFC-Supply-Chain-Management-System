import React, { useState, useEffect } from 'react';
import { X, Layers, Info, CheckCircle2, RotateCcw } from 'lucide-react';
import { uomService, Uom } from '@/lib/api/warehouse/UomApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UnitCreateForm: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [baseUnits, setBaseUnits] = useState<Uom[]>([]);
  const [showBaseUnitDropdown, setShowBaseUnitDropdown] = useState(false);

  const [formData, setFormData] = useState({
    Name: "",
    Category: "",
    ConversionRatio: 1,
    SelectedBaseUnitName: ""
  });

  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBaseUnits = async () => {
      try {
        const allUnits = await uomService.getAll();
        const filtered = allUnits.filter((u: Uom) => u.IsBaseUnit === true);
        setBaseUnits(filtered);

        if (filtered.length > 0) {
          setFormData(prev => ({
            ...prev,
            Category: filtered[0].Category,
            SelectedBaseUnitName: filtered[0].Name
          }));
        }
      } catch (error) {
        console.error("Không thể tải danh sách đơn vị gốc", error);
        setFormError("Không thể tải danh sách đơn vị gốc. Vui lòng thử lại.");
      }
    };

    if (isOpen) {
      fetchBaseUnits();
      setFormError(null);
    }
  }, [isOpen]);

  const handleSelectBaseUnit = (unit: Uom) => {
    setFormData({
      ...formData,
      Category: unit.Category,
      SelectedBaseUnitName: unit.Name
    });
    setShowBaseUnitDropdown(false);
  };

  const handleReset = () => {
    if (baseUnits.length > 0) {
      setFormData({
        Name: "",
        Category: baseUnits[0].Category,
        ConversionRatio: 1,
        SelectedBaseUnitName: baseUnits[0].Name
      });
    } else {
      setFormData(prev => ({ ...prev, Name: "", ConversionRatio: 1 }));
    }
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!formData.Name.trim()) {
      setFormError("Vui lòng nhập tên đơn vị quy đổi");
      return;
    }
    if (formData.ConversionRatio <= 0) {
      setFormError("Tỉ lệ quy đổi phải lớn hơn 0");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      await uomService.create({
        Name: formData.Name.trim(),
        Category: formData.Category,
        ConversionRatio: formData.ConversionRatio,
        IsBaseUnit: false
      });
      onSuccess();
      onClose();
      handleReset();
    } catch (error) {
      console.error("Lỗi khi tạo đơn vị:", error);
      setFormError("Có lỗi xảy ra khi tạo đơn vị. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* Thêm CSS inline để ẩn thanh cuộn nhưng vẫn cho phép vuốt */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="bg-white w-full max-w-lg rounded-[40px] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 
                      shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3),0_0_20px_rgba(0,0,0,0.05)]">

        {/* Header */}
        <div className="bg-[#E4002B] p-7 text-white relative shadow-[0_4px_15px_rgba(228,0,43,0.2)]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg ">
              <Layers className="w-7 h-7 text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest">Tạo quy đổi mới</h2>
              <p className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-1 opacity-90">Hệ thống quản lý đơn vị tính</p>
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
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white min-h-[400px]">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[12px] font-bold text-red-600 flex items-start gap-3 animate-in slide-in-from-top-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Tên đơn vị */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Info className="w-3.5 h-3.5 text-[#E4002B]" /> Tên đơn vị mới <span className="text-[#E4002B]">*</span>
              </label>
              <input
                type="text"
                value={formData.Name}
                onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-[14px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/5 outline-none transition-all hover:shadow-md placeholder:text-gray-300"
                placeholder="Ví dụ: Thùng, Két, Bao..."
              />
            </div>

            {/* Chọn Đơn vị gốc */}
            <div className="space-y-2 hover:border-red-500">
              <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#E4002B]" /> Đơn vị gốc làm mốc
              </label>
              <div className="relative">
                <div
                  onClick={() => setShowBaseUnitDropdown(!showBaseUnitDropdown)}
                  className={`w-full bg-gray-50 border px-6 py-4 rounded-2xl text-[14px] font-bold transition-all flex justify-between items-center group
                    ${showBaseUnitDropdown
                      ? 'border-[#E4002B] ring-4 ring-[#E4002B]/5 bg-white shadow-md' // Trạng thái khi đang mở (Active)
                      : 'border-gray-100 text-gray-900 hover:shadow-md' // Trạng thái bình thường
                    }`}
                >
                  <span className={formData.SelectedBaseUnitName ? "text-gray-900" : "text-gray-300"}>
                    {formData.SelectedBaseUnitName ? `${formData.Category} (Gốc: ${formData.SelectedBaseUnitName})` : "Chọn đơn vị gốc..."}
                  </span>

                  <div className={`p-1.5 bg-white rounded-xl shadow-md border border-gray-50 transition-transform duration-300 ${showBaseUnitDropdown ? 'rotate-180' : ''}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E4002B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>

                {showBaseUnitDropdown && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowBaseUnitDropdown(false)} />
                    <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                      {baseUnits.map((u) => (
                        <div
                          key={u.Id}
                          className={`px-6 py-4 text-[13px] font-bold transition-colors border-b border-gray-50 last:border-0 cursor-pointer
                            ${formData.SelectedBaseUnitName === u.Name ? 'bg-red-50 text-[#E4002B]' : 'text-gray-700 hover:bg-gray-50 hover:text-[#E4002B]'}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleSelectBaseUnit(u);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span>{u.Category}</span>
                            <span className="text-[10px] opacity-50 bg-gray-200 px-2 py-0.5 rounded-md uppercase">Gốc: {u.Name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tỉ lệ quy đổi: Chống tràn và cho phép cuộn ngang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-center text-[11px] font-black text-gray-500 uppercase tracking-widest">
                  Quy cách
                </label>
                <div className="w-full bg-gray-100/80 border border-transparent px-5 py-4 rounded-2xl text-[14px] font-black text-gray-500 flex items-center justify-center shadow-inner uppercase overflow-x-auto whitespace-nowrap scrollbar-hide">
                  1 {formData.Name || "..."}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-center text-[11px] font-black text-gray-800 uppercase tracking-widest">
                  Bằng bao nhiêu {formData.SelectedBaseUnitName || "?"}?
                </label>
                <div className="relative overflow-hidden rounded-2xl border-2 border-[#E4002B]/10 focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/5 transition-all">
                  <input
                    type="number"
                    value={formData.ConversionRatio}
                    onChange={(e) => setFormData({ ...formData, ConversionRatio: Number(e.target.value) })}
                    className="w-full bg-white px-5 py-4 text-[16px] font-black text-[#E4002B] outline-none text-center"
                  />
                </div>
              </div>
            </div>

            {/* Preview Banner: Cách đều 2 đầu và chống tràn hoàn hảo */}
            <div className="w-full p-6 px-8 bg-red-50 rounded-[30px] border border-red-100 flex items-center justify-between gap-2 shadow-[0_10px_20px_-5px_rgba(228,0,43,0.1)] transition-all hover:border-red-500">

              {/* Bên trái: Co giãn linh hoạt, căn trái, cho phép vuốt */}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <p className="text-[#E4002B] font-black text-[20px] uppercase whitespace-nowrap text-center">
                  1 {formData.Name || "..."}
                </p>
              </div>

              {/* Dấu ở giữa: Cố định diện tích */}
              <div className="flex-none text-black-500 font-bold text-[15px] px-4 uppercase">
                Tương Đương Với
              </div>

              {/* Bên phải: Co giãn linh hoạt, căn phải, cho phép vuốt */}
              <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <p className="text-[#E4002B] font-black text-[20px] uppercase whitespace-nowrap text-center">
                  {formData.ConversionRatio} {formData.SelectedBaseUnitName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50/50 border-t border-gray-100 px-8 py-6 flex items-center justify-between gap-4 shrink-0">
          <button
            onClick={handleReset}
            className="group flex items-center gap-3 px-10 py-3.5 text-[13px] font-black text-gray-600 bg-gray-300/70 uppercase hover:text-white hover:bg-gray-700 transition-all active:scale-95 rounded-2xl"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-[-120deg] transition-transform duration-500" />
            <span>Dọn nội dung</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.Name}
            className="group relative overflow-hidden px-10 py-3.5 text-[13px] font-black text-white uppercase bg-red-500 rounded-2xl hover:bg-red-700
                       shadow-[0_10px_25px_-5px_rgba(228,0,43,0.4)] transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-center gap-3">
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Layers className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              )}
              <span>{isSubmitting ? "Đang xử lý..." : "Xác nhận tạo"}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitCreateForm;