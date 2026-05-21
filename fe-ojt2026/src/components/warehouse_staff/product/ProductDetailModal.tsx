"use client";

import { useState, useEffect } from "react";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import type { Product as ApiProduct, Category, Uom } from "@/types/warehouse/masterData";
import { X, Info, Edit3 } from "lucide-react";

interface ProductDetailModalProps {
    productId: number | null;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function ProductDetailModal({ productId, onClose }: ProductDetailModalProps) {
    const [product, setProduct] = useState<ApiProduct | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const formatNumber = (val: number | string | undefined) => {
        if (val === undefined || val === null) return "";
        const numStr = String(val).replace(/\D/g, "");
        return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const formatCompactMoney = (val: number | string | undefined) => {
        if (val === undefined || val === null) return "0";

        const numeric = Number(val);
        if (!Number.isFinite(numeric)) return "0";

        const abs = Math.abs(numeric);

        if (abs >= 1_000_000_000) {
            const compact = numeric / 1_000_000_000;
            return `${Number(compact.toFixed(2)).toString()} Tỉ`;
        }

        if (abs >= 1_000_000) {
            const compact = numeric / 1_000_000;
            return `${Number(compact.toFixed(2)).toString()} Triệu`;
        }

        return formatNumber(numeric);
    };

    useEffect(() => {
        if (!productId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [productData, uomsData, categoriesData] = await Promise.all([
                    productsApi.getProductById(productId),
                    masterDataApi.getUoms(),
                    masterDataApi.getCategories(),
                ]);

                setProduct(productData);
                setUoms(uomsData);
                setCategories(categoriesData.filter((c) => c.IsActive));
            } catch (err: unknown) {
                const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
                const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi khi tải dữ liệu";
                setError(msg);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setProduct(null);
            setError(null);
            setIsClosing(false);
        }, 180);
    };

    if (!productId) return null;

    if (loading) {
        return (
            <>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999]" onClick={handleClose} />
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-10 shadow-2xl flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                </div>
            </>
        );
    }

    if (error && !product) {
        return (
            <>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999]" onClick={handleClose} />
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md">
                        <h3 className="text-lg font-black text-red-600 mb-4">Lỗi</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={handleClose}
                            className="w-full px-6 py-3 bg-[#E4002B] text-white rounded-lg font-black uppercase hover:bg-[#D90026] transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!product) return null;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[9999]" onClick={handleClose}></div>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <div
                    className={`relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl flex flex-col overflow-hidden ${isClosing
                        ? "animate-out fade-out zoom-out-95 duration-200"
                        : "animate-in fade-in zoom-in-95 duration-300"
                        }`}
                >
                    <div className="bg-[#E4002B] p-6 text-white relative flex-shrink-0">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest">{product.Code}</h2>
                                <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest italic leading-none mt-1">
                                    Thông tin chi tiết mặt hàng
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <div className="p-8 space-y-8 overflow-y-auto bg-white">
                        {/* Primary Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5 p-5 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:shadow-md hover:bg-white group">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B] transition-colors">
                                    Mã mặt hàng
                                </div>
                                <div className="text-sm font-black text-gray-900 break-all uppercase tracking-tight">
                                    {product.Code || "—"}
                                </div>
                            </div>

                            <div className="space-y-1.5 p-5 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:shadow-md hover:bg-white group">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B] transition-colors">
                                    Loại mặt hàng
                                </div>
                                <div className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                    {product.ProductType || "—"}
                                </div>
                            </div>

                            <div className="space-y-1.5 p-5 bg-gray-50 rounded-xl border border-gray-100 transition-all hover:shadow-md hover:bg-white group">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B] transition-colors">
                                    Danh mục
                                </div>
                                <div className="text-sm font-black text-gray-900 uppercase tracking-tight">
                                    {categories.find((c) => c.Id === product.CategoryId)?.Name || "Không xác định"}
                                </div>
                            </div>
                        </div>

                        {/* Units Section */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-[#E4002B] pl-3">
                                Thông tin tồn kho & đơn vị
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Đơn vị niêm yết
                                    </div>
                                    <div className="text-sm font-black text-gray-900">
                                        {uoms.find((u) => u.Id === product.BaseUomId)?.Name || product.BaseUomName || "—"}
                                    </div>
                                </div>

                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        Đơn vị mua hàng
                                    </div>
                                    <div className="text-sm font-black text-gray-900">
                                        {uoms.find((u) => u.Id === product.PurchaseUomId)?.Name || product.PurchaseUomName || "—"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-4">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-[#E4002B] pl-3">
                                Thông tin giá thành
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between group hover:bg-white transition-all">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#E4002B]">
                                        Giá nhập kho
                                    </div>
                                    <div className="text-sm font-black text-gray-900">
                                        {formatCompactMoney(product.StockPrice)} <span className="text-[10px] text-gray-400 ml-1">VND</span>
                                    </div>
                                </div>

                                <div className="p-5 bg-[#E4002B]/5 rounded-xl border border-[#E4002B]/10 flex items-center justify-between group hover:bg-[#E4002B]/10 transition-all">
                                    <div className="text-[10px] font-black text-[#E4002B] uppercase tracking-widest">
                                        Giá niêm yết
                                    </div>
                                    <div className="text-sm font-black text-[#E4002B]">
                                        {formatCompactMoney(product.SalePrice)} <span className="text-[10px] opacity-60 ml-1">VND</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 shrink-0">
                        <button
                            type="button"
                            disabled
                            className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            <Edit3 className="w-4 h-4" />
                            Không có quyền chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
