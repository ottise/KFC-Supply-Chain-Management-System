"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Package, X, Tag, Layers, Database, Banknote, Percent, Info, Loader2 } from "lucide-react";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { translateError } from "@/lib/utils/warehouseUtils";
import OdooDropdown from "@/components/common/OdooDropdown";
import { useToast } from "@/components/ui/ToastProvider";
import type { Category, CreateProductRequest, Uom } from "@/types/warehouse/masterData";

type ProductTypeOption = {
    Code: string;
    Name: string;
};

export interface CreateProductData {
    name: string;
    sku: string;
    unit: string;
    price: number;
    description?: string;
}

interface ProductCreateFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateProductRequest) => void;
    isLoading?: boolean;
    error?: string | null;
}

export default function CreateProductForm({
    isOpen,
    onClose,
    onSave,
    error: externalError = null
}: ProductCreateFormProps) {
    const { success: showSuccessToast, error: showErrorToast } = useToast();

    // Refs for focus management
    const nameInputRef = useRef<HTMLInputElement>(null);
    const stockInputRef = useRef<HTMLInputElement>(null);
    const saleInputRef = useRef<HTMLInputElement>(null);
    const markupInputRef = useRef<HTMLInputElement>(null);
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

    const [markup, setMarkup] = useState<number>(0);
    const [calculatedSalePrice, setCalculatedSalePrice] = useState<number | null>(null);

    // Display states for formatted prices
    const [displayStock, setDisplayStock] = useState("0");
    const [displaySale, setDisplaySale] = useState("0");
    const [displayMarkup, setDisplayMarkup] = useState("0");



    // Loading states
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    // Animation states
    const [isClosing, setIsClosing] = useState(false);

    // Master data states
    const [uoms, setUoms] = useState<Uom[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    // Error states
    const [error, setError] = useState<string | null>(null);
    const [shakeError, setShakeError] = useState(false);

    // Filtered UOMs logic
    const getUomCategory = useCallback((uomId: number) => uoms.find(u => u.Id === uomId)?.Category, [uoms]);

    const productTypeOptions: ProductTypeOption[] = [
        { Code: "Nguyên Liệu Thô", Name: "Nguyên liệu thô" },
        { Code: "Thiết Bị", Name: "Thiết bị" },
        { Code: "Bao Bì", Name: "Bao bì" },
    ];

    // Base UOM must always show all options from database
    const filteredBaseUoms = uoms;

    // Purchase UOM should follow selected Base UOM category
    // and allow selecting the same UOM as Base UOM
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
                const activeCats = categoriesData.filter((c) => c.IsActive);
                setCategories(activeCats);


                // Set default values (must use activeCats for find)
                if (uomsData.length > 0 && formData.BaseUomId === 0) {
                    setFormData(prev => ({
                        ...prev,
                        BaseUomId: uomsData[0].Id,
                        CategoryId: activeCats.length > 0 ? activeCats[0].Id : 0
                    }));
                }

                // Auto-focus on Name field after loading completes
                setTimeout(() => nameInputRef.current?.focus(), 100);
            } catch {
                console.error("Error fetching master data");
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

    // BE uses decimal(18,2) => max 9,999,999,999,999,999.99
    const MAX_MONEY_INTEGER_STR = "9999999999999999";
    const MAX_MARKUP_PERCENT = 100;
    const MIN_PRICE = 1000;
    const PRODUCT_NAME_REGEX = /^[\p{L}\p{N}\s]+$/u;

    // Format number with dots for thousands
    const formatNumber = useCallback((val: string | number) => {
        const num = String(val).replace(/\D/g, "");
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }, []);

    const formatCompactMoneyText = useCallback((value: number) => {
        const abs = Math.abs(value);
        if (abs >= 1_000_000_000) {
            const compact = value / 1_000_000_000;
            return `${Number(compact.toFixed(2)).toString()} Tỉ`;
        }
        if (abs >= 1_000_000) {
            const compact = value / 1_000_000;
            return `${Number(compact.toFixed(2)).toString()} Triệu`;
        }
        return formatNumber(value);
    }, [formatNumber]);

    const formatVnMoney = useCallback((value: number) => {
        const normalized = roundMoney2(value);
        const hasDecimal = Math.abs(normalized % 1) > 0;
        return normalized.toLocaleString("vi-VN", {
            minimumFractionDigits: hasDecimal ? 2 : 0,
            maximumFractionDigits: 2,
        });
    }, []);

    const isOverMaxMoney = (rawDigits: string) => {
        if (!rawDigits) return false;

        const normalized = rawDigits.replace(/^0+/, "") || "0";
        if (normalized.length !== MAX_MONEY_INTEGER_STR.length) {
            return normalized.length > MAX_MONEY_INTEGER_STR.length;
        }

        return normalized > MAX_MONEY_INTEGER_STR;
    };

    const moveCaretToEnd = (input: HTMLInputElement | null) => {
        if (!input) return;
        requestAnimationFrame(() => {
            const len = input.value.length;
            input.setSelectionRange(len, len);
        });
    };

    const roundMoney2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

    const getConvertedStockPrice = () => {
        const stock = Number(formData.StockPrice) || 0;
        const baseUomId = Number(formData.BaseUomId) || 0;
        const purchaseUomId = Number(formData.PurchaseUomId) || 0;

        if (stock <= 0 || baseUomId <= 0 || purchaseUomId <= 0) return 0;

        const baseUom = uoms.find((u) => u.Id === baseUomId);
        const purchaseUom = uoms.find((u) => u.Id === purchaseUomId);
        if (!baseUom || !purchaseUom) return stock;

        const baseFactor = baseUom.ConversionFactor && baseUom.ConversionFactor > 0 ? baseUom.ConversionFactor : 1;
        const purchaseFactor = purchaseUom.ConversionFactor && purchaseUom.ConversionFactor > 0 ? purchaseUom.ConversionFactor : 1;

        return roundMoney2((stock * purchaseFactor) / baseFactor);
    };

    const handleInputChange = useCallback((field: keyof CreateProductRequest, value: string | number | boolean | undefined) => {
        setFormData((prev) => {
            const nextValue = (field === "StockPrice" || field === "SalePrice")
                ? roundMoney2(Number(value) || 0)
                : value;

            const next = { ...prev, [field]: nextValue };

            // Keep BaseUom/PurchaseUom in same UOM category (same as BE rule)
            if (field === "BaseUomId" && value) {
                const baseCategory = getUomCategory(Number(value));
                const purchaseCategory = prev.PurchaseUomId ? getUomCategory(prev.PurchaseUomId) : undefined;

                if (purchaseCategory && baseCategory !== purchaseCategory) {
                    next.PurchaseUomId = undefined;
                }
            }

            return next;
        });

        if (error) setError(null);
    }, [getUomCategory, error]);

    // Calculate suggested price
    const calculateSuggestedPrice = useCallback(async (stock: number, percent: number, baseUom: number, purchaseUom?: number) => {
        if (stock <= 0 || baseUom <= 0) return;
        if (!purchaseUom || purchaseUom <= 0) {
            setError("Vui lòng chọn đơn vị mua để tính giá niêm yết.");
            return;
        }

        setIsCalculating(true);
        try {
            const res = await productsApi.calculatePrice({
                StockPrice: stock,
                MarkupPercentage: percent,
                BaseUomId: baseUom,
                PurchaseUomId: purchaseUom
            });
            handleInputChange("SalePrice", res.SuggestedSalePrice);
            setCalculatedSalePrice(roundMoney2(res.SuggestedSalePrice));
            setDisplaySale(
                res.SuggestedSalePrice >= 1_000_000
                    ? formatCompactMoneyText(res.SuggestedSalePrice)
                    : formatVnMoney(res.SuggestedSalePrice)
            );
        } finally {
            setIsCalculating(false);
        }
    }, [formatCompactMoneyText, formatVnMoney, handleInputChange]);

    // Trigger calculation when inputs change (debounced)
    useEffect(() => {
        // Automatically calculate price when stock price or markup changes
        // Use a 500ms debounce to avoid excessive API calls
        const timer = setTimeout(() => {
            const stock = formData.StockPrice;
            const baseUom = formData.BaseUomId;
            const purchaseUom = formData.PurchaseUomId;

            if (stock && stock > 0 && baseUom && baseUom > 0) {
                // Check if price is within system limits
                if (isOverMaxMoney(String(stock))) {
                    setError("Giá nhập vượt quá giới hạn hệ thống.");
                    return;
                }

                if (markup < 0 || markup > MAX_MARKUP_PERCENT) {
                    setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%.`);
                    return;
                }

                calculateSuggestedPrice(stock, markup, baseUom, purchaseUom);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.StockPrice, markup, formData.BaseUomId, formData.PurchaseUomId, calculateSuggestedPrice]);

    const handlePriceTrigger = () => {
        const stock = formData.StockPrice ?? 0;
        const baseUom = formData.BaseUomId ?? 0;
        const purchaseUom = formData.PurchaseUomId ?? 0;

        if (!purchaseUom || purchaseUom <= 0) {
            setError("Vui lòng chọn đơn vị mua để tính giá niêm yết.");
            return;
        }

        if (stock > 0 && baseUom > 0) {
            calculateSuggestedPrice(stock, markup, baseUom, purchaseUom);
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
                setMarkup(0);
                setCalculatedSalePrice(null);
                setDisplayStock("0");
                setDisplaySale("0");
                setDisplayMarkup("0");
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

        // Validation (align with BE rules)
        if (!formData.Name?.trim()) {
            setError("Vui lòng nhập tên sản phẩm!");
            nameInputRef.current?.focus();
            return;
        }

        if (!formData.ProductType) {
            setError("Vui lòng chọn loại sản phẩm!");
            return;
        }

        if (!PRODUCT_NAME_REGEX.test(formData.Name.trim())) {
            setError("Tên mặt hàng không được chứa ký tự đặc biệt.");
            nameInputRef.current?.focus();
            return;
        }

        if (!formData.BaseUomId || formData.BaseUomId <= 0) {
            setError("Vui lòng chọn đơn vị cơ bản hợp lệ!");
            return;
        }

        if (!formData.CategoryId || formData.CategoryId <= 0) {
            setError("Vui lòng chọn danh mục!");
            return;
        }

        if (!formData.PurchaseUomId || formData.PurchaseUomId <= 0) {
            setError("Vui lòng chọn đơn vị mua để tính giá niêm yết.");
            return;
        }

        {
            const baseCategory = getUomCategory(formData.BaseUomId);
            const purchaseCategory = getUomCategory(formData.PurchaseUomId);
            if (!baseCategory || !purchaseCategory || baseCategory !== purchaseCategory) {
                setError("Đơn vị mua và đơn vị cơ bản phải cùng nhóm đơn vị.");
                return;
            }
        }

        if (!formData.StockPrice || formData.StockPrice <= 0) {
            setError("Vui lòng nhập giá nhập kho!");
            return;
        }

        if (formData.StockPrice < MIN_PRICE) {
            setError(`Giá nhập kho tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
            return;
        }

        if (!formData.SalePrice || formData.SalePrice <= 0) {
            setError("Vui lòng nhập giá niêm yết!");
            return;
        }

        const normalizedSalePrice = roundMoney2(Number(formData.SalePrice) || 0);

        if (normalizedSalePrice < MIN_PRICE) {
            setError(`Giá niêm yết phải lớn hơn ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
            return;
        }

        if (markup === 0 && calculatedSalePrice !== null && normalizedSalePrice <= calculatedSalePrice) {
            if (normalizedSalePrice === calculatedSalePrice) {
                setError(`Giá niêm yết phải lớn hơn ${formatVnMoney(calculatedSalePrice)} VND`);
            } else {
                setError(`Giá niêm yết tối thiểu phải lớn hơn giá niêm yết gợi ý (${formatVnMoney(calculatedSalePrice)} VND).`);
            }
            return;
        }

        if (markup < 0 || markup > MAX_MARKUP_PERCENT) {
            setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%.`);
            return;
        }

        if (formData.SalePrice === formData.StockPrice) {
            setError("Giá niêm yết không được bằng giá nhập kho.");
            return;
        }

        if (formData.SalePrice < formData.StockPrice) {
            setError("Giá niêm yết phải lớn hơn giá nhập kho.");
            return;
        }

        const convertedStockPrice = getConvertedStockPrice();

        if (markup === 0 && normalizedSalePrice <= convertedStockPrice) {
            if (normalizedSalePrice === convertedStockPrice) {
                setError("Giá niêm yết không được bằng giá nhập kho sau quy đổi đơn vị.");
            } else {
                setError(`Giá niêm yết phải lớn hơn giá nhập sau quy đổi (${convertedStockPrice.toFixed(2)}).`);
            }
            return;
        }

        setSubmitting(true);
        setError(null);

        // Construct payload EXACTLY as backend expects (7 fields, PascalCase)
        const payload: CreateProductRequest = {
            Name: formData.Name,
            ProductType: formData.ProductType,
            BaseUomId: Number(formData.BaseUomId),
            CategoryId: Number(formData.CategoryId),
            SalePrice: Number(formData.SalePrice),
            StockPrice: Number(formData.StockPrice),
            IsActive: true
        };

        // PurchaseUomId is required on UI and must be explicitly selected by user.
        payload.PurchaseUomId = Number(formData.PurchaseUomId);

        try {
            await onSave(payload);
            showSuccessToast("Tạo thành công", "Sản phẩm đã được tạo.");
            handleClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } }; message?: string };
            console.error("Product creation failed:", error);
            if (error.response) {
                console.error("Server Error Data:", error.response.data);
            }
            const rawMsg = error.response?.data?.message || error.message || "Có lỗi xảy ra khi lưu.";
            const translated = translateError(rawMsg);
            setError(translated);
            showErrorToast("Tạo thất bại", translated);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[998]" />
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[1.5rem] p-7 shadow-2xl flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <form
                ref={modalRef}
                onSubmit={handleSubmit}
                className={`relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ${isClosing ? "animate-out fade-out zoom-out-95 duration-200" : ""
                    }`}
            >
                {/* Header - Brand Red */}
                <div className="bg-[#E4002B] p-6 text-white relative shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
                            <Package className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none">Thêm Nguyên Liệu</h2>
                            <div className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                Hệ thống quản lý mặt hàng
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white">
                    {(error || externalError) && (
                        <div
                            role="alert"
                            className={`p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 ${shakeError ? "animate-shake" : ""
                                }`}
                        >
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                            <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">
                                {error || externalError}
                            </span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                        {/* Name Field */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-[#E4002B]" /> Tên mặt hàng <span className="text-[#E4002B] ml-0.5">*</span>
                            </label>
                            <input
                                ref={nameInputRef}
                                id="product-name"
                                required
                                type="text"
                                disabled={submitting}
                                className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all shadow-sm"
                                placeholder="VD: Đùi gà góc tư..."
                                value={formData.Name}
                                onChange={(e) => handleInputChange("Name", e.target.value)}
                            />
                        </div>

                        {/* Product Type Dropdown */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3.5 h-3.5 text-[#E4002B]" /> Loại <span className="text-[#E4002B] ml-0.5">*</span>
                            </label>
                            <OdooDropdown<ProductTypeOption>
                                items={productTypeOptions}
                                value={productTypeOptions.find((x) => x.Code === formData.ProductType) || null}
                                onChange={(item) => handleInputChange("ProductType", item?.Code || "")}
                                displayField="Name"
                                secondaryField="Code"
                                placeholder="Loại sản phẩm"
                                className="w-full"
                                portal
                                disabled={submitting}
                            />
                        </div>

                        {/* Category Dropdown */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Database className="w-3.5 h-3.5 text-[#E4002B]" /> Danh mục <span className="text-[#E4002B] ml-0.5">*</span>
                            </label>
                            <OdooDropdown<Category>
                                items={categories}
                                value={categories.find((c) => c.Id === formData.CategoryId) || null}
                                onChange={(item) => handleInputChange("CategoryId", item?.Id ? Number(item.Id) : undefined)}
                                displayField="Name"
                                placeholder="Chọn danh mục"
                                className="w-full"
                                portal
                                disabled={submitting}
                            />
                        </div>

                        {/* UOM Fields */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-[#E4002B]" /> ĐV Cơ Bản (Bán) *
                            </label>
                            <OdooDropdown<Uom>
                                items={filteredBaseUoms}
                                value={uoms.find((u) => u.Id === formData.BaseUomId) || null}
                                onChange={(uom) => {
                                    if (!uom?.Id) return;
                                    const newBaseUomId = Number(uom.Id);
                                    const newBaseCategory = getUomCategory(newBaseUomId);
                                    const currPurchaseCat = formData.PurchaseUomId ? getUomCategory(formData.PurchaseUomId) : undefined;
                                    setFormData((prev) => ({
                                        ...prev,
                                        BaseUomId: newBaseUomId,
                                        PurchaseUomId: prev.PurchaseUomId && currPurchaseCat === newBaseCategory ? prev.PurchaseUomId : undefined,
                                    }));
                                    if (error) setError(null);
                                }}
                                displayField="Name"
                                secondaryField="Symbol"
                                hideSecondaryInTrigger={false}
                                className="w-full"
                                portal
                                disabled={submitting}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-[#E4002B]" /> ĐV Mua (Nhập) *
                            </label>
                            <OdooDropdown<Uom>
                                items={filteredPurchaseUoms}
                                value={uoms.find((u) => u.Id === formData.PurchaseUomId) || null}
                                onChange={(uom) => uom?.Id && handleInputChange("PurchaseUomId", Number(uom.Id))}
                                displayField="Name"
                                secondaryField="Symbol"
                                hideSecondaryInTrigger={false}
                                className="w-full"
                                portal
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    {/* Pricing Grid */}
                    <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Banknote className="w-3.5 h-3.5 text-[#E4002B]" /> Giá nhập (VND)
                            </label>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                                <input
                                    ref={stockInputRef}
                                    type="text"
                                    autoComplete="off"
                                    className="w-full bg-transparent font-black text-[15px] text-gray-900 outline-none"
                                    placeholder="0"
                                    value={displayStock}
                                    onBlur={(e) => {
                                        handlePriceTrigger();
                                        const num = Number(e.target.value.replace(/\D/g, "")) || 0;
                                        handleInputChange("StockPrice", num);
                                        setDisplayStock(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoneyText(num) : formatNumber(num)));
                                    }}
                                    onFocus={() => {
                                        const cur = formData.StockPrice ?? 0;
                                        setDisplayStock(cur > 0 ? formatNumber(cur) : "");
                                        moveCaretToEnd(stockInputRef.current);
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (isOverMaxMoney(val)) return;
                                        const num = Number(val) || 0;
                                        setDisplayStock(val ? formatNumber(val) : "");
                                        handleInputChange("StockPrice", num);
                                        if (error) setError(null);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                <Percent className="w-3.5 h-3.5 text-[#E4002B]" /> Lợi nhuận (%)
                            </label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/10 transition-all flex items-center shadow-sm">
                                    <input
                                        ref={markupInputRef}
                                        type="text"
                                        inputMode="numeric"
                                        className="w-full bg-transparent font-black text-[15px] text-gray-900 outline-none text-right"
                                        value={displayMarkup}
                                        onBlur={(e) => {
                                            handlePriceTrigger();
                                            const num = Number(e.target.value.replace(/\D/g, "")) || 0;
                                            setMarkup(num);
                                            setDisplayMarkup(num === 0 ? "0" : String(num));
                                        }}
                                        onFocus={() => {
                                            setDisplayMarkup(markup > 0 ? String(markup) : "");
                                            moveCaretToEnd(markupInputRef.current);
                                        }}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, "");
                                            if (raw === "") { setDisplayMarkup(""); setMarkup(0); return; }
                                            const val = Number(raw);
                                            if (val > MAX_MARKUP_PERCENT) return;
                                            setDisplayMarkup(String(val));
                                            setMarkup(val);
                                            if (error) setError(null);
                                        }}
                                    />
                                    <span className="font-black text-gray-400 ml-1.5">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-[#E4002B] uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5" /> Giá niêm yết
                            </label>
                            <div className="bg-red-50/20 rounded-xl p-4 border border-red-100 focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                                <input
                                    ref={saleInputRef}
                                    type="text"
                                    autoComplete="off"
                                    className={`w-full bg-transparent font-black text-[15px] outline-none text-gray-900 ${isCalculating ? 'opacity-30' : ''}`}
                                    placeholder="0"
                                    value={displaySale}
                                    onBlur={(e) => {
                                        const num = Number(e.target.value.replace(/\D/g, "")) || 0;
                                        handleInputChange("SalePrice", num);
                                        setDisplaySale(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoneyText(num) : formatNumber(num)));
                                    }}
                                    onFocus={() => {
                                        const cur = formData.SalePrice ?? 0;
                                        setDisplaySale(cur > 0 ? formatNumber(cur) : "");
                                        moveCaretToEnd(saleInputRef.current);
                                    }}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "");
                                        if (isOverMaxMoney(val)) return;
                                        const num = Number(val) || 0;
                                        setDisplaySale(val ? formatNumber(val) : "");
                                        handleInputChange("SalePrice", num);
                                        if (error) setError(null);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - KFC Style Action */}
                <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-end shrink-0">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-10 py-3 text-[13px] font-black text-white uppercase bg-[#E4002B] rounded-lg shadow-md shadow-red-200 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                                Đang khởi tạo...
                            </>
                        ) : (
                            <>
                                <Package className="w-5 h-5 text-white" />
                                Xác nhận thêm nguyên liệu
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
