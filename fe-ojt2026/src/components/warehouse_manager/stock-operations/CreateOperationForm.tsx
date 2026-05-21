"use client";
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar } from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
registerLocale("vi", vi);
import { useOutTransfers } from '@/hooks/useWarehouse';
import { useAuth } from '@/hooks/useAuth';
import { locationsApi } from '@/lib/api/warehouse/locationsApi';
import { warehouseApi } from '@/lib/api/warehouse/warehouseApi';
import { customersApi } from '@/lib/api/warehouse/customersApi';
import { useToast } from '@/components/ui/ToastProvider';
import { productsApi } from '@/lib/api/warehouse/productsApi';
import { productLotsApi } from '@/lib/api/warehouse/productLotsApi';
import type { Product } from '@/types/warehouse/masterData';
import type { ProductLot } from '@/types/warehouse/productLot';
import type { Location } from '@/types/warehouse/locations';
import OdooDropdown from '@/components/common/OdooDropdown';

interface CustomerFromAPI {
  Id: number;
  CustomerName?: string;
  Phone?: string;
  Address?: string;
  // Fallbacks for defensive coding
  id?: number;
  name?: string;
  customerName?: string;
  phone?: string;
  address?: string;
}

interface Props {
  onClose: () => void;
  onSave: (data?: unknown) => void;
}

interface TransferItem {
  id: number;
  productId: number | null;
  lotId: number | null;
  uomId: number | null;
  plannedQty: number;
  actualQty: number | '';
  unitPrice: number;
  lotOptions: ProductLot[];
}

interface FormData {
  soCode: string;
  customerId: number | null;
  creationDate: string;
  plannedDate: string;
  sourceWarehouseId: number | null;
  notes: string;
}

const CreateTransferForm: React.FC<Props> = ({ onClose, onSave }) => {
  const toast = useToast();
  const { user } = useAuth();
  const { createTransfer } = useOutTransfers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<TransferItem[]>([]);

  const [formData, setFormData] = useState<FormData>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const today = `${y}-${m}-${d}`;
    return {
      soCode: '',
      customerId: null,
      creationDate: today,
      plannedDate: today,
      sourceWarehouseId: null,
      notes: ''
    };
  });

  const [customers, setCustomers] = useState<CustomerFromAPI[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchAllCustomers = async () => {
      try {
        let allCustomers: CustomerFromAPI[] = [];
        let currentPage = 1;
        let hasNext = true;
        
        while (hasNext) {
          const response = await customersApi.getCustomers({ page: currentPage, pageSize: 100 });
          const items = response.Items || [];
          allCustomers = [...allCustomers, ...(items as unknown as CustomerFromAPI[])];
          
          if (response.HasNext && items.length > 0) {
            currentPage++;
          } else {
            hasNext = false;
          }
        }
        
        setCustomers(allCustomers);
      } catch (err) {
        console.error("Lỗi lấy danh sách khách hàng:", err);
      }
    };
    
    fetchAllCustomers();

    // Fetch Locations (Warehouses) based on managerId or role
    if (user) {
      let managerId: number | undefined = undefined;

      if (user?.role === 'Manager') {
        const rawId = user.id ? parseInt(user.id) : NaN;
        if (!isNaN(rawId)) {
          managerId = rawId;
        }
      }

      locationsApi.getLocations({
        managerId,
        pageSize: 100,
        isActive: true
      }).then((data) => {
        console.log("Dữ liệu API kho hàng raw (từ locationsApi):", data);
        const locItems = data?.Items || [];
        setLocations(locItems);
      }).catch(err => {
        console.error("Lỗi lấy danh sách kho hàng:", err);
      });
    }
  }, [user]);

  // Fetch Products whenever sourceWarehouseId changes
  useEffect(() => {
    if (formData.sourceWarehouseId) {
      productsApi.getProductsByLocation(formData.sourceWarehouseId)
        .then((data) => {
          setProducts(data || []);
        })
        .catch(err => {
          console.error("Lỗi lấy danh sách sản phẩm theo kho:", err);
          setProducts([]);
        });
    } else {
      setProducts([]);
    }
  }, [formData.sourceWarehouseId]);

  const totalItemLines = useMemo(
    () => items.filter((i) => i.productId != null).length,
    [items],
  );
  const totalQty = useMemo(
    () =>
      items.reduce((sum, it) => {
        const q = typeof it.actualQty === 'number' ? it.actualQty : Number(it.actualQty) || 0;
        return sum + q;
      }, 0),
    [items],
  );
  const totalAmount = useMemo(
    () =>
      items.reduce((sum, it) => {
        const q = typeof it.actualQty === 'number' ? it.actualQty : Number(it.actualQty) || 0;
        return sum + q * (Number(it.unitPrice) || 0);
      }, 0),
    [items],
  );

  const handleSubmit = async () => {
    const qtyInvalid = items.some((i) => {
      if (!i.productId) return false;
      const q = typeof i.actualQty === 'number' ? i.actualQty : Number(i.actualQty);
      return !Number.isFinite(q) || q <= 0;
    });
    const hasProductLine = items.some((i) => i.productId != null);
    if (!formData.customerId || !hasProductLine || qtyInvalid) {
      toast.error("Vui lòng điền đầy đủ thông tin khách hàng và sản phẩm với số lượng > 0", "Lỗi Form");
      return;
    }

    setIsSubmitting(true);
    try {
      // Fail-safe: Tự động cộng dồn các dòng trùng sản phẩm trước khi gửi lên Server
      const consolidatedMap = new Map<string, { productId: number; orderedQty: number; unitPrice: number; lotId: number | null; uomId: number | null }>();

      items
        .filter((item) => item.productId != null)
        .forEach((item) => {
          const key = `${item.productId}-${item.lotId || 'no-lot'}`;
          const currentQty = typeof item.actualQty === 'number' ? item.actualQty : Number(item.actualQty) || 0;

          if (consolidatedMap.has(key)) {
            const existing = consolidatedMap.get(key)!;
            existing.orderedQty += currentQty;
          } else {
            consolidatedMap.set(key, {
              productId: item.productId as number,
              orderedQty: currentQty,
              unitPrice: item.unitPrice,
              lotId: item.lotId,
              uomId: item.uomId
            });
          }
        });

      const dto = {
        plannedDate: formData.plannedDate,
        customerId: formData.customerId,
        locationId: formData.sourceWarehouseId,
        toLocationId: formData.customerId,
        note: formData.notes,
        items: Array.from(consolidatedMap.values()),
      };

      const response = await createTransfer(dto);
      toast.success("Tạo phiếu xuất kho thành công!", "Thành công");
      onSave(response);
      onClose();
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra khi gửi dữ liệu";
      toast.error(errorMessage, "Lỗi Server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const customerOptions = useMemo(() =>
    customers.map(c => ({
      ...c,
      id: c.Id ?? c.id,
      displayValue: c.CustomerName ?? c.customerName ?? c.name,
      secondaryValue: c.Phone ?? c.phone ?? '',
      address: c.Address ?? c.address ?? ''
    })), [customers]
  );

  const locationOptions = useMemo(() =>
    locations.map(loc => ({
      ...loc,
      id: loc.Id,
      displayValue: loc.Name,
      secondaryValue: loc.Code ?? loc.Type ?? ''
    })), [locations]
  );

  const handleCustomerChange = useCallback((selectedCustomer: { id: number | null }) => {
    setFormData(prev => ({ ...prev, customerId: selectedCustomer?.id || null }));
  }, []);

  const selectedCustomerOption = useMemo(
    () => customerOptions.find((c) => c.id === formData.customerId),
    [customerOptions, formData.customerId],
  );

  const deliveryAddressText = useMemo(() => {
    if (!formData.customerId) return '—';
    if (!selectedCustomerOption) return '—';
    const addr = String(selectedCustomerOption.address ?? '').trim();
    return addr || 'Chưa cập nhật địa chỉ';
  }, [formData.customerId, selectedCustomerOption]);

  const deliveryContactText = useMemo(() => {
    if (!formData.customerId) return '—';
    if (!selectedCustomerOption) return '—';
    const phone = String(selectedCustomerOption.secondaryValue ?? '').trim();
    return phone || 'Chưa cập nhật SĐT';
  }, [formData.customerId, selectedCustomerOption]);

  const handleLocationChange = useCallback(async (selectedLocation: { id: number | null } | null) => {
    const newLocationId = selectedLocation?.id || null;
    if (!newLocationId) {
      setFormData(prev => ({ ...prev, sourceWarehouseId: null }));
      setItems([]);
      return;
    }

    setFormData(prev => ({ ...prev, sourceWarehouseId: newLocationId }));

    // Validate existing items
    if (items.length > 0) {
      try {
        const availableProducts = await productsApi.getProductsByLocation(newLocationId);
        const availableProductIds = new Set(availableProducts.map(p => p.Id));

        const updatedItems = await Promise.all(items.map(async (item) => {
          if (!item.productId) return item;

          // Check if product exists in new location
          if (!availableProductIds.has(item.productId)) {
            // Product not available in new location -> Reset the entire line
            return {
              ...item,
              productId: null,
              lotId: null,
              lotOptions: [],
              unitPrice: 0,
              uomId: null,
              actualQty: 0
            };
          }

          // Product exists, check lots
          const lots = await productLotsApi.getLotsByLocationAndProductId(newLocationId, item.productId);
          const lotExists = lots.some(l => l.Id === item.lotId);

          return {
            ...item,
            lotOptions: lots,
            lotId: lotExists ? item.lotId : (lots.length > 0 ? lots[0].Id : null)
          };
        }));

        // Filter out items that are now completely empty (optional, but requested "reload bắt chọn lại")
        // The user said "nếu location đó không có product đó thì reload bắt chọn lại"
        // Let's just reset the product but keep the line to avoid jumping UI too much
        setItems(updatedItems);
      } catch (err) {
        console.error("Lỗi xác thực sản phẩm khi đổi kho:", err);
        setItems([]); // Fallback to clear on error
      }
    }
  }, [items]);

  // Xóa các hàm sử dụng mock cũ như getAvailableUoMs, isExpiringSoon, isExpired
  // getAvailableUoMs sẽ được thay thế bằng BaseUom từ Product API trực tiếp

  const updateItem = useCallback(async (id: number, field: keyof TransferItem, value: unknown) => {
    if (field === 'productId') {
      const prodId = value as number | null;
      if (!prodId) {
        setItems(prev => prev.map(item =>
          item.id !== id ? item : { ...item, productId: null, lotId: null, uomId: null, unitPrice: 0, lotOptions: [] }
        ));
        return;
      }

      // Kiểm tra trùng sản phẩm ở dòng khác
      const existingItem = items.find(it => it.productId === Number(prodId) && it.id !== id);
      if (existingItem) {
        const currentItem = items.find(it => it.id === id);
        const currentQty = currentItem ? (typeof currentItem.actualQty === 'number' ? currentItem.actualQty : Number(currentItem.actualQty) || 0) : 0;

        setItems(prev => {
          const filtered = prev.filter(it => it.id !== id);
          return filtered.map(it => {
            if (it.id !== existingItem.id) return it;
            const existingQty = typeof it.actualQty === 'number' ? it.actualQty : Number(it.actualQty) || 0;
            return { ...it, actualQty: existingQty + currentQty };
          });
        });
        toast.info(`Sản phẩm đã có trong danh sách, số lượng được cộng dồn vào dòng sẵn có`, "Cộng dồn sản phẩm");
        return;
      }

      // Fetch product detail and lots
      try {
        const numericId = Number(prodId);
        const [detail, lots] = await Promise.all([
          productsApi.getProductById(numericId),
          formData.sourceWarehouseId ? productLotsApi.getLotsByLocationAndProductId(formData.sourceWarehouseId, numericId) : Promise.resolve([])
        ]);

        setItems(prev => prev.map(item => {
          if (item.id !== id) return item;
          return {
            ...item,
            productId: numericId,
            uomId: detail.BaseUomId || null,
            unitPrice: detail.SalePrice || 0,
            lotOptions: lots,
            lotId: lots.length > 0 ? lots[0].Id : null
          };
        }));
      } catch (err) {
        console.error("Failed to fetch product details:", err);
        toast.error("Không thể lấy chi tiết sản phẩm", "Lỗi Tải Dữ Liệu");
      }
    } else {
      setItems(prevItems =>
        prevItems.map(item => {
          if (item.id !== id) return item;
          return { ...item, [field]: value };
        })
      );
    }
  }, [formData.sourceWarehouseId, items]);

  const productOptions = useMemo(() =>
    products.map(p => ({
      ...p,
      id: p.Id,
      displayValue: p.Name,
      secondaryValue: p.Code
    })), [products]
  );

  const addLine = () => {
    setItems([...items, { id: Date.now(), productId: null, lotId: null, uomId: null, plannedQty: 0, actualQty: 0, unitPrice: 0, lotOptions: [] }]);
  };

  const unitLabel = (item: TransferItem) =>
    item.uomId ? products.find((p) => p.BaseUomId === item.uomId)?.BaseUomName || 'ĐVT' : 'ĐVT';

  /** Trigger OdooDropdown: cân bằng giữa gọn và đọc được (mặc định component là h-14). */
  const outboundDropdownTrigger =
    '!h-10 !min-h-0 !px-3 !rounded-lg kfc-form-field-shadow hover:!shadow-[0_4px_18px_-6px_rgba(15,23,42,0.1),0_2px_10px_-4px_rgba(228,0,43,0.12)] !text-[10px] !leading-snug [&>div:first-child]:gap-2 [&_input]:!text-[10px] [&_input]:!font-bold [&_input]:!text-gray-800 [&_.odoo-dropdown-value]:!text-[10px] [&_.odoo-dropdown-value]:!font-bold [&_.odoo-dropdown-value]:!text-gray-800 [&_.odoo-dropdown-placeholder]:!text-[10px] [&_.odoo-dropdown-placeholder]:!font-medium [&_.odoo-dropdown-placeholder]:!text-gray-400 [&_svg]:!size-3.5 [&>div:last-child]:!pl-2.5 [&>div:last-child]:!gap-1';

  /** Ô chỉ đọc (địa chỉ / liên lạc): cùng chiều cao, padding, chữ với DatePicker & dropdown. */
  const outboundReadonlyBox =
    'h-10 min-h-[2.5rem] w-full rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3 flex items-center min-w-0';
  const outboundReadonlyText =
    'text-[10px] font-bold text-gray-800 leading-tight w-full min-w-0';

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" aria-hidden="true" />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-3 animate-in zoom-in-95 duration-200 pointer-events-none overflow-y-auto overscroll-contain">
        <div
          className="bg-white rounded-[2rem] border border-[#E4002B]/30 shadow-sm w-[1200px] max-w-[96vw] h-[min(86vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] min-h-0 flex flex-col pointer-events-auto overflow-hidden animate-in fade-in duration-300 my-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-outbound-title"
        >
          <div className="relative z-[2] shrink-0 px-5 py-2 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-1.5 shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Phiếu xuất kho</p>
              <h2 id="create-outbound-title" className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-0.5">
                Tạo phiếu xuất kho
              </h2>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">Tạo mới cho khách hàng</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-wrap justify-center items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border bg-white text-[#E4002B] border-white shadow-md">
                Nháp
              </span>
              <span className="text-white/50 text-xs font-light">›</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border bg-white/10 text-white/80 border-white/30">
                Kiểm tra tồn kho
              </span>
              <span className="text-white/50 text-xs font-light">›</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border bg-white/10 text-white/80 border-white/30">
                Sẵn sàng
              </span>
              <span className="text-white/50 text-xs font-light">›</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border bg-white/10 text-white/80 border-white/30">
                Hoàn thành
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5">
            <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,438px)] gap-4 overflow-hidden">
              {/* Trái: từng dòng = card — giống ReceiptItemsTable (phiếu nhập) */}
              <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
                <div className="shrink-0 flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-7 bg-[#E4002B] rounded-full shrink-0" />
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest truncate">Danh sách sản phẩm</h4>
                  </div>
                  <button
                    type="button"
                    onClick={addLine}
                    className="px-5 h-10 bg-[#E4002B] text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E4002B] hover:bg-[#cc0027] active:scale-95 transition-all whitespace-nowrap shrink-0"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>

                <div className="h-full flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-auto custom-scrollbar pr-1">
                    {items.length === 0 ? (
                      <div className="h-full min-h-[200px] rounded-[2rem] border border-[#E4002B]/25 bg-gradient-to-b from-[#fff7f8] to-white shadow-sm flex items-center justify-center">
                        <div className="text-center px-6 py-8">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            Chưa có sản phẩm
                          </p>
                          <p className="text-[11px] text-gray-400 mt-2 font-medium">
                            Dùng nút &quot;+ Thêm sản phẩm&quot; phía trên để thêm dòng
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item) => {
                          const lineQty = typeof item.actualQty === 'number' ? item.actualQty : Number(item.actualQty) || 0;
                          const lineTotal = lineQty * (Number(item.unitPrice) || 0);
                          const u = unitLabel(item);
                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 hover:border-red-100/50 transition-all"
                            >
                              <div className="flex flex-col">
                                {/* Hàng 1: Sản phẩm | Đơn giá | Số lượng */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(12rem,1fr)_auto_180px] sm:gap-3 sm:items-end">
                                  <div className="min-w-0">
                                    <p className="mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</p>
                                    <OdooDropdown
                                      portal={true}
                                      items={productOptions}
                                      value={productOptions.find((p) => p.id === item.productId) || null}
                                      onChange={(p: { id: number | null } | null) => updateItem(item.id, 'productId', p?.id || null)}
                                      displayField="displayValue"
                                      secondaryField="secondaryValue"
                                      placeholder="Chọn Sản Phẩm..."
                                      className="w-full !h-11 !py-0 !rounded-[1rem] !px-4"
                                      triggerClassName="!h-11 !rounded-[1rem] !px-4"
                                      listMaxHeight="max-h-[240px]"
                                    />
                                  </div>
                                  <div className="min-w-0 w-fit sm:min-w-[140px] sm:justify-self-end">
                                    <p className="mb-1 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn giá</p>
                                    <div
                                      className="flex h-11 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[1rem] border border-gray-200 bg-white px-4 text-[11px] font-black tabular-nums text-gray-700 shadow-sm"
                                      title={`${new Intl.NumberFormat('vi-VN').format(item.unitPrice || 0)} / ${u}`}
                                    >
                                      {new Intl.NumberFormat('vi-VN').format(item.unitPrice || 0)} / {u}
                                    </div>
                                  </div>
                                  <div className="min-w-0 w-full max-w-[180px] sm:justify-self-end">
                                    <p className="mb-1 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                                    <div className="grid h-11 w-full max-w-[180px] grid-cols-2 overflow-hidden rounded-[1rem] border border-gray-200 bg-white shadow-sm transition-all">
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        min={1}
                                        max={999999999}
                                        className="h-full w-full bg-transparent px-1.5 text-center text-[11px] font-black tabular-nums text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={item.actualQty === '' ? '' : item.actualQty}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '') {
                                            updateItem(item.id, 'actualQty', '');
                                            return;
                                          }
                                          // Chỉ cho phép số nguyên dương > 0
                                          const numVal = parseInt(val, 10);
                                          if (!isNaN(numVal) && numVal > 0) {
                                            updateItem(item.id, 'actualQty', numVal);
                                          } else if (val === '0') {
                                            // Cho phép tạm thời nhập 0 nếu cần, nhưng validation sẽ chặn khi submit
                                            // Tuy nhiên user muốn "lớn hơn 0", nên ta có thể chặn luôn ở đây
                                            // Để trải nghiệm tốt hơn khi gõ, ta có thể cho phép rỗng
                                            updateItem(item.id, 'actualQty', '');
                                          }
                                        }}
                                        placeholder="0"
                                      />
                                      <div className="flex min-w-0 items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                                        {u}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div role="presentation" aria-hidden className="py-3">
                                  <div className="h-px w-full rounded-full bg-gray-200" />
                                </div>

                                {/* Hàng 2: Xóa (trái) | Thành tiền (phải) */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.id)}
                                    className="h-10 w-fit shrink-0 rounded-full border border-gray-200/90 bg-white px-4 text-[9px] font-black uppercase tracking-widest text-gray-800 transition-all hover:border-red-200/80 hover:bg-red-50/40 hover:text-[#E4002B] active:scale-95"
                                  >
                                    Xóa
                                  </button>
                                  <p
                                    className="text-left text-[20px] font-black leading-none text-[#E4002B] tabular-nums whitespace-nowrap text-ellipsis overflow-hidden sm:text-right sm:text-[22px]"
                                    title={`${new Intl.NumberFormat('vi-VN').format(lineTotal)} VND`}
                                  >
                                    {new Intl.NumberFormat('vi-VN').format(lineTotal)} VND
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Phải: chừa padding để shadow/bo góc không bị cắt bởi overflow; không dùng overflow-x-hidden trên vùng có shadow */}
              <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
                <div className="flex-1 min-h-0 min-w-0 overflow-y-auto custom-scrollbar px-0.5 pr-2.5 pb-1.5 pt-0.5">
                  <div className="bg-white rounded-[1.25rem] border border-red-100/40 shadow-md shadow-gray-200/30 p-3 box-border min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-1 h-6 bg-[#E4002B] rounded-full shrink-0" />
                      <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Thông tin xuất hàng</h3>
                    </div>

                    <div className="space-y-2">
                      {/* Khách | Ngày; Địa chỉ + Liên Lạc cùng hàng (grid 1fr + 7rem, min-w-0) để không wrap xuống trong cột phải hẹp */}
                      <div className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-1.5">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 block leading-tight self-end">
                          Khách hàng
                        </label>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 block leading-tight self-end">
                          Ngày dự kiến
                        </label>
                        <div className="min-w-0">
                          <OdooDropdown
                            portal
                            items={customerOptions}
                            value={customerOptions.find((c) => c.id === formData.customerId) || null}
                            onChange={handleCustomerChange}
                            displayField="displayValue"
                            secondaryField="secondaryValue"
                            placeholder="Chọn Khách Hàng..."
                            className="w-full min-w-0"
                            triggerClassName={`${outboundDropdownTrigger} !min-h-[2.5rem]`}
                            listMaxHeight="max-h-[240px]"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="relative h-10 min-h-[2.5rem] w-full min-w-0 kfc-receipt-datepicker-container [&_.react-datepicker-wrapper]:!flex [&_.react-datepicker-wrapper]:!h-full [&_.react-datepicker-wrapper]:!w-full [&_.react-datepicker-wrapper]:min-h-0 [&_.react-datepicker__input-container]:!flex [&_.react-datepicker__input-container]:!h-full [&_.react-datepicker__input-container]:!w-full [&_.react-datepicker__input-container]:min-h-0 [&_input]:!h-full [&_input]:!min-h-0 [&_input]:!box-border">
                            <DatePicker
                              id="outbound-planned-date"
                              wrapperClassName="!flex !h-full !w-full min-h-0"
                              selected={formData.plannedDate ? new Date(formData.plannedDate) : null}
                              onChange={(date: Date | null) => {
                                if (!date) {
                                  setFormData((prev) => ({ ...prev, plannedDate: '' }));
                                  return;
                                }
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                const d = String(date.getDate()).padStart(2, '0');
                                setFormData((prev) => ({ ...prev, plannedDate: `${y}-${m}-${d}` }));
                              }}
                              dateFormat="dd/MM/yyyy"
                              locale="vi"
                              calendarClassName="kfc-datepicker-custom"
                              portalId="kfc-stock-portal"
                              minDate={new Date()}
                              fixedHeight
                              className="box-border w-full min-h-0 flex-1 pl-3.5 pr-16 bg-gray-50/50 border border-gray-100 rounded-lg text-[10px] font-bold leading-none text-gray-800 tabular-nums outline-none focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/30 transition-all text-left kfc-form-field-shadow placeholder:font-medium placeholder:text-gray-400"
                              placeholderText="Chọn Ngày..."
                              isClearable
                            />
                            <button
                              type="button"
                              className="absolute right-11 top-1/2 z-[2] -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              aria-label="Mở lịch"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const el = document.getElementById('outbound-planned-date');
                                el?.focus();
                                el?.click();
                              }}
                            >
                              <Calendar className="h-3.5 w-3.5 pointer-events-none" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        <div className="col-span-2 grid min-w-0 w-full grid-cols-[minmax(0,1fr)_7.25rem] gap-x-2 gap-y-1.5">
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 block leading-tight self-end">
                            Địa chỉ giao
                          </label>
                          <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 block leading-tight self-end">
                            Liên Lạc
                          </label>
                        </div>
                        <div className="col-span-2 grid min-w-0 w-full grid-cols-[minmax(0,1fr)_7.25rem] gap-x-2">
                          <div
                            className={outboundReadonlyBox}
                            title={!formData.customerId ? 'Chọn khách hàng để hiển thị địa chỉ' : deliveryAddressText}
                          >
                            <p
                              className={`${outboundReadonlyText} line-clamp-2 ${!formData.customerId ? '!text-gray-400' : ''}`}
                            >
                              {deliveryAddressText}
                            </p>
                          </div>
                          <div
                            className={outboundReadonlyBox}
                            title={!formData.customerId ? 'Chọn khách hàng để hiển thị liên lạc' : deliveryContactText}
                          >
                            <p
                              className={`${outboundReadonlyText} tabular-nums truncate text-left ${!formData.customerId ? '!text-gray-400' : ''}`}
                            >
                              {deliveryContactText}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho xuất hàng</label>
                        <OdooDropdown
                          portal
                          items={locationOptions}
                          value={locationOptions.find((loc) => loc.id === formData.sourceWarehouseId) || null}
                          onChange={handleLocationChange}
                          displayField="displayValue"
                          secondaryField="secondaryValue"
                          placeholder="Chọn Kho..."
                          className="w-full"
                          triggerClassName={outboundDropdownTrigger}
                          listMaxHeight="max-h-[240px]"
                        />
                      </div>

                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ghi chú</label>
                        <input
                          type="text"
                          placeholder="Ghi Chú Cho Phiếu Xuất..."
                          className="w-full h-10 rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3.5 text-[10px] leading-none font-bold text-gray-800 outline-none focus:border-red-100/50 focus:bg-white focus:ring-2 focus:ring-red-50/30 transition-all placeholder:text-gray-400"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cùng padding ngang với vùng cuộn chứa thẻ trắng → mép trái/phải thẳng hàng */}
                <div className="shrink-0 w-full px-0.5 pr-2.5 pb-1.5 box-border">
                  <div className="w-full rounded-[1.25rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-3 py-2.5 flex flex-col gap-2 kfc-summary-red-card box-border min-w-0">
                    <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                      <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap uppercase tracking-[0.08em]">
                        Ngày thực hiện {(() => {
                          if (!formData.plannedDate) return '—';
                          const dt = new Date(formData.plannedDate);
                          if (Number.isNaN(dt.getTime())) return '—';
                          return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
                        })()}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">

                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>
                          •
                        </span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Số sản phẩm</span>
                          <span className="text-white tabular-nums">{totalItemLines}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>
                          •
                        </span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Tổng số lượng kế hoạch</span>
                          <span className="text-white tabular-nums">{totalQty}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>
                          •
                        </span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Trạng thái</span>
                          <span className="text-white">Nháp</span>
                        </div>
                      </div>

                      <div className="h-px bg-white/20 my-0.5 ml-5" />

                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>
                          •
                        </span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2 items-baseline">
                          <span className="text-white/80 uppercase shrink-0">Tổng tiền</span>
                          <span
                            className="text-[12px] font-black whitespace-nowrap overflow-hidden text-ellipsis max-w-[190px] text-right text-white"
                            title={`${new Intl.NumberFormat('vi-VN').format(totalAmount)} VND`}
                          >
                            {new Intl.NumberFormat('vi-VN').format(totalAmount)} VND
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1.5 border-t border-white/15">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white hover:bg-white/95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-[#E4002B]/30 border-t-[#E4002B] rounded-full animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          'Xác nhận xuất kho'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default CreateTransferForm;