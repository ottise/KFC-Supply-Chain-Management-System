"use client";

import { productsApi } from "@/lib/api/warehouse/productsApi";
import { useToast } from "@/components/ui/ToastProvider";
import { useState } from "react";
import type { Product, Category } from "@/types/warehouse/masterData";

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  openDetail: (p: Product) => void;
  onToggleComplete?: () => void;
  onAddToWarehouse?: (p: Product) => void;
}

export default function ProductTable({
  products,
  categories,
  openDetail,
  onToggleComplete,
  onAddToWarehouse
}: ProductTableProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();


  const categoryColors = [
    'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]',
    'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]',
    'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]',
    'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]',
    'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]',
    'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
    'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]',
    'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
    'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.4)]',
  ];

  const getCategoryColor = (categoryId: number | null) => {
    if (categoryId === null) return 'bg-gray-300';
    const idx = categories.findIndex(c => c.Id === categoryId);
    return idx >= 0 ? categoryColors[idx % categoryColors.length] : 'bg-gray-300';
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
    <div className="w-full relative bg-white rounded-t-3xl overflow-x-auto">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-sm">
          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
            <th className="px-4 py-5 text-left border-b border-gray-100 w-[15%]">SKU</th>
            <th className="px-4 py-5 text-left border-b border-gray-100 w-[20%]">Sản Phẩm</th>
            <th className="px-4 py-5 text-left border-b border-gray-100 w-[15%]">Danh mục</th>
            <th className="px-4 py-5 text-center border-b border-gray-100 w-[8%]">Đơn vị</th>
            <th className="px-4 py-5 text-center border-b border-gray-100 w-[10%]">Giá kho</th>
            <th className="px-4 py-5 text-center border-b border-gray-100 w-[12%]">Giá bán</th>
            <th className="px-4 py-5 text-center border-b border-gray-100 w-[10%]">Trạng thái</th>
            <th className="px-4 py-5 text-center border-b border-gray-100 w-[10%]">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {products.length > 0 ? (
            products.map((p) => (
              <tr
                key={p.Id}
                onClick={() => openDetail(p)}
                className="hover:bg-gray-50/80 cursor-pointer transition-all group"
              >
                <td className="px-4 py-4 text-left">
                  <span className="text-xs font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors">
                    {p.Code}
                  </span>
                </td>
                <td className="px-4 py-4 text-left">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight">
                    {p.Name}
                  </p>
                </td>
                <td className="px-4 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(p.CategoryId || null)}`}></div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                      {p.CategoryName || "---"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-[10px] font-black text-gray-900 uppercase">
                    {p.BaseUomName || '---'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center font-black text-gray-400 text-xs" title={formatVNDFull(p.StockPrice)}>
                  {formatVND(p.StockPrice)}
                </td>
                <td className="px-4 py-4 text-center font-black text-gray-900">
                  <span className="text-[#E4002B] text-xs" title={formatVNDFull(p.SalePrice)}>
                    {formatVND(p.SalePrice)}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      disabled={true}
                      className={`relative inline-flex items-center h-6 rounded-full w-11 shadow-inner transition-colors focus:outline-none cursor-not-allowed ${p.IsActive ? 'bg-red-500/60' : 'bg-gray-300/60'}`}
                    >
                      <span className="sr-only">Status is read-only for managers</span>
                      <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-md ${p.IsActive ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                  {onAddToWarehouse && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToWarehouse(p); }}
                      disabled={!p.IsActive}
                      className={`px-2 py-1 text-[9px] font-bold uppercase tracking-tight rounded-md border transition-colors ${!p.IsActive
                        ? "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60"
                        : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100"
                        }`}
                    >
                      + Thêm vào Kho
                    </button>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr className="h-[73px]">
              <td colSpan={8} className="text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Không có dữ liệu phù hợp</p>
              </td>
            </tr>
          )}

          {products.length < 5 && Array.from({ length: 5 - Math.max(products.length, 1) }).map((_, i) => (
            <tr key={`empty-${i}`} className="h-[73px]">
              <td colSpan={8}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}