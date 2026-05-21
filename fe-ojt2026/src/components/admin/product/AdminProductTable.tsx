"use client";

import { productsApi } from "@/lib/api/warehouse/productsApi";
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";
import type { Product } from "@/types/warehouse/masterData";

interface ProductTableProps {
  products: Product[];
  openDetail: (p: Product) => void;
  onToggleComplete?: () => void;
}

export default function ProductTable({ products, openDetail, onToggleComplete }: ProductTableProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleStatus = async (e: React.MouseEvent, p: Product) => {
    e.stopPropagation(); // Ngăn mở modal chi tiết
    if (togglingId === p.Id) return;

    setTogglingId(p.Id);
    try {
      if (p.IsActive) {
        await productsApi.softDeleteProduct(p.Id);
        showSuccessToast("Cập nhật thành công", "Đã chuyển sản phẩm sang trạng thái ngừng hoạt động.");
      } else {
        await productsApi.restoreProduct(p.Id);
        showSuccessToast("Cập nhật thành công", "Đã chuyển sản phẩm sang trạng thái hoạt động.");
      }
      if (onToggleComplete) onToggleComplete();
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái:", error);
      showErrorToast("Cập nhật thất bại", "Không thể thay đổi trạng thái sản phẩm.");
    } finally {
      setTogglingId(null);
    }
  };

  const formatVND = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "---";

    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000) {
      const compact = amount / 1_000_000_000;
      return `${Number(compact.toFixed(2)).toString()} Tỉ`;
    }

    if (abs >= 1_000_000) {
      const compact = amount / 1_000_000;
      return `${Number(compact.toFixed(2)).toString()} Triệu`;
    }

    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const formatVNDFull = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "---";
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <div className="w-full relative bg-white">
      <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
        <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">
          <tr>
            <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[18%]">SKU</th>
            <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[22%]">NGUYÊN LIỆU</th>
            <th className="px-4 md:px-6 py-5 whitespace-nowrap w-[18%]">DANH MỤC</th>
            <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[10%]">ĐƠN VỊ</th>
            <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[9%]">GIÁ KHO</th>
            <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[15%]">GIÁ BÁN</th>
            <th className="px-4 md:px-6 py-5 text-center whitespace-nowrap w-[7%]">TRẠNG THÁI</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.length > 0 ? (
            products.map((p) => (
              <tr
                key={p.Id}
                onClick={() => openDetail(p)}
                className="hover:bg-red-50/50 transition-colors group [&_*]:cursor-pointer select-none cursor-pointer"
                title={p.Name}
              >
                {/* Cột SKU */}
                <td className="px-4 md:px-6 py-6">
                  <span className="text-xs font-bold text-gray-400 group-hover:text-[#E4002B] transition-colors">
                    {p.Code}
                  </span>
                </td>

                {/* Cột Tên */}
                <td className="px-4 md:px-6 py-6">
                  <span className="font-bold text-gray-900 text-sm">
                    {p.Name}
                  </span>
                </td>

                {/* Cột Danh mục */}
                <td className="px-4 md:px-6 py-6">
                  <span className="text-xs font-semibold text-gray-500">
                    {p.CategoryName || "---"}
                  </span>
                </td>

                {/* Cột Đơn vị */}
                <td className="px-4 md:px-6 py-6 text-center">
                  <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-full">
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                      {p.BaseUomId ? `${p.BaseUomName}` : '---'}
                    </span>
                  </div>
                </td>

                {/* Cột Giá Kho */}
                <td className="px-4 md:px-6 py-6 text-center" title={formatVNDFull(p.StockPrice)}>
                  <span className="text-xs font-semibold text-gray-500">{formatVND(p.StockPrice)}</span>
                </td>

                {/* Cột Giá Bán */}
                <td className="px-4 md:px-6 py-6 text-center">
                  <span className="text-[#E4002B] font-bold text-xs" title={formatVNDFull(p.SalePrice)}>
                    {formatVND(p.SalePrice)}
                  </span>
                </td>

                {/* Cột Trạng thái (Toggle) */}
                <td className="px-4 md:px-6 py-6 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center">
                    <button
                      onClick={(e) => handleToggleStatus(e, p)}
                      disabled={togglingId === p.Id}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 shadow-inner transition-colors focus:outline-none ${p.IsActive ? 'bg-red-500' : 'bg-gray-300'
                        } ${togglingId === p.Id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <span className="sr-only">Toggle status</span>
                      <span
                        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-md ${p.IsActive ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr className="h-[73px]">
              <td colSpan={7} className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Không có dữ liệu phù hợp</p>
              </td>
            </tr>
          )}

          {/* Giữ khung tối thiểu 5 dòng giống ScrapTable */}
          {products.length < 5 && Array.from({ length: 5 - Math.max(products.length, 1) }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-[73px]">
              <td colSpan={7}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}