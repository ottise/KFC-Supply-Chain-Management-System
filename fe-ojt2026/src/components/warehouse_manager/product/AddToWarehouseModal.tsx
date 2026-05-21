"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { productWarehouseApi } from "@/lib/api/warehouse/productWarehouseApi";
import { useToast } from "@/components/ui/ToastProvider";

interface Warehouse {
    Id: number;
    Name: string;
}

interface AddToWarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productCode: string;
    productName: string;
    onSuccess?: () => void;
}

export default function AddToWarehouseModal({
    isOpen,
    onClose,
    productId,
    productCode,
    productName,
    onSuccess
}: AddToWarehouseModalProps) {
    const { success: showSuccess, error: showError } = useToast();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [existingWarehouseIds, setExistingWarehouseIds] = useState<number[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        setSelectedWarehouseId(null);
        setLoading(true);
        setIsDropdownOpen(false);

        const fetchData = async () => {
            try {
                // Fetch all warehouses for manager
                const whData = await warehouseApi.getWarehousesForCurrentUser();
                const whList = Array.isArray(whData) ? whData : (whData?.Items || whData?.items || []);
                setWarehouses(whList);

                // Fetch existing product warehouse connections to filter
                // We use search by productCode to find matches
                const existingData = await productWarehouseApi.getAll({
                    search: productCode,
                    pageSize: 100
                });

                // Filter strictly by ProductId in case of partial code matches
                const existingIds = (existingData?.Items || [])
                    .filter(item => item.ProductId === productId)
                    .map(item => item.WarehouseId);

                setExistingWarehouseIds(existingIds);
            } catch (error) {
                console.error("Error loading modal data:", error);
                setWarehouses([]);
                setExistingWarehouseIds([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, productId, productCode]);

    const handleSubmit = async () => {
        if (!selectedWarehouseId) return;
        setSubmitting(true);
        try {
            await productWarehouseApi.addProduct(productId, selectedWarehouseId);
            showSuccess("Thành công", `Đã thêm "${productName}" vào kho.`);
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Không thể thêm sản phẩm vào kho.";
            showError("Thất bại", msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // Filter out warehouses where the product already exists
    const availableWarehouses = warehouses.filter(w => !existingWarehouseIds.includes(w.Id));
    const selectedWarehouse = warehouses.find(w => w.Id === selectedWarehouseId);

    const warehouseColors = [
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

    const getWarehouseColor = (whId: number) => {
        const idx = warehouses.findIndex(w => w.Id === whId);
        return warehouseColors[idx % warehouseColors.length];
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="relative flex items-center justify-between px-6 py-5 bg-[#E4002B] text-white rounded-t-[40px]">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-widest">Thêm vào Kho</h3>
                        <p className="text-[10px] text-red-100 font-bold mt-1 truncate max-w-[280px]">{productName}</p>
                    </div>
                    <button onClick={onClose} className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-[#E4002B] animate-spin" />
                            <span className="ml-3 text-sm font-bold text-gray-400">Đang tải dữ liệu...</span>
                        </div>
                    ) : availableWarehouses.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-100">
                            <p className="text-sm font-bold text-gray-400 px-4">
                                {existingWarehouseIds.length > 0
                                    ? "Sản phẩm này đã có mặt ở tất cả các kho của bạn."
                                    : "Không có kho nào khả dụng."}
                            </p>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 block mb-3">Chọn Kho Tiếp Nhận</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full px-4 py-3 pl-12 bg-gray-50 rounded-lg text-sm font-bold focus:bg-white focus:ring-4 focus:ring-red-50 outline-none transition-all border border-transparent focus:border-red-200 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        {selectedWarehouseId !== null ? (
                                            <>
                                                <div className={`w-2 h-2 rounded-full ${getWarehouseColor(selectedWarehouseId)}`}></div>
                                                <span className="text-gray-900 truncate">{selectedWarehouse?.Name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                                <span className="text-gray-400">Chọn một kho...</span>
                                            </>
                                        )}
                                    </div>
                                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-48 overflow-y-auto">
                                        {availableWarehouses.map((wh) => (
                                            <button
                                                key={wh.Id}
                                                type="button"
                                                className={`w-full px-5 py-3 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-3 ${selectedWarehouseId === wh.Id ? 'bg-red-50' : ''}`}
                                                onMouseDown={(e) => { e.preventDefault(); setSelectedWarehouseId(wh.Id); setIsDropdownOpen(false); }}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${getWarehouseColor(wh.Id)}`}></div>
                                                <span className={`font-bold ${selectedWarehouseId === wh.Id ? 'text-gray-900' : 'text-gray-600'}`}>{wh.Name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 mt-1">
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedWarehouseId || submitting}
                        className="w-full px-6 py-4 bg-[#E4002B] text-white text-xs font-black uppercase tracking-[0.2em] rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                        )}
                        Thêm vào kho
                    </button>
                    {availableWarehouses.length > 0 && (
                        <p className="text-[10px] text-gray-400 font-bold text-center mt-4 uppercase tracking-widest leading-loose">
                            Sản phẩm này sẽ được khởi tạo <br /> với trạng thái mặc định trong kho mới
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
