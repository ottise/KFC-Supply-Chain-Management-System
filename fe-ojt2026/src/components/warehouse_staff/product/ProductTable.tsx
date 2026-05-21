"use client";

import { type Product } from "@/types/warehouse/masterData";
import { formatVND } from "@/lib/utils/warehouseUtils";
import type { Category } from "@/types/warehouse/masterData";

interface StaffProduct {
    id: number;
    name: string;
    sku: string;
    unit: string;
    categoryName?: string;
    categoryId?: number | null;
    stockPrice?: number;
    price: number;
    isActive?: boolean;
}

interface ProductTableProps {
    products: StaffProduct[];
    categories: Category[];
    onSelect: (p: StaffProduct) => void;
}

export default function ProductTable({ products, categories, onSelect }: ProductTableProps) {
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

    const getCategoryColor = (categoryId: number | null | undefined) => {
        if (!categoryId) return 'bg-gray-300';
        const idx = categories.findIndex(c => c.Id === categoryId);
        return idx >= 0 ? categoryColors[idx % categoryColors.length] : 'bg-gray-300';
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return "---";
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    return (
        <div className="w-full relative bg-white rounded-t-3xl overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-0">
                <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-sm">
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                        <th className="px-6 py-5 text-left border-b border-gray-100 w-[18%]">SKU</th>
                        <th className="px-6 py-5 text-left border-b border-gray-100 w-[25%]">Sản Phẩm</th>
                        <th className="px-6 py-5 text-left border-b border-gray-100 w-[15%]">Danh Mục</th>
                        <th className="px-6 py-5 text-center border-b border-gray-100 w-[15%]">Giá bán</th>
                        <th className="px-6 py-5 text-center border-b border-gray-100 w-[12%]">Đơn vị</th>
                        <th className="px-6 py-5 text-center border-b border-gray-100 w-[15%]">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {products.length > 0 ? (
                        products.map((p) => (
                            <tr
                                key={p.id}
                                onClick={() => onSelect(p)}
                                className="hover:bg-gray-50/80 cursor-pointer transition-all group"
                            >
                                <td className="px-6 py-5">
                                    <span className="text-xs font-black text-gray-900 tracking-tight group-hover:text-[#E4002B] transition-colors">{p.sku || "---"}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <p className="text-xs font-bold text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight">{p.name}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getCategoryColor(p.categoryId)}`}></div>
                                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">{p.categoryName || "---"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center font-black text-[#E4002B]">
                                    <span className="text-xs">
                                        {p.price ? formatVND(p.price) : "---"}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className="text-[10px] font-black text-gray-900 uppercase">{p.unit || "---"}</span>
                                </td>
                                <td className="px-6 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center">
                                        <button
                                            disabled={true}
                                            className={`relative inline-flex items-center h-6 rounded-full w-11 shadow-inner transition-colors focus:outline-none cursor-not-allowed ${p.isActive ? 'bg-red-500/60' : 'bg-gray-300/60'}`}
                                        >
                                            <span className="sr-only">Status is read-only for staff</span>
                                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform shadow-md ${p.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr className="h-[73px]">
                            <td colSpan={6} className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Không có dữ liệu phù hợp</p>
                            </td>
                        </tr>
                    )}

                    {products.length < 5 && Array.from({ length: 5 - Math.max(products.length, 1) }).map((_, i) => (
                        <tr key={`empty-${i}`} className="h-[73px]">
                            <td colSpan={6}></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
