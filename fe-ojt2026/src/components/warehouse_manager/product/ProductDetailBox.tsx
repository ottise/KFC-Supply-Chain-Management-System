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
  X,
  Tag,
  Layers,
  Database,
  Banknote,
  Percent,
  Info,
  Loader2,
  Edit3,
} from "lucide-react";

type ProductTypeOption = {
  Code: string;
  Name: string;
};

interface ProductDetailBoxProps {
  product: import("@/types/warehouse/masterData").Product;
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
    Id: Number(product.Id || 0),
    Name: product.Name || "",
    ProductType: product.ProductType || "Nguyên Liệu Thô",
    BaseUomId: Number(product.BaseUomId || 0),
    PurchaseUomId: product.PurchaseUomId ? Number(product.PurchaseUomId) : undefined,
    CategoryId: Number(product.CategoryId || 0),
    StockPrice: Number(product.StockPrice || 0),
    SalePrice: Number(product.SalePrice || 0),
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

    const baseUom = uoms.find((u) => u.Id === baseUomId);
    const purchaseUom = uoms.find((u) => u.Id === purchaseUomId);
    if (!baseUom || !purchaseUom) return stock;

    const baseFactor = baseUom.ConversionFactor && baseUom.ConversionFactor > 0 ? baseUom.ConversionFactor : 1;
    const purchaseFactor = purchaseUom.ConversionFactor && purchaseUom.ConversionFactor > 0 ? purchaseUom.ConversionFactor : 1;

    return roundMoney2((stock * purchaseFactor) / baseFactor);
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
    setFormData({
      Id: Number(product.Id),
      Name: product.Name,
      ProductType: product.ProductType || "Nguyên Liệu Thô",
      BaseUomId: Number(product.BaseUomId),
      PurchaseUomId: product.PurchaseUomId ? Number(product.PurchaseUomId) : undefined,
      CategoryId: Number(product.CategoryId),
      StockPrice: Number(product.StockPrice),
      SalePrice: Number(product.SalePrice),
      IsActive: product.IsActive,
    });
    const currentStock = Number(product.StockPrice) || 0;
    const currentSale = Number(product.SalePrice) || 0;
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

    if (!formData.StockPrice || formData.StockPrice <= 0) {
      setError("Vui lòng nhập giá nhập kho!");
      return false;
    }

