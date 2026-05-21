"use client";

import { useState, useEffect, useRef, useCallback, useMemo, type FormEvent } from "react";
import { masterDataApi } from "@/lib/api/warehouse/masterDataApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { translateError } from "@/lib/utils/warehouseUtils";
import OdooDropdown from "@/components/common/OdooDropdown";
import { useToast } from "@/components/ui/ToastProvider";
import type { Category, UpdateProductRequest, Uom } from "@/types/warehouse/masterData";
import {
  Package,
  Tag,
  Layers,
  Database,
  Banknote,
  Percent,
  Info,
  Loader2,
  Edit3,
  X,
} from "lucide-react";
import type { Product } from "@/types/warehouse/masterData";

type ProductTypeOption = {
  Code: string;
  Name: string;
};

interface ProductDetailBoxProps {
  product: Product;
  close: () => void;
  onUpdate: () => void;
}

const productTypeOptions: ProductTypeOption[] = [
  { Code: "Nguyên Liệu Thô", Name: "Nguyên liệu thô" },
  { Code: "Thiết Bị", Name: "Thiết bị" },
  { Code: "Bao Bì", Name: "Bao bì" },
];

// Move pure formatting functions outside to prevent infinite loops
// BE uses decimal(18,2) => max 9,999,999,999,999,999.99
const MAX_MONEY_INTEGER_STR = "9999999999999999";
const MAX_MARKUP_PERCENT = 100;
const MIN_PRICE = 1000;
const PRODUCT_NAME_REGEX = /^[\p{L}\p{N}\s]+$/u;

const roundMoney2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

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

  return formatVnMoney(numeric);
};

const formatVnMoney = (value: number) => {
  const rounded = roundMoney2(value);
  return rounded.toLocaleString("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const parseMoneyInput = (raw: string) => {
  const normalized = raw
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? roundMoney2(parsed) : 0;
};

export default function ProductDetailBox({ product, close, onUpdate }: ProductDetailBoxProps) {
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const initialData = useMemo(() => ({
    Id: Number(product.Id ?? 0),
    Name: product.Name ?? "",
    ProductType: product.ProductType ?? "Nguyên Liệu Thô",
    BaseUomId: Number(product.BaseUomId ?? 0),
    PurchaseUomId: product.PurchaseUomId
      ? Number(product.PurchaseUomId)
      : undefined,
    CategoryId: Number(product.CategoryId ?? 0),
    StockPrice: Number(product.StockPrice ?? 0),
    SalePrice: Number(product.SalePrice ?? 0),
    IsActive: product.IsActive ?? true,
  }), [product]);

  const [formData, setFormData] = useState<UpdateProductRequest>(initialData);



  const [uoms, setUoms] = useState<Uom[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const modalViewRef = useRef<HTMLDivElement>(null);
  const modalEditRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const markupInputRef = useRef<HTMLInputElement>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [markup, setMarkup] = useState(0);
  const [displayStock, setDisplayStock] = useState("0");
  const [displaySale, setDisplaySale] = useState("0");
  const [displayMarkup, setDisplayMarkup] = useState("0");
  const [calculatedSalePrice, setCalculatedSalePrice] = useState<number | null>(null);

  const getUomCategory = useCallback((uomId: number | undefined) => {
    if (!uomId || isNaN(uomId) || uomId <= 0) return undefined;
    return uoms.find((u) => u.Id === uomId)?.Category;
  }, [uoms]);

  const filteredBaseUoms = useMemo(() => uoms, [uoms]);
  const filteredPurchaseUoms = useMemo(() => {
    const baseCategory = getUomCategory(formData.BaseUomId);
    return uoms.filter((u) => u.Category === baseCategory);
  }, [uoms, formData.BaseUomId, getUomCategory]);

  const isOverMaxMoney = (rawDigits: string) => {
    if (!rawDigits) return false;

    const normalized = rawDigits.replace(/^0+/, "") || "0";
    if (normalized.length !== MAX_MONEY_INTEGER_STR.length) {
      return normalized.length > MAX_MONEY_INTEGER_STR.length;
    }

    return normalized > MAX_MONEY_INTEGER_STR;
  };

  const getConvertedStockPrice = () => {
    const stock = Number(formData.StockPrice) || 0;
    const baseUomId = Number(formData.BaseUomId) || 0;
    const purchaseUomId = Number(formData.PurchaseUomId) || 0;

    if (stock <= 0 || baseUomId <= 0 || purchaseUomId <= 0) return 0;

    console.log("Debug IDs (Detail):", { baseUomId, purchaseUomId });
    // Defensive search for both uppercase Id and lowercase id
    const baseUom = uoms.find((u: Uom) => u.Id === baseUomId);
    const purchaseUom = uoms.find((u: Uom) => u.Id === purchaseUomId);

    console.log("Debug Uoms Found (Detail):", { baseUom, purchaseUom });

    if (!baseUom || !purchaseUom) {
      console.warn("UOM not found (Detail), falling back to raw stock price");
      return stock;
    }

    const baseRatio = (baseUom.ConversionRatio ?? baseUom.ConversionFactor ?? 1) || 1;
    const purchaseRatio = (purchaseUom.ConversionRatio ?? purchaseUom.ConversionFactor ?? 1) || 1;

    const result = roundMoney2((stock * baseRatio) / purchaseRatio);
    console.log("Debug Calculation (Detail):", {
      stock,
      baseRatio,
      purchaseRatio,
      formula: `(${stock} * ${baseRatio}) / ${purchaseRatio}`,
      result
    });
    return result;
  };

  useEffect(() => {
    setFormData(initialData);
    const stock = Number(initialData.StockPrice) || 0;
    const sale = Number(initialData.SalePrice) || 0;
    setDisplayStock(stock === 0 ? "0" : (stock >= 1_000_000 ? formatCompactMoney(stock) : formatVnMoney(stock)));
    setDisplaySale(sale === 0 ? "0" : (sale >= 1_000_000 ? formatCompactMoney(sale) : formatVnMoney(sale)));
    setDisplayMarkup("0");
    setCalculatedSalePrice(null);
  }, [initialData]);

  const fetchMasterData = useCallback(async () => {
    try {
      const [uomsData, categoriesData] = await Promise.all([
        masterDataApi.getUoms(),
        masterDataApi.getCategories(),
      ]);
      setUoms(uomsData);
      setCategories(categoriesData.filter((c) => c.IsActive));
      if (isEditing) setTimeout(() => nameInputRef.current?.focus(), 100);
    } catch (err) {
      console.error("ProductDetailBox - Fetch Error:", err);
      setError("Không thể tải dữ liệu.");
    }
  }, [isEditing]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const handleInputChange = useCallback((field: keyof UpdateProductRequest, value: string | number | boolean | undefined) => {
    setFormData((prev) => {
      const nextValue = (field === "StockPrice" || field === "SalePrice")
        ? roundMoney2(Number(value) || 0)
        : value;

      const newData = { ...prev, [field]: nextValue };

      if (field === "BaseUomId" && value) {
        const newBaseCategory = getUomCategory(Number(value));
        const currentPurchaseCategory = getUomCategory(prev.PurchaseUomId);

        if (currentPurchaseCategory && newBaseCategory !== currentPurchaseCategory) {
          newData.PurchaseUomId = undefined;
        }
      }

      return newData;
    });

    if (error) setError(null);
  }, [getUomCategory, error]);

  const calculateSuggestedPrice = useCallback(
    async (stock: number, percent: number, baseUom: number, purchaseUom?: number) => {
      // Robust check for invalid or missing inputs
      if (!stock || stock <= 0 || !baseUom || baseUom <= 0 || isNaN(stock) || isNaN(baseUom)) {
        return;
      }

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
          PurchaseUomId: purchaseUom,
        });

        handleInputChange("SalePrice", res.SuggestedSalePrice);
        setCalculatedSalePrice(roundMoney2(res.SuggestedSalePrice));
        setDisplaySale(
          res.SuggestedSalePrice >= 1_000_000
            ? formatCompactMoney(res.SuggestedSalePrice)
            : formatVnMoney(res.SuggestedSalePrice)
        );
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        const rawMsg = axiosErr?.response?.data?.message || axiosErr?.message || "Không thể tính giá sản phẩm.";
        setError(translateError(rawMsg));
      } finally {
        setIsCalculating(false);
      }
    },
    [handleInputChange]
  );

  const handlePriceTrigger = () => {
    const stockPrice = Number(formData.StockPrice);
    const baseUomId = Number(formData.BaseUomId || product.BaseUomId);
    const purchaseUomId = formData.PurchaseUomId ? Number(formData.PurchaseUomId) : undefined;

    if (!purchaseUomId || purchaseUomId <= 0) {
      setError("Vui lòng chọn đơn vị mua để tính giá niêm yết.");
      return;
    }

    if (stockPrice > 0) {
      if (isOverMaxMoney(String(stockPrice))) {
        setError("Giá nhập vượt quá giới hạn hệ thống.");
        return;
      }

      if (markup < 0 || markup > MAX_MARKUP_PERCENT) {
        setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%.`);
        return;
      }

      calculateSuggestedPrice(
        stockPrice,
        markup,
        baseUomId,
        purchaseUomId
      );
    }
  };

  const handleClose = () => {
    if (!submitting && !isEditing) {
      setIsClosing(true);
      setTimeout(() => close(), 200);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(initialData);
    const currentStock = initialData.StockPrice || 0;
    const currentSale = initialData.SalePrice || 0;
    setDisplayStock(currentStock === 0 ? "0" : (currentStock >= 1_000_000 ? formatCompactMoney(currentStock) : formatVnMoney(currentStock)));
    setDisplaySale(currentSale === 0 ? "0" : (currentSale >= 1_000_000 ? formatCompactMoney(currentSale) : formatVnMoney(currentSale)));
    setMarkup(0);
    setDisplayMarkup("0");
    setCalculatedSalePrice(null);
    setError(null);
  };

  const validateForm = () => {
    if (!formData.Name?.trim()) {
      setError("Vui lòng nhập tên sản phẩm!");
      nameInputRef.current?.focus();
      return false;
    }

    if (!formData.ProductType) {
      setError("Vui lòng chọn loại sản phẩm!");
      return false;
    }

    if (!PRODUCT_NAME_REGEX.test(formData.Name.trim())) {
      setError("Tên mặt hàng không được chứa ký tự đặc biệt.");
      nameInputRef.current?.focus();
      return false;
    }

    if (!formData.BaseUomId || formData.BaseUomId <= 0) {
      setError("Vui lòng chọn đơn vị cơ bản hợp lệ!");
      return false;
    }

    if (!formData.CategoryId || formData.CategoryId <= 0) {
      setError("Vui lòng chọn danh mục!");
      return false;
    }

    if (!formData.PurchaseUomId || formData.PurchaseUomId <= 0) {
      setError("Vui lòng chọn đơn vị mua để tính giá niêm yết.");
      return false;
    }

    {
      const baseCategory = getUomCategory(formData.BaseUomId);
      const purchaseCategory = getUomCategory(formData.PurchaseUomId);
      if (!baseCategory || !purchaseCategory || baseCategory !== purchaseCategory) {
        setError("Đơn vị mua và đơn vị cơ bản phải cùng nhóm đơn vị.");
        return false;
      }
    }

    if (!formData.StockPrice || formData.StockPrice < MIN_PRICE) {
      setError(`Giá nhập kho tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
      return false;
    }

    if (!formData.SalePrice || formData.SalePrice < MIN_PRICE) {
      setError(`Giá niêm yết tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
      return false;
    }

    const normalizedSalePrice = roundMoney2(Number(formData.SalePrice) || 0);
    const convertedStockPrice = getConvertedStockPrice();
    const isSameUom = formData.BaseUomId === formData.PurchaseUomId;

    // Check MIN_PRICE on sale price
    if (normalizedSalePrice < MIN_PRICE) {
      setError(`Giá niêm yết phải lớn hơn ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
      return false;
    }

    if (isSameUom) {
      const rawStock = roundMoney2(Number(formData.StockPrice) || 0);
      if (normalizedSalePrice === rawStock) {
        setError("Giá niêm yết không được bằng giá nhập kho.");
        return false;
      }
      if (normalizedSalePrice < rawStock) {
        setError("Giá niêm yết phải lớn hơn giá nhập kho.");
        return false;
      }
    } else {
      // Different UOM
      if (normalizedSalePrice === convertedStockPrice) {
        setError("Giá niêm yết không được bằng giá nhập kho sau quy đổi đơn vị.");
        return false;
      }
      if (normalizedSalePrice < convertedStockPrice) {
        setError(`Giá niêm yết phải lớn hơn giá nhập sau quy đổi (${formatVnMoney(convertedStockPrice)}).`);
        return false;
      }
    }

    if (markup === 0 && calculatedSalePrice !== null && normalizedSalePrice < calculatedSalePrice) {
      setError(`Giá niêm yết tối thiểu phải bằng hoặc lớn hơn giá niêm yết gợi ý (${formatVnMoney(calculatedSalePrice)} VND).`);
      return false;
    }

    if (markup < 0 || markup > MAX_MARKUP_PERCENT) {
      setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%.`);
      return false;
    }

    return true;
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload: UpdateProductRequest = {
        Id: Number(formData.Id),
        Name: formData.Name,
        ProductType: formData.ProductType,
        BaseUomId: Number(formData.BaseUomId),
        PurchaseUomId: Number(formData.PurchaseUomId),
        CategoryId: Number(formData.CategoryId),
        StockPrice: Number(formData.StockPrice),
        SalePrice: Number(formData.SalePrice),
        IsActive: formData.IsActive,
      };

      await productsApi.updateProduct(product.Id, payload);

      showSuccessToast("Cập nhật thành công", "Thông tin sản phẩm đã được cập nhật.");
      onUpdate();
      setIsEditing(false);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const rawMsg = axiosErr?.response?.data?.message || axiosErr?.message || "Có lỗi xảy ra khi lưu.";
      const translated = translateError(rawMsg);
      setError(translated);
      showErrorToast("Cập nhật thất bại", translated);
    } finally {
      setSubmitting(false);
    }
  };

  // VIEW MODE
  if (!isEditing) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={handleClose}></div>
        <div
          ref={modalViewRef}
          className={`relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl flex flex-col overflow-hidden ${isClosing
            ? "animate-out fade-out zoom-out-95 duration-200"
            : "animate-in fade-in zoom-in-95 duration-300"
            }`}
        >
          <div className="bg-[#E4002B] p-5 text-white flex items-center relative flex-shrink-0">
            <div className="flex items-center justify-between w-full">
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
          </div>

          <div className="p-6 space-y-5 text-left">
            <div className="flex justify-between items-start border-b border-gray-100 pb-5">
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tên mặt hàng</label>
                <p className="text-xl font-black text-gray-900 leading-tight">{product.Name}</p>
                <div className="mt-3">
                  <span
                    className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${product.IsActive
                      ? "bg-green-50 text-green-500 border-green-100"
                      : "bg-gray-50 text-gray-400 border-gray-100"
                      }`}
                  >
                    {product.IsActive ? "● Hoạt động" : "○ Tạm ngưng"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100">
                <label className="text-[9px] font-black text-blue-400 uppercase block mb-1">Loại sản phẩm</label>
                <p className="text-xs font-black text-blue-900 uppercase">{product.ProductType || "N/A"}</p>
              </div>

              <div className="p-4 bg-purple-50/30 rounded-xl border border-purple-100">
                <label className="text-[9px] font-black text-purple-400 uppercase block mb-1">Danh mục</label>
                <p className="text-xs font-black text-purple-900">
                  {categories.find((c) => c.Id === product.CategoryId)?.Name || "---"}
                </p>
              </div>

              <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">ĐV cơ bản (Bán)</label>
                <p className="text-xs font-black text-gray-800 uppercase">
                  {uoms.find((u) => u.Id === product.BaseUomId)?.Symbol || product.BaseUomName || "---"}
                </p>
              </div>

              <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">ĐV mua (Nhập)</label>
                <p className="text-xs font-black text-gray-800 uppercase">
                  {uoms.find((u) => u.Id === product.PurchaseUomId)?.Symbol || product.PurchaseUomName || "---"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 min-w-0">
              <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">Giá nhập kho (VND)</label>
                <p className="text-xl font-black text-gray-700 break-all leading-tight" title={`${formatNumber(product.StockPrice) || "0"} VND`}>
                  {formatCompactMoney(product.StockPrice)}
                </p>
              </div>

              <div className="p-5 bg-red-50/30 border border-red-100 rounded-xl shadow-sm">
                <label className="text-[9px] font-black text-[#E4002B] uppercase block mb-2">Giá bán niêm yết (VND)</label>
                <p className="text-xl sm:text-2xl font-black text-[#E4002B] break-all leading-tight" title={`${formatNumber(product.SalePrice) || "0"} VND`}>
                  {formatCompactMoney(product.SalePrice)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-gray-50 mt-auto">
            <button
              onClick={() => {
                const currentStock = Number(product.StockPrice) || 0;
                const currentSale = Number(product.SalePrice) || 0;
                setMarkup(0);
                setDisplayStock(currentStock >= 1_000_000 ? formatCompactMoney(currentStock) : formatNumber(currentStock));
                setDisplaySale(currentSale >= 1_000_000 ? formatCompactMoney(currentSale) : formatNumber(currentSale));
                setIsEditing(true);
              }}
              className="w-full py-4 bg-[#E4002B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-[#C80025] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Edit3 className="w-4 h-4 text-white" />
              Chỉnh sửa thông tin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={handleCancelEdit}></div>
      <form
        ref={modalEditRef}
        onSubmit={handleSave}
        className="relative bg-white w-full max-w-xl rounded-xl shadow-2xl flex flex-col h-[700px] overflow-hidden animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Header */}
        <div className="bg-[#E4002B] p-5 text-white relative flex-shrink-0 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest leading-none">Chỉnh sửa sản phẩm</h2>
                <div className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Cập nhật thông tin mặt hàng
                </div>
              </div>
            </div>
            <button
              onClick={handleCancelEdit}
              className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 flex-1 flex flex-col overflow-hidden">
          <div className="h-10 mb-3 flex-shrink-0 w-full">
            {error && (
              <div className="p-3 h-full w-full bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-[11px] font-bold text-red-600 line-clamp-1">{error}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 flex-1 overflow-hidden">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="edit-name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3 h-3 text-[#E4002B]" /> Tên mặt hàng <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-name"
                ref={nameInputRef}
                type="text"
                className="w-full bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-900 focus:border-[#E4002B] focus:ring-2 focus:ring-[#E4002B]/10 outline-none transition-all hover:border-gray-300 shadow-sm"
                placeholder="VD: Đùi gà..."
                value={formData.Name}
                onChange={(e) => handleInputChange("Name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-type" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
              <label htmlFor="edit-category" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
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

            <div className="space-y-2">
              <label htmlFor="edit-base-uom" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
              <label htmlFor="edit-purchase-uom" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
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

          <div className="pt-3 border-t border-gray-100 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="edit-stock-price" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Banknote className="w-3 h-3 text-[#E4002B]" /> Giá nhập (VND) *
                </label>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                  <input
                    id="edit-stock-price"
                    type="text"
                    autoComplete="off"
                    className="w-full bg-transparent font-black text-[13px] text-gray-800 outline-none"
                    placeholder="0"
                    value={displayStock}
                    onBlur={(e) => {
                      const raw = e.target.value;
                      const num = parseMoneyInput(raw);
                      handleInputChange("StockPrice", num);
                      setDisplayStock(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoney(num) : formatVnMoney(num)));
                    }}
                    onFocus={() => {
                      const current = formData.StockPrice ?? 0;
                      setDisplayStock(current > 0 ? formatVnMoney(current) : "");
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const integerPartDigits = raw.split(/[.,]/)[0]?.replace(/\D/g, "") || "";

                      if (isOverMaxMoney(integerPartDigits)) {
                        setError("Giá nhập vượt quá giới hạn hệ thống (tối đa 9,999,999,999,999,999.99).");
                        return;
                      }

                      const num = parseMoneyInput(raw);
                      setDisplayStock(raw);
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
                <label htmlFor="edit-markup" className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Percent className="w-3 h-3 text-[#E4002B]" /> Lợi nhuận
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100 focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/10 transition-all flex items-center shadow-sm">
                    <input
                      ref={markupInputRef}
                      id="edit-markup"
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
                    <svg className={`w-4 h-4 ${isCalculating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="edit-sale-price" className="text-[10px] font-black text-[#E4002B] uppercase tracking-widest flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Giá niêm yết *
                </label>
                <div className="bg-red-50/30 rounded-xl p-3 border border-red-100 focus-within:border-[#E4002B] focus-within:ring-2 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                  <input
                    id="edit-sale-price"
                    type="text"
                    autoComplete="off"
                    className="w-full bg-transparent font-black text-[13px] text-[#E4002B] outline-none"
                    placeholder="0"
                    value={displaySale}
                    onBlur={(e) => {
                      const raw = e.target.value;
                      const num = parseMoneyInput(raw);
                      handleInputChange("SalePrice", num);
                      setDisplaySale(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoney(num) : formatVnMoney(num)));
                    }}
                    onFocus={() => {
                      const current = formData.SalePrice ?? 0;
                      setDisplaySale(current > 0 ? formatVnMoney(current) : "");
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const integerPartDigits = raw.split(/[.,]/)[0]?.replace(/\D/g, "") || "";

                      if (isOverMaxMoney(integerPartDigits)) {
                        setError("Giá niêm yết vượt quá giới hạn hệ thống (tối đa 9,999,999,999,999,999.99).");
                        return;
                      }

                      const saleValue = parseMoneyInput(raw);
                      setDisplaySale(raw);
                      handleInputChange("SalePrice", saleValue);

                      if (saleValue > 0 && saleValue < MIN_PRICE) {
                        setError(`Giá niêm yết phải lớn hơn ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
                        return;
                      }

                      if (markup === 0 && calculatedSalePrice !== null && saleValue > 0) {
                        const normalizedSalePrice = roundMoney2(saleValue);
                        if (normalizedSalePrice <= calculatedSalePrice) {
                          if (normalizedSalePrice === calculatedSalePrice) {
                            setError(`Giá niêm yết không được bằng giá niêm yết gợi ý (${formatVnMoney(calculatedSalePrice)} VND). Vui lòng nhập lớn hơn.`);
                          } else {
                            setError(`Giá niêm yết tối thiểu phải lớn hơn giá niêm yết gợi ý (${formatVnMoney(calculatedSalePrice)} VND).`);
                          }
                          return;
                        }
                      }

                      if (saleValue > 0 && (formData.StockPrice ?? 0) > 0 && saleValue <= (formData.StockPrice ?? 0)) {
                        if (saleValue === (formData.StockPrice ?? 0)) {
                          setError("Giá niêm yết không được bằng giá nhập kho.");
                        } else {
                          setError("Giá niêm yết phải lớn hơn giá nhập kho.");
                        }
                        return;
                      }

                      const purchaseUomId = formData.PurchaseUomId ?? 0;
                      if (markup === 0 && saleValue > 0 && purchaseUomId > 0) {
                        const convertedStockPrice = getConvertedStockPrice();
                        const normalizedSalePrice = roundMoney2(saleValue);

                        if ((formData.StockPrice || 0) > 0 && normalizedSalePrice <= convertedStockPrice) {
                          if (normalizedSalePrice === convertedStockPrice) {
                            setError("Giá niêm yết không được bằng giá nhập kho sau quy đổi đơn vị.");
                          } else {
                            setError(`Giá niêm yết phải lớn hơn giá nhập sau quy đổi (${formatVnMoney(convertedStockPrice)}).`);
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
            <p className="text-[9px] font-black text-red-400 mt-2 uppercase tracking-widest flex items-center gap-2 justify-center h-4">
              <Info className="w-3 h-3" /> {isCalculating ? "Đang tính toán..." : "Gợi ý hoặc nhập thủ công"}
            </p>
          </div>
        </div>

        <div className="p-5 bg-gray-50 flex-shrink-0">
          <button
            type="submit"
            disabled={submitting || isCalculating}
            className="w-full py-3 bg-[#E4002B] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-[#C80025] active:scale-95 transition-all disabled:opacity-70 flex items-center justify-center gap-3 disabled:pointer-events-none"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Package className="w-4 h-4 text-white" />}
            {submitting ? "Đang lưu hệ thống..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
