"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Package, Tag, Layers, Database, Banknote, Percent, Info, Loader2, X } from "lucide-react";
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
    isLoading = false,
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
    }, [isOpen, formData.BaseUomId]);

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
        if (value >= 1_000_000_000) {
            const compact = value / 1_000_000_000;
            return `${Number(compact.toFixed(2)).toString()} Tỉ`;
        }
        if (value >= 1_000_000) {
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

    const parseMoneyInput = (raw: string) => {
        const cleaned = raw.replace(/\s/g, "").replace(/[^\d,.-]/g, "");
        if (!cleaned) return 0;

        let normalized = cleaned;
        const hasComma = cleaned.includes(",");
        const hasDot = cleaned.includes(".");

        if (hasComma && hasDot) {
            normalized = cleaned.replace(/\./g, "").replace(",", ".");
        } else if (hasComma) {
            normalized = cleaned.replace(",", ".");
        }

        const value = Number(normalized);
        return Number.isFinite(value) ? value : 0;
    };

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

        // Defensive search for both uppercase Id and lowercase id (some APIs vary)
        const baseUom = uoms.find((u: Uom) => u.Id === baseUomId);
        const purchaseUom = uoms.find((u: Uom) => u.Id === purchaseUomId);

        if (!baseUom || !purchaseUom) return stock;

        const baseRatio = (baseUom.ConversionRatio ?? baseUom.ConversionFactor ?? 1) || 1;
        const purchaseRatio = (purchaseUom.ConversionRatio ?? purchaseUom.ConversionFactor ?? 1) || 1;

        const result = roundMoney2((stock * baseRatio) / purchaseRatio);
        console.log("Debug Calculation:", {
            stock,
            baseRatio,
            purchaseRatio,
            formula: `(${stock} * ${baseRatio}) / ${purchaseRatio}`,
            result
        });
        return result;
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
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            const rawMsg = axiosErr?.response?.data?.message || axiosErr?.message || "Không thể tính giá sản phẩm.";
            setError(translateError(rawMsg));
        } finally {
            setIsCalculating(false);
        }
    }, [formatCompactMoneyText, formatVnMoney, handleInputChange]);

    // Price calculation is only triggered manually via the calculator button

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

        if (!formData.StockPrice || formData.StockPrice < MIN_PRICE) {
            setError(`Giá nhập kho tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
            return;
        }

        if (!formData.SalePrice || formData.SalePrice < MIN_PRICE) {
            setError(`Giá niêm yết tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
            return;
        }

        const normalizedSalePrice = roundMoney2(Number(formData.SalePrice) || 0);
        const convertedStockPrice = getConvertedStockPrice();
        const isSameUom = formData.BaseUomId === formData.PurchaseUomId;

        console.log("Debug Validation:", {
            SalePrice: formData.SalePrice,
            normalizedSalePrice,
            convertedStockPrice,
            isSameUom,
            BaseUomId: formData.BaseUomId,
            PurchaseUomId: formData.PurchaseUomId
        });

        // Check MIN_PRICE on sale price
        if (normalizedSalePrice < MIN_PRICE) {
            setError(`Giá niêm yết phải lớn hơn ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
            return;
        }

        if (isSameUom) {
            if (normalizedSalePrice === formData.StockPrice) {
                setError("Giá niêm yết không được bằng giá nhập kho.");
                return;
            }
            if (normalizedSalePrice < formData.StockPrice) {
                setError("Giá niêm yết phải lớn hơn giá nhập kho.");
                return;
            }
        } else {
            // Different UOM
            if (normalizedSalePrice === convertedStockPrice) {
                setError("Giá niêm yết không được bằng giá nhập kho sau quy đổi đơn vị.");
                return;
            }
            if (normalizedSalePrice < convertedStockPrice) {
                setError(`Giá niêm yết phải lớn hơn giá nhập sau quy đổi (${formatVnMoney(convertedStockPrice)}).`);
                return;
            }
        }

        if (markup === 0 && calculatedSalePrice !== null && normalizedSalePrice < calculatedSalePrice) {
            setError(`Giá niêm yết tối thiểu phải bằng hoặc lớn hơn giá niêm yết gợi ý (${formatVnMoney(calculatedSalePrice)} VND).`);
            return;
        }

        if (markup < 0 || markup > MAX_MARKUP_PERCENT) {
            setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%.`);
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

        console.log("Debug Final Payload to Server:", payload);

        try {
            await onSave(payload);
            showSuccessToast("Tạo thành công", "Sản phẩm đã được tạo.");
            handleClose();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            console.error("Product creation failed:", axiosErr);
            if (axiosErr.response) {
                console.error("Server Error Data:", axiosErr.response.data);
            }
            const rawMsg = axiosErr.response?.data?.message || axiosErr.message || "Có lỗi xảy ra khi lưu.";
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
                    <div className="bg-white w-full max-w-md rounded-xl p-7 shadow-2xl flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mb-4"></div>
                        <span className="text-sm font-bold text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                </div>
            </>
        );
    }


    return (
        <>
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-md z-[998] animate-in fade-in duration-200"
                onClick={handleClose}
            />

            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <form
                    ref={modalRef}
                    onSubmit={handleSubmit}
                    className={`relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col h-[700px] overflow-hidden ${isClosing ? "animate-out fade-out zoom-out-95 duration-200" : "animate-in fade-in zoom-in-95 duration-300"
                        }`}
                >
                    {/* Header */}
                    <div className="bg-[#E4002B] p-5 text-white relative flex-shrink-0 text-left">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                                    <Package className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase tracking-widest leading-none">Thêm Nguyên Liệu</h2>
                                    <div className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Hệ thống quản lý mặt hàng
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="px-5 py-4 flex-1 flex flex-col overflow-hidden">
                        <div className="h-10 mb-3 flex-shrink-0 w-full">
                            {(error || externalError) && (
                                <div
                                    role="alert"
                                    className={`p-3 h-full w-full bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 ${shakeError ? "animate-shake" : ""}`}
                                >
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                                    <span className="text-[11px] font-bold text-red-600 line-clamp-1">{error || externalError}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 flex-1 overflow-hidden">
                            {/* Row 1: Name */}
                            <div className="md:col-span-2 space-y-2">
                                <label htmlFor="product-name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-[#E4002B]" /> Tên mặt hàng <span className="text-red-500">*</span>
                                </label>
                                <input
                                    ref={nameInputRef}
                                    id="product-name"
                                    required
                                    type="text"
                                    className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                                    placeholder="VD: Đùi gà..."
                                    value={formData.Name}
                                    onChange={(e) => handleInputChange("Name", e.target.value)}
                                />
                            </div>

                            {/* Row 2: Type & Category */}
                            <div className="space-y-2">
                                <label htmlFor="product-type" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Info className="w-3 h-3 text-[#E4002B]" /> Loại sản phẩm <span className="text-red-500">*</span>
                                </label>
                                <OdooDropdown<ProductTypeOption>
                                    items={productTypeOptions}
                                    value={productTypeOptions.find((x) => x.Code === formData.ProductType) || null}
                                    onChange={(item) => handleInputChange("ProductType", item?.Code || "")}
                                    displayField="Name"
                                    secondaryField="Code"
                                    placeholder="Chọn loại sản phẩm"
                                    className="w-full"
                                    portal
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="category" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Database className="w-3 h-3 text-[#E4002B]" /> Danh mục <span className="text-red-500">*</span>
                                </label>
                                <OdooDropdown<Category>
                                    items={categories}
                                    value={categories.find((c) => c.Id === formData.CategoryId) || null}
                                    onChange={(item) => handleInputChange("CategoryId", item?.Id ? Number(item.Id) : undefined)}
                                    displayField="Name"
                                    placeholder="Chọn danh mục"
                                    className="w-full"
                                    portal
                                />
                            </div>

                            {/* Row 3: UOMs */}
                            <div className="space-y-2">
                                <label htmlFor="base-uom" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="w-3 h-3 text-[#E4002B]" /> Đơn vị cơ bản (Bán) *
                                </label>
                                <OdooDropdown<Uom>
                                    items={filteredBaseUoms}
                                    value={uoms.find((u) => u.Id === formData.BaseUomId) || null}
                                    onChange={(uom) => {
                                        if (!uom?.Id) return;

                                        const newBaseUomId = Number(uom.Id);
                                        const newBaseCategory = getUomCategory(newBaseUomId);
                                        const currentPurchaseCategory = formData.PurchaseUomId
                                            ? getUomCategory(formData.PurchaseUomId)
                                            : undefined;

                                        setFormData((prev) => ({
                                            ...prev,
                                            BaseUomId: newBaseUomId,
                                            PurchaseUomId:
                                                prev.PurchaseUomId && currentPurchaseCategory === newBaseCategory
                                                    ? prev.PurchaseUomId
                                                    : undefined,
                                        }));
                                        if (error) setError(null);
                                    }}
                                    displayField="Name"
                                    secondaryField="Symbol"
                                    hideSecondaryInTrigger={false}
                                    placeholder="Chọn đơn vị cơ bản"
                                    className="w-full"
                                    portal
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="purchase-uom" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers className="w-3 h-3 text-[#E4002B]" /> Đơn vị mua (Nhập) *
                                </label>
                                <OdooDropdown<Uom>
                                    items={filteredPurchaseUoms}
                                    value={uoms.find((u) => u.Id === formData.PurchaseUomId) || null}
                                    onChange={(uom) => {
                                        if (!uom?.Id) return;
                                        handleInputChange("PurchaseUomId", Number(uom.Id));
                                    }}
                                    displayField="Name"
                                    secondaryField="Symbol"
                                    hideSecondaryInTrigger={false}
                                    placeholder="Chọn đơn vị mua"
                                    className="w-full"
                                    portal
                                />
                            </div>
                        </div>

                        {/* Row 4: Pricing Section (Compact 3-column) */}
                        <div className="pt-3 border-t border-gray-100 flex-shrink-0">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-1.5">
                                    <label htmlFor="stock-price" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Banknote className="w-3 h-3 text-[#E4002B]" /> Giá nhập (VND) *
                                    </label>
                                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                                        <input
                                            ref={stockInputRef}
                                            id="stock-price"
                                            type="text"
                                            autoComplete="off"
                                            className="w-full bg-transparent font-black text-[13px] text-gray-800 outline-none"
                                            placeholder="0"
                                            value={displayStock}
                                            onBlur={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                const num = Number(val) || 0;
                                                handleInputChange("StockPrice", num);
                                                setDisplayStock(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoneyText(num) : formatNumber(num)));
                                            }}
                                            onFocus={() => {
                                                const current = formData.StockPrice ?? 0;
                                                const nextValue = current > 0 ? formatNumber(current) : "";
                                                setDisplayStock(nextValue);
                                                moveCaretToEnd(stockInputRef.current);
                                            }}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");

                                                if (isOverMaxMoney(val)) {
                                                    setError("Giá nhập vượt quá giới hạn hệ thống (tối đa 9,999,999,999,999,999.99).");
                                                    return;
                                                }

                                                const num = Number(val) || 0;
                                                setDisplayStock(val ? formatNumber(val) : "");
                                                handleInputChange("StockPrice", num);

                                                if (num > 0 && num < MIN_PRICE) {
                                                    setError(`Giá nhập kho tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
                                                    return;
                                                }

                                                if (error) setError(null);
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="markup" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Percent className="w-3 h-3 text-[#E4002B]" /> Lợi nhuận
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100 focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/10 transition-all flex items-center shadow-sm">
                                            <input
                                                ref={markupInputRef}
                                                id="markup"
                                                type="text"
                                                inputMode="numeric"
                                                className="w-full bg-transparent font-black text-[13px] text-gray-800 outline-none"
                                                value={displayMarkup}
                                                onBlur={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    const num = Number(val) || 0;
                                                    setMarkup(num);
                                                    setDisplayMarkup(num === 0 ? "0" : String(num));
                                                }}
                                                onFocus={() => {
                                                    setDisplayMarkup(markup > 0 ? String(markup) : "");
                                                    moveCaretToEnd(markupInputRef.current);
                                                }}
                                                onChange={(e) => {
                                                    const rawDigits = e.target.value.replace(/\D/g, "");

                                                    if (rawDigits === "") {
                                                        setDisplayMarkup("");
                                                        setMarkup(0);
                                                        if (error) setError(null);
                                                        return;
                                                    }

                                                    const val = Number(rawDigits);
                                                    if (!Number.isFinite(val) || val < 0 || val > MAX_MARKUP_PERCENT) {
                                                        setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%`);
                                                        return;
                                                    }

                                                    setDisplayMarkup(String(val));
                                                    setMarkup(val);
                                                    if (error) setError(null);
                                                }}
                                            />
                                            <span className="font-black text-gray-400 ml-1 text-xs">%</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handlePriceTrigger}
                                            className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-[#E4002B] shadow-sm transition-all active:scale-95 flex-shrink-0"
                                        >
                                            <svg className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="sale-price" className="text-[10px] font-black text-[#E4002B] uppercase tracking-widest flex items-center gap-1.5">
                                        <Tag className="w-3 h-3" /> Giá niêm yết *
                                    </label>
                                    <div className="bg-red-50/30 rounded-xl p-3 border border-red-100 focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                                        <input
                                            ref={saleInputRef}
                                            id="sale-price"
                                            type="text"
                                            autoComplete="off"
                                            className="w-full bg-transparent font-black text-[13px] text-[#E4002B] outline-none"
                                            value={displaySale}
                                            onBlur={(e) => {
                                                const raw = e.target.value;
                                                const num = parseMoneyInput(raw);
                                                handleInputChange("SalePrice", num);
                                                setDisplaySale(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoneyText(num) : formatVnMoney(num)));
                                            }}
                                            onFocus={() => {
                                                const current = formData.SalePrice ?? 0;
                                                const nextValue = current > 0 ? formatVnMoney(current) : "";
                                                setDisplaySale(nextValue);
                                                moveCaretToEnd(saleInputRef.current);
                                            }}
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                const integerPartDigits = raw.split(/[.,]/)[0]?.replace(/\D/g, "") || "";

                                                if (isOverMaxMoney(integerPartDigits)) {
                                                    setError("Giá niêm yết vượt quá giới hạn hệ thống (tối đa 9,999,999,999,999,999.99).");
                                                    return;
                                                }

                                                const num = parseMoneyInput(raw);
                                                setDisplaySale(raw);
                                                handleInputChange("SalePrice", num);

                                                if (markup === 0 && calculatedSalePrice !== null && num > 0) {
                                                    const normalizedSalePrice = roundMoney2(num);
                                                    if (normalizedSalePrice <= calculatedSalePrice) {
                                                        if (normalizedSalePrice === calculatedSalePrice) {
                                                            setError(`Giá niêm yết không được bằng giá niêm yết gợi ý (${calculatedSalePrice.toLocaleString("vi-VN")} VND). Vui lòng nhập lớn hơn.`);
                                                        } else {
                                                            setError(`Giá niêm yết tối thiểu phải lớn hơn giá niêm yết gợi ý (${calculatedSalePrice.toLocaleString("vi-VN")} VND).`);
                                                        }
                                                        return;
                                                    }
                                                }

                                                if (num > 0 && num < MIN_PRICE) {
                                                    setError(`Giá niêm yết phải lớn hơn ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
                                                    return;
                                                }

                                                if (num > 0 && (formData.StockPrice ?? 0) > 0 && num <= (formData.StockPrice ?? 0)) {
                                                    if (num === (formData.StockPrice ?? 0)) {
                                                        setError("Giá niêm yết không được bằng giá nhập kho.");
                                                    } else {
                                                        setError("Giá niêm yết phải lớn hơn giá nhập kho.");
                                                    }
                                                    return;
                                                }

                                                const purchaseUomId = formData.PurchaseUomId ?? 0;
                                                if (markup === 0 && num > 0 && purchaseUomId > 0) {
                                                    const convertedStockPrice = getConvertedStockPrice();
                                                    const normalizedSalePrice = roundMoney2(num);

                                                    if ((formData.StockPrice || 0) > 0 && normalizedSalePrice <= convertedStockPrice) {
                                                        if (normalizedSalePrice === convertedStockPrice) {
                                                            setError("Giá niêm yết không được bằng giá nhập kho sau quy đổi đơn vị.");
                                                        } else {
                                                            setError(`Giá niêm yết phải lớn hơn giá nhập sau quy đổi (${convertedStockPrice.toFixed(2)}).`);
                                                        }
                                                        return;
                                                    }
                                                }

                                                if (error) setError(null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] font-black text-red-400 mt-2 uppercase tracking-widest flex items-center gap-2 justify-center">
                                <Info className="w-3 h-3" /> {isCalculating ? "Đang tính toán..." : "Gợi ý hoặc nhập thủ công"}
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 bg-gray-50 flex-shrink-0">
                        <button
                            type="submit"
                            disabled={submitting || isLoading}
                            className="w-full py-3 bg-[#E4002B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-[#C80025] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {submitting || isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <Package className="w-4 h-4 text-white" />
                            )}
                            {submitting || isLoading ? "Đang lưu hệ thống..." : "Xác nhận tạo mới"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