    if ((formData.StockPrice ?? 0) < MIN_PRICE) {
      setError(`Giá nhập kho tối thiểu là ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
      return false;
    }

    if (isOverMaxMoney(String(formData.StockPrice))) {
      setError("Giá nhập vượt quá giới hạn hệ thống (tối đa 9,999,999,999,999,999.99).");
      return false;
    }

    if (!formData.SalePrice || formData.SalePrice <= 0) {
      setError("Vui lòng nhập giá niêm yết!");
      return false;
    }

    const normalizedSalePrice = roundMoney2(Number(formData.SalePrice) || 0);

    if (normalizedSalePrice < MIN_PRICE) {
      setError(`Giá niêm yết phải lớn hơn ${MIN_PRICE.toLocaleString("vi-VN")} VND.`);
      return false;
    }

    if (markup === 0 && calculatedSalePrice !== null && normalizedSalePrice <= calculatedSalePrice) {
      if (normalizedSalePrice === calculatedSalePrice) {
        setError(`Giá niêm yết phải lớn hơn ${formatVnMoney(calculatedSalePrice)} VND`);
      } else {
        setError(`Giá niêm yết tối thiểu phải lớn hơn giá niêm yết gợi ý (${formatVnMoney(calculatedSalePrice)} VND).`);
      }
      return false;
    }

    if (markup < 0 || markup > MAX_MARKUP_PERCENT) {
      setError(`Lợi nhuận phải từ 0 đến ${MAX_MARKUP_PERCENT}%.`);
      return false;
    }

    if (isOverMaxMoney(String(formData.SalePrice))) {
      setError("Giá niêm yết vượt quá giới hạn hệ thống (tối đa 9,999,999,999,999,999.99).");
      return false;
    }

    if (normalizedSalePrice === roundMoney2(Number(formData.StockPrice) || 0)) {
      setError("Giá niêm yết không được bằng giá nhập kho.");
      return false;
    }

    if (normalizedSalePrice < roundMoney2(Number(formData.StockPrice) || 0)) {
      setError("Giá niêm yết phải lớn hơn giá nhập kho.");
      return false;
    }

    const convertedStockPrice = getConvertedStockPrice();
    if (markup === 0 && normalizedSalePrice <= convertedStockPrice) {
      if (normalizedSalePrice === convertedStockPrice) {
        setError("Giá niêm yết không được bằng giá nhập kho sau quy đổi đơn vị.");
      } else {
        setError(`Giá niêm yết phải lớn hơn giá nhập sau quy đổi (${formatVnMoney(convertedStockPrice)}).`);
      }
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

  // ==========================================
  // VIEW MODE
  // ==========================================
  if (!isEditing) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div
          ref={modalViewRef}
          className={`relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 ${isClosing ? "animate-out fade-out zoom-out-95 duration-200" : ""
            }`}
        >
          {/* Header - Brand Red */}
          <div className="bg-[#E4002B] p-6 text-white relative shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate max-w-[400px]">
                  {product.Name}
                </h2>
                <div className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
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

          <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar bg-white">
            {/* Primary Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:bg-white group">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B] transition-colors">
                  <Tag className="w-3.5 h-3.5" /> Mã mặt hàng
                </div>
                <div className="text-sm font-black text-gray-900 break-all uppercase tracking-tight">
                  {product.Code || "—"}
                </div>
              </div>

              <div className="space-y-1.5 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:bg-white group">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B] transition-colors">
                  <Info className="w-3.5 h-3.5" /> Loại mặt hàng
                </div>
                <div className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  {productTypeOptions.find(opt => opt.Code === product.ProductType)?.Name || product.ProductType || "—"}
                </div>
              </div>

              <div className="space-y-1.5 p-5 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:shadow-md hover:bg-white group">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B] transition-colors">
                  <Database className="w-3.5 h-3.5" /> Danh mục
                </div>
                <div className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  {categories.find((c) => c.Id === product.CategoryId)?.Name || "Không xác định"}
                </div>
              </div>
            </div>

            {/* Inventory & Units Section */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-[#E4002B] pl-3">
                Thông tin tồn kho & đơn vị
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5" /> Đơn vị niêm yết
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {uoms.find((u) => u.Id === product.BaseUomId)?.Name || "—"}
                  </div>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Layers className="w-3.5 h-3.5" /> Đơn vị mua hàng
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {uoms.find((u) => u.Id === product.PurchaseUomId)?.Name || uoms.find((u) => u.Id === product.BaseUomId)?.Name || "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2 border-l-4 border-[#E4002B] pl-3">
                Thông tin giá thành
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white transition-all">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#E4002B]">
                    <Banknote className="w-3.5 h-3.5" /> Giá nhập kho
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    {(product.StockPrice || 0).toLocaleString("vi-VN")} <span className="text-[10px] text-gray-400 ml-1">VND</span>
                  </div>
                </div>

                <div className="p-5 bg-[#E4002B]/5 rounded-2xl border border-[#E4002B]/10 flex items-center justify-between group hover:bg-[#E4002B]/10 transition-all">
                  <div className="text-[10px] font-black text-[#E4002B] uppercase tracking-widest flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> Giá niêm yết
                  </div>
                  <div className="text-sm font-black text-[#E4002B]">
                    {(product.SalePrice || 0).toLocaleString("vi-VN")} <span className="text-[10px] opacity-60 ml-1">VND</span>
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
    );
  }

  // ==========================================
  // EDIT MODE
  // ==========================================
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <form
        ref={modalEditRef}
        onSubmit={handleSave}
        className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20"
      >
        {/* Header - Brand Red */}
        <div className="bg-[#E4002B] p-6 text-white relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
              <Edit3 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate max-w-[400px]">
                Cập nhật {product.Name}
              </h2>
              <div className="text-[10px] text-red-100 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                Quản lý cập nhật dữ liệu
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-white">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse flex-shrink-0" />
              <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="edit-name" className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-[#E4002B]" /> Tên mặt hàng <span className="text-[#E4002B] ml-0.5">*</span>
              </label>
              <input
                id="edit-name"
                ref={nameInputRef}
                type="text"
                disabled={submitting}
                className="w-full bg-gray-50 border border-gray-200 px-5 py-3.5 rounded-xl text-[13px] font-bold text-gray-900 focus:bg-white focus:border-[#E4002B] focus:ring-4 focus:ring-[#E4002B]/10 outline-none transition-all shadow-sm"
                placeholder="VD: Đùi gà..."
                value={formData.Name}
                onChange={(e) => handleInputChange("Name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-type" className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-[#E4002B]" /> Loại mặt hàng <span className="text-[#E4002B] ml-0.5">*</span>
              </label>
              <OdooDropdown<ProductTypeOption>
                items={productTypeOptions}
                value={productTypeOptions.find((x) => x.Code === formData.ProductType) || null}
                onChange={(item) => handleInputChange("ProductType", item?.Code || "")}
                displayField="Name"
                secondaryField="Code"
                placeholder="Chọn loại"
                className="w-full"
                portal
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-category" className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
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

            <div className="space-y-2">
              <label htmlFor="edit-base-uom" className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#E4002B]" /> ĐV Cơ bản *
              </label>
              <OdooDropdown<Uom>
                items={filteredBaseUoms}
                value={uoms.find((u) => u.Id === formData.BaseUomId) || null}
                onChange={(uom) => {
                  if (!uom?.Id) return;
                  const newBaseUomId = Number(uom.Id);
                  const newBaseCategory = getUomCategory(newBaseUomId);
                  const currentPurchaseCategory = getUomCategory(formData.PurchaseUomId);

                  setFormData((prev) => ({
                    ...prev,
                    BaseUomId: newBaseUomId,
                    PurchaseUomId: prev.PurchaseUomId && currentPurchaseCategory === newBaseCategory ? prev.PurchaseUomId : undefined,
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
              <label htmlFor="edit-purchase-uom" className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#E4002B]" /> ĐV Mua hàng *
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
                <Banknote className="w-3.5 h-3.5 text-[#E4002B]" /> Giá nhập
              </label>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                <input
                  id="edit-stock-price"
                  type="text"
                  autoComplete="off"
                  className="w-full bg-transparent font-black text-[15px] text-gray-900 outline-none"
                  value={displayStock}
                  onBlur={(e) => {
                    handlePriceTrigger();
                    const num = parseMoneyInput(e.target.value);
                    handleInputChange("StockPrice", num);
                    setDisplayStock(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoney(num) : formatVnMoney(num)));
                  }}
                  onFocus={() => {
                    const current = formData.StockPrice ?? 0;
                    setDisplayStock(current > 0 ? formatVnMoney(current) : "");
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (isOverMaxMoney(raw.replace(/\D/g, ""))) return;
                    setDisplayStock(raw);
                    handleInputChange("StockPrice", parseMoneyInput(raw));
                    if (error) setError(null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                <Percent className="w-3.5 h-3.5 text-[#E4002B]" /> Lợi nhuận
              </label>
              <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-200 focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/10 transition-all flex items-center shadow-sm">
                <input
                  ref={markupInputRef}
                  id="edit-markup"
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
                  onFocus={() => setDisplayMarkup(markup > 0 ? String(markup) : "")}
                  onChange={(e) => {
                    const val = Number(e.target.value.replace(/\D/g, ""));
                    if (val > MAX_MARKUP_PERCENT) return;
                    setDisplayMarkup(String(val));
                    setMarkup(val);
                    if (error) setError(null);
                  }}
                />
                <span className="font-black text-gray-400 ml-1.5">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-[#E4002B] uppercase tracking-widest flex items-center gap-2">
                <Tag className="w-3.5 h-3.5" /> Giá niêm yết
              </label>
              <div className="bg-red-50/20 rounded-xl p-4 border border-red-100 focus-within:bg-white focus-within:border-[#E4002B] focus-within:ring-4 focus-within:ring-[#E4002B]/10 transition-all shadow-sm">
                <input
                  id="edit-sale-price"
                  type="text"
                  autoComplete="off"
                  className={`w-full bg-transparent font-black text-[15px] outline-none text-gray-900 ${isCalculating ? 'opacity-30' : ''}`}
                  value={displaySale}
                  onBlur={(e) => {
                    const num = parseMoneyInput(e.target.value);
                    handleInputChange("SalePrice", num);
                    setDisplaySale(num === 0 ? "0" : (num >= 1_000_000 ? formatCompactMoney(num) : formatVnMoney(num)));
                  }}
                  onFocus={() => {
                    const current = formData.SalePrice ?? 0;
                    setDisplaySale(current > 0 ? formatVnMoney(current) : "");
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (isOverMaxMoney(raw.replace(/\D/g, ""))) return;
                    setDisplaySale(raw);
                    handleInputChange("SalePrice", parseMoneyInput(raw));
                    if (error) setError(null);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="is-active"
              checked={formData.IsActive}
              onChange={(e) => handleInputChange("IsActive", e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#E4002B] focus:ring-[#E4002B]"
            />
            <label htmlFor="is-active" className="text-[11px] font-black text-gray-900 uppercase tracking-widest">
              Đang kinh doanh mặt hàng này
            </label>
          </div>
        </div>

        {/* Footer Edit */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex justify-end gap-4 shrink-0">
          <button
            type="button"
            onClick={handleCancelEdit}
            disabled={submitting}
            className="px-6 py-3 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            Hủy thao tác
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-10 py-3 text-[13px] font-black text-white uppercase bg-[#E4002B] rounded-lg shadow-md shadow-red-200 hover:shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                Đang lưu...
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 text-white" />
                Xác nhận cập nhật
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
