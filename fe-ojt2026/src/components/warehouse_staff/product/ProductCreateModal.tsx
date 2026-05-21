"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import type { Category, CreateProductRequest, Uom } from "@/types/warehouse/masterData";

export interface CreateProductData {
    name: string;
    sku: string;
    unit: string;
    price: number;
    description?: string;
}

interface ProductCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateProductRequest) => void;
    isLoading?: boolean;
    error?: string | null;
}

export default function ProductCreateModal({
    isOpen,
    onClose,
    onSave,
    isLoading = false,
    error: externalError = null
}: ProductCreateModalProps) {
    // Refs for focus management
    const nameInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLFormElement>(null);

    // Form data matching BE CreateProductDto
    const [formData, setFormData] = useState<CreateProductRequest>({
        Name: "",
        ProductType: "Nguyên Liệu Thô",
        BaseUomId: 0,
        PurchaseUomId: undefined,
        CategoryId: 0,
        StockPrice: 0,
        SalePrice: 0,
    });

    const [markup, setMarkup] = useState<number>(30); // Default 30%

    // Display states for formatted prices
    const [displayStock, setDisplayStock] = useState("");
    const [displaySale, setDisplaySale] = useState("");

    // Loading states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Animation states
    const [isClosing, setIsClosing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Master data states
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Error states
    const [error, setError] = useState<string | null>(null);
    const [shakeError, setShakeError] = useState(false);

    // Filtered UOMs logic
    const getUomCategory = (uomId: number) => uoms.find(u => u.Id === uomId)?.Category;

    const filteredBaseUoms = formData.PurchaseUomId
        ? uoms.filter(u => u.Category === getUomCategory(formData.PurchaseUomId!))
        : uoms;

    const filteredPurchaseUoms = formData.BaseUomId
        ? uoms.filter(u => u.Category === getUomCategory(formData.BaseUomId))
        : uoms;

    // Fetch master data on mount
    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const [uomsData, categoriesData] = await Promise.all([
                    masterDataApi.getUoms(),
                    masterDataApi.getCategories(),
                ]);
                setUoms(uomsData);
                setCategories(categoriesData.filter((c) => c.IsActive));

                // Set default values
                if (uomsData.length > 0 && formData.BaseUomId === 0) {
                    setFormData(prev => ({
                        ...prev,
                        BaseUomId: uomsData[0].Id,
                        CategoryId: categoriesData.find(c => c.IsActive)?.Id || 0
                    }));
                }

                // Auto-focus on Name field after loading completes
                setTimeout(() => nameInputRef.current?.focus(), 100);
            } catch (err) {
                console.error("Error fetching master data:", err);
                setError("Không thể tải dữ liệu danh mục. Vui lòng thử lại.");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchMasterData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Format number with dots for thousands
    const formatNumber = (val: string | number) => {
        const num = String(val).replace(/\D/g, "");
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleInputChange = useCallback((field: keyof CreateProductRequest, value: string | number | boolean | undefined) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    }, [error]);

    // Calculate suggested price
    const calculateSuggestedPrice = useCallback(async (stock: number, percent: number, baseUom: number, purchaseUom?: number) => {
        if (stock <= 0 || baseUom <= 0) return;

        setIsCalculating(true);
        try {
            const res = await productsApi.calculatePrice({
                StockPrice: stock,
                MarkupPercentage: percent,
                BaseUomId: baseUom,
                PurchaseUomId: purchaseUom
            });
            handleInputChange("SalePrice", res.SuggestedSalePrice);
            setDisplaySale(formatNumber(res.SuggestedSalePrice));
        } catch (err) {
            console.error("Error calculating price", err);
        } finally {
            setIsCalculating(false);
        }
    }, [handleInputChange]);

    const handlePriceTrigger = () => {
        if ((formData.StockPrice ?? 0) > 0) {
            calculateSuggestedPrice((formData.StockPrice ?? 0), markup, formData.BaseUomId, formData.PurchaseUomId);
        }
    };

    const handleClose = useCallback(() => {
        if (!submitting) {
            setIsClosing(true);
            setTimeout(() => {
                onClose();
                setIsClosing(false);
                // Reset form when closing
                setFormData({
                    Name: "",
                    ProductType: "Nguyên Liệu Thô",
                    BaseUomId: uoms.length > 0 ? uoms[0].Id : 0,
                    PurchaseUomId: undefined,
                    CategoryId: categories.find(c => c.IsActive)?.Id || 0,
                    StockPrice: 0,
                    SalePrice: 0,
                });
                setMarkup(30);
                setDisplayStock("");
                setDisplaySale("");
                setError(null);
            }, 200);
        }
    }, [submitting, onClose, uoms, categories]);

    // ESC key handler
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting && !loading && isOpen) {
                handleClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [submitting, loading, isOpen, handleClose]);

    // Shake animation trigger for errors
    useEffect(() => {
        if (error) {
            setShakeError(true);
            const timer = setTimeout(() => setShakeError(false), 400);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.Name.trim()) {
            setError("Vui lòng nhập tên sản phẩm!");
            nameInputRef.current?.focus();
            return;
        }
        if (!formData.CategoryId) {
            setError("Vui lòng chọn danh mục!");
            return;
        }
        if ((formData.StockPrice ?? 0) <= 0) {
            setError("Vui lòng nhập giá nhập!");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            onSave(formData);
            setShowSuccess(true);
            setTimeout(() => {
                handleClose();
                setShowSuccess(false);
            }, 1000);
        } catch (err: unknown) {
            setShowSuccess(false);
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra. Vui lòng thử lại.";
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <>
                <div className="fixed inset-0 h-screen bg-black/40 backdrop-blur-md z-[201]" />
                <div className="fixed inset-0 h-screen z-[202] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] p-10 shadow-2xl flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                </div>
            </>
        );
    }

    if (showSuccess) {
        return (
            <div className="fixed top-4 right-4 z-[203] animate-in slide-in-from-right-4 duration-300">
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Tạo thành công!</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="fixed inset-0 h-screen bg-black/40 backdrop-blur-md z-[101]"
                onClick={handleClose}
            />

            <div className="fixed inset-0 h-screen z-[202] flex items-center justify-center p-4 text-left">
                <form
                    ref={modalRef}
                    onSubmit={handleSubmit}
                    className={`relative bg-white w-full max-w-[calc(100%-2rem)] sm:max-w-2xl rounded-[3rem] p-6 sm:p-10 shadow-2xl flex flex-col max-h-[95vh] overflow-y-auto ${isClosing ? "animate-out fade-out zoom-out-95 duration-200" : "animate-in fade-in zoom-in-95 duration-300"
                        }`}
                >
                    <div className="text-center mb-6">
                        <h3 className="text-2xl font-black uppercase text-gray-900 tracking-tight">Thêm Sản Phẩm</h3>
                        <div className="h-1.5 w-10 bg-[#E4002B] mx-auto mt-2 rounded-full"></div>
                    </div>

                    {(error || externalError) && (
                        <div
                            role="alert"
                            className={`mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 ${shakeError ? "animate-shake" : ""}`}
                        >
                            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.002 0-1.335-.525-2.335-1.502-2.335h-2.002v-2h.002c.66 0 1.335.375 1.667 1.898l-1.337 2.22-2.22 2.087-.658-.134-1.31-.214-1.968-.29a11.5 11.5 0 01-6.95 2.271l-.003.002L7.002 17v-4.998c-.66 0-1.335-.375-1.667-1.898l2.22-2.22c.883-.657-1.898-.87 1.968-.29-.658-.133-1.31-.213-1.968-.29a11.5 11.5 0 016.95 2.271l.003-.002v4.998c-.66 0-1.335-.375-1.667-1.898l2.22-2.22c-.883-.657-1.898-.87 1.968-.29-.658-.133-1.31-.213-1.968-.29a11.5 11.5 0 00-6.95 2.271" />
                            </svg>
                            <span className="text-sm font-bold text-red-600">{error || externalError}</span>
                        </div>
                    )}

                    <div className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="product-name" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-1.5 block">
                                    Tên sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={nameInputRef}
                                    id="product-name"
                                    required
                                    type="text"
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-gray-800 outline-none focus:border-[#E4002B] focus:bg-white transition-all shadow-sm"
                                    placeholder="VD: Đùi gà tươi..."
                                    value={formData.Name}
                                    onChange={(e) => handleInputChange("Name", e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="product-type" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-1.5 block">
                                    Loại sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="product-type"
                                    required
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-[#E4002B] transition-all cursor-pointer appearance-none"
                                    value={formData.ProductType}
                                    onChange={(e) => handleInputChange("ProductType", e.target.value)}
                                >
                                    <option value="Nguyên Liệu Thô">Nguyên liệu thô</option>
                                    <option value="Thiết Bị">Thiết bị</option>
                                    <option value="Bao Bì">Bao bì</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="category" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-1.5 block">
                                    Danh mục <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="category"
                                    required
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-[#E4002B] transition-all cursor-pointer appearance-none"
                                    value={formData.CategoryId || ""}
                                    onChange={(e) => handleInputChange("CategoryId", e.target.value ? Number(e.target.value) : undefined)}
                                >
                                    <option value="">-- Chọn --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.Id} value={cat.Id}>
                                            {cat.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="base-uom" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-1.5 block">
                                    Đơn vị cơ bản (Bán) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="base-uom"
                                    required
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-[#E4002B] transition-all cursor-pointer appearance-none"
                                    value={formData.BaseUomId}
                                    onChange={(e) => handleInputChange("BaseUomId", Number(e.target.value))}
                                >
                                    {filteredBaseUoms.map((uom) => (
                                        <option key={uom.Id} value={uom.Id}>
                                            {uom.Symbol} {uom.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label htmlFor="purchase-uom" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-1.5 block">
                                    Đơn vị mua (Nhập) <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="purchase-uom"
                                    required
                                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-[#E4002B] transition-all cursor-pointer appearance-none"
                                    value={formData.PurchaseUomId || formData.BaseUomId}
                                    onChange={(e) => handleInputChange("PurchaseUomId", e.target.value ? Number(e.target.value) : undefined)}
                                >
                                    {filteredPurchaseUoms.map((uom) => (
                                        <option key={uom.Id} value={uom.Id}>
                                            {uom.Symbol} {uom.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Stock Price & Markup */}
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="stock-price" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-2 block tracking-widest">
                                            Giá nhập kho (VND) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-[#E4002B] transition-all">
                                            <input
                                                id="stock-price"
                                                type="text"
                                                autoComplete="off"
                                                className="w-full bg-transparent font-black text-lg text-gray-800 outline-none"
                                                placeholder="0"
                                                value={displayStock}
                                                onBlur={handlePriceTrigger}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    const formatted = formatNumber(val);
                                                    setDisplayStock(formatted);
                                                    handleInputChange("StockPrice", Number(val) || 0);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="markup" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-2 block tracking-widest">
                                            % Lợi nhuận (Markup)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-gray-50 rounded-2xl p-4 border-2 border-transparent focus-within:border-[#E4002B] transition-all flex items-center">
                                                <input
                                                    id="markup"
                                                    type="number"
                                                    min="0"
                                                    className="w-full bg-transparent font-black text-lg text-gray-800 outline-none"
                                                    value={markup}
                                                    onBlur={handlePriceTrigger}
                                                    onChange={(e) => setMarkup(Number(e.target.value))}
                                                />
                                                <span className="font-black text-gray-400 ml-2">%</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handlePriceTrigger}
                                                className="p-4 bg-gray-100 rounded-2xl text-gray-500 hover:bg-gray-200 transition-colors"
                                                title="Tính lại giá bán"
                                            >
                                                <svg className={`w-6 h-6 ${isCalculating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sale Price */}
                                <div className="space-y-4">
                                    <label htmlFor="sale-price" className="text-[10px] sm:text-xs font-black text-gray-500 uppercase ml-4 mb-2 block tracking-widest">
                                        Giá bán niêm yết (VND) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-100 focus-within:border-[#E4002B] transition-all shadow-sm h-[calc(100%-2rem-12px)] flex flex-col justify-center">
                                        <input
                                            id="sale-price"
                                            type="text"
                                            autoComplete="off"
                                            className="w-full bg-transparent font-black text-2xl text-[#E4002B] outline-none"
                                            placeholder="0"
                                            value={displaySale}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                const formatted = formatNumber(val);
                                                setDisplaySale(formatted);
                                                handleInputChange("SalePrice", Number(val) || 0);
                                            }}
                                        />
                                        <p className="text-[9px] font-bold text-gray-400 mt-2 uppercase tracking-tighter">
                                            {isCalculating ? "Đang tính toán..." : "Giá bán thủ công hoặc tự động"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting || isLoading}
                            className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || isLoading}
                            className="flex-[2] py-4 bg-[#E4002B] text-white rounded-2xl text-[11px] font-black uppercase shadow-xl shadow-red-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting || isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang lưu...
                                </>
                            ) : (
                                "Xác nhận tạo"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
