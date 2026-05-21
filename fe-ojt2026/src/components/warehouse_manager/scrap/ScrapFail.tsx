"use client";
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { InventoryCheck } from '@/types/warehouse/scrap';

interface Props {
  inventoryData: InventoryCheck[];
  errorMessage?: string;
  onClose: () => void;
}

export default function ScrapFail({ inventoryData, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col scale-in-center border border-white/20 max-h-[92vh]">
        {/* Header - Gradient Đỏ KFC */}
        <div className="shrink-0 bg-gradient-to-br from-[#E4002B] to-[#c70022] px-4 py-8 text-white relative">
          <div className="text-center">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
              <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-8 h-8 text-[#E4002B]" />
              </div>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">Không đủ số lượng</h3>
            <p className="text-red-100 text-[10px] font-bold uppercase tracking-widest mt-2">
              Hệ thống cảnh báo tồn kho
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-2">
            <p className="text-[12px] font-bold text-red-600 text-center leading-relaxed">
              Không đủ số lượng tồn kho để thực hiện thao tác loại bỏ. <br />
              Vui lòng kiểm tra lại số lô (Lot) hoặc điều chỉnh số lượng yêu cầu.
            </p>
          </div>

          <div className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[600px]">
                <thead className="bg-gray-100/50">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest w-[30%]">Sản phẩm</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest w-[25%]">Vị trí & Số lô (Lot)</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Yêu cầu</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Khả dụng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryData.map((item, i) => (
                    <tr key={i} className="hover:bg-white transition-colors bg-white/50">
                      <td className="px-5 py-4">
                        <p className="text-[11px] font-bold text-gray-900 line-clamp-2">{item.product || '—'}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase mt-0.5">Kho: {item.location}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{item.location}</p>
                        <span className="px-2 py-0.5 bg-red-50 text-[#E4002B] text-[10px] font-black rounded border border-red-100 break-all">
                          {item.lot}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <p className="text-[11px] font-black text-gray-900">{item.requiredQty ?? 0}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{item.uom}</p>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <p className="text-[11px] font-black text-red-600">{item.qty}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{item.uom}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-white border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" /> Quay lại điều chỉnh số lượng
          </button>
        </div>
      </div>
    </div>
  );
}