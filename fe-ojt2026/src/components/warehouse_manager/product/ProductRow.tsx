"use client";

import type { Product } from "@/types/warehouse/masterData";

interface ProductRowProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
}

export default function ProductRow({ product, onOpenDetail }: ProductRowProps) {
  return (
    <tr
      onClick={() => onOpenDetail(product)}
      className="hover:bg-red-50/30 cursor-pointer transition-all group border-b border-gray-50 last:border-0"
    >
      <td className="px-8 py-5">
        <div className="flex flex-col">
          <span className="font-black text-gray-900 uppercase group-hover:text-[#E4002B] transition-colors">
            {product.Name}
          </span>
          <span className="text-[10px] text-gray-400 font-mono tracking-wider mt-1">
            {product.Code}
          </span>
        </div>
      </td>
      <td className="px-8 py-5 text-center">
        <span className="px-3 py-1 bg-gray-100 rounded-lg text-[11px] font-black text-gray-500 uppercase">
          {product.BaseUomId ? `#${product.BaseUomId}` : '---'}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <span className="font-black text-gray-900 text-sm">
          {product.SalePrice.toLocaleString('vi-VN')}đ
        </span>
      </td>
    </tr>
  );
}