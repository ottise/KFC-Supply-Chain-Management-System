"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Package, Hash, Layers } from 'lucide-react';
import { ProductLot } from '@/types/warehouse/productLot';
import { productsApi } from '@/lib/api/warehouse/productsApi';

interface LotDetailBoxProps {
    lot: ProductLot | null;
    onClose: () => void;
    onUpdate: () => void;
}

// Helper format ngày tháng
const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "---";
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const isExpired = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
};

const isExpiringSoon = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const daysUntilExpiry = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
};

export const LotDetailBox = ({ lot, onClose }: LotDetailBoxProps) => {
    const [unitName, setUnitName] = useState<string>("ĐVT");

    useEffect(() => {
        if (lot?.ProductId) {
            productsApi.getProductById(lot.ProductId)
                .then(product => {
                    if (product?.BaseUomName) {
                        setUnitName(product.BaseUomName);
                    }
                })
                .catch(err => console.error("Error fetching UoM:", err));
        }
    }, [lot]);

    if (!lot) return null;


    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-7xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] animate-in zoom-in-95 duration-200"
            >
                {/* Header (KFC Red Theme - Same as StockHistoryModal) */}
                <div className="shrink-0 bg-gradient-to-r from-[#E4002B] to-[#c70022] px-6 py-4 flex items-center justify-between text-white shadow-lg relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-wider">{lot.LotNumber}</h3>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Hệ thống quản lý kho hàng</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Info Bar (3-column grid same as StockHistoryModal) */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1: Product */}
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-3 bg-red-50 rounded-lg">
                                <Package className="w-5 h-5 text-[#E4002B]" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</p>
                                <p className="text-sm font-bold text-gray-800 uppercase truncate" title={lot.ProductName || ""}>{lot.ProductName}</p>
                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">MÃ: {lot.ProductCode}</p>
                            </div>
                        </div>

                        {/* Card 2: Lot Number */}
                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <Hash className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số Lô (LOT)</p>
                                <p className="text-sm font-bold text-gray-800 uppercase">{lot.LotNumber}</p>
                            </div>
                        </div>

                        {/* Card 3: Expiration Date (Replacing Location in Inventory History) */}
                        <div className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm transition-all ${isExpired(lot.ExpirationDate) ? "bg-red-50 border-red-100" :
                            isExpiringSoon(lot.ExpirationDate) ? "bg-orange-50 border-orange-100" : "bg-green-50 border-green-100"
                            }`}>
                            <div className={`p-3 rounded-lg ${isExpired(lot.ExpirationDate) ? "bg-red-100" :
                                isExpiringSoon(lot.ExpirationDate) ? "bg-orange-100" : "bg-green-100"
                                }`}>
                                <Calendar className={`w-5 h-5 ${isExpired(lot.ExpirationDate) ? "text-red-600" :
                                    isExpiringSoon(lot.ExpirationDate) ? "text-orange-600" : "text-green-600"
                                    }`} />
                            </div>
                            <div>
                                <p className={`text-[9px] font-black uppercase tracking-widest ${isExpired(lot.ExpirationDate) ? "text-red-400" :
                                    isExpiringSoon(lot.ExpirationDate) ? "text-orange-400" : "text-green-400"
                                    }`}>Hạn sử dụng</p>
                                <p className={`text-sm font-bold uppercase ${isExpired(lot.ExpirationDate) ? "text-red-700 font-black" :
                                    isExpiringSoon(lot.ExpirationDate) ? "text-orange-700 font-black" : "text-green-700 font-black"
                                    }`}>
                                    {formatDate(lot.ExpirationDate)}
                                    {isExpired(lot.ExpirationDate) && <span className="ml-1 text-[10px] opacity-70">(Hết hạn)</span>}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Area Header (Fixed) */}
                <div className="px-6 pt-6 bg-white shrink-0">
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-[#E4002B] pl-3">
                        Vị trí lưu kho hiện tại
                    </h3>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 bg-white">
                    {/* Inventory Locations Section */}
                    <div className="space-y-3">

                        <div className="grid grid-cols-1 gap-3">
                            {lot.Locations && lot.Locations.length > 0 ? (
                                lot.Locations.map((loc, idx) => (
                                    <div key={idx} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm group-hover:border-[#E4002B]/20 transition-all group-hover:scale-105">
                                                <MapPin className="w-6 h-6 text-[#E4002B]" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Vị trí lưu kho</div>
                                                <div className="text-sm font-black text-gray-800 uppercase tracking-tight">{loc.LocationName}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Số lượng tồn</div>
                                            <div className="text-xl font-black text-[#E4002B]">
                                                {(loc.Quantity || 0).toLocaleString("vi-VN")}
                                                <span className="ml-2 text-xs text-gray-400 font-bold uppercase tracking-widest">{unitName}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-16 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-40" />
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        Lô hàng hiện không có tồn kho trong hệ thống
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Bar (KFC Red Style) */}
                <div className="shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-400 tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-[#E4002B] animate-pulse"></div>
                        KFC Warehouse Tracking System
                    </div>
                </div>
            </div>
        </div>
    );
};
