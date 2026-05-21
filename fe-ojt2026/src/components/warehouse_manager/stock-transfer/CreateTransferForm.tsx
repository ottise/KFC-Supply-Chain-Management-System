"use client";
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Truck,
  Package,
  Plus,
  X,
  Calendar,

  MapPin
} from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { useToast } from '@/components/ui/ToastProvider';

// APIs & Context
import { transferOrdersApi } from "@/lib/api/warehouse/transferOrdersApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { locationsApi } from "@/lib/api/warehouse/locationsApi";
import { productLotsApi } from "@/lib/api/warehouse/productLotsApi";
import { productWarehouseApi } from "@/lib/api/warehouse/productWarehouseApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { useAuth } from '@/hooks/useAuth';

// Types & Components
import type { Product } from '@/types/warehouse/masterData';
import type { Location } from '@/types/warehouse/locations';
import type { CreateTransferOrderRequest } from "@/types/warehouse/transferOrders";
import OdooDropdown from '@/components/common/OdooDropdown';

registerLocale("vi", vi);

interface Props {
  onClose: () => void;
  onSave?: () => void; // Thêm onSave để đồng bộ
}

interface TransferItem {
  id: number;
  productId: number | null;
  lotId: number | null;
  requestedQty: number;
}

interface FormData {
  transferDate: string;
  fromLocationId: number | null;
  toLocationId: number | null;
  notes: string;
}


const STATUS_FLOW: { key: string; label: string }[] = [
  { key: 'DRAFT', label: 'Nháp' },
  { key: 'WAITING', label: 'Kiểm tra tồn kho' },
  { key: 'READY', label: 'Đã sẵn sàng' },
  { key: 'DONE', label: 'Hoàn thành' },
];

const CreateTransferForm: React.FC<Props> = ({ onClose, onSave }) => {
  const toast = useToast();
  const notifyFormError = (detail: string) => toast.error("Thông tin chưa hợp lệ", detail);
  const notifyActionError = (detail: string) => toast.error("Không thể thực hiện thao tác", detail);
  const notifySuccess = (detail: string) => toast.success("Thao tác thành công", detail);

  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States cho Master Data
  const [products, setProducts] = useState<Product[]>([]);
  const [toWarehouseRegisteredProductIds, setToWarehouseRegisteredProductIds] = useState<Set<number>>(new Set());
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouseNameById, setWarehouseNameById] = useState<Record<number, string>>({});
  const [locationLots, setLocationLots] = useState<unknown[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const transferDropdownTrigger =
    "!h-10 !min-h-0 !px-3 !rounded-lg kfc-form-field-shadow hover:!shadow-[0_4px_18px_-6px_rgba(15,23,42,0.1),0_2px_10px_-4px_rgba(228,0,43,0.12)] !text-[10px] !leading-snug [&>div:first-child]:gap-2 [&_input]:!text-[10px] [&_input]:!font-bold [&_input]:!text-gray-800 [&_.odoo-dropdown-value]:!text-[10px] [&_.odoo-dropdown-value]:!font-bold [&_.odoo-dropdown-value]:!text-gray-800 [&_.odoo-dropdown-placeholder]:!text-[10px] [&_.odoo-dropdown-placeholder]:!font-medium [&_.odoo-dropdown-placeholder]:!text-gray-400 [&_svg]:!size-3.5 [&>div:last-child]:!pl-2.5 [&>div:last-child]:!gap-1 [&>div:last-child]:!pr-1.5";

  const [items, setItems] = useState<TransferItem[]>([
    {
      id: Date.now(),
      productId: null,
      lotId: null,
      requestedQty: 1
    }
  ]);

  const [formData, setFormData] = useState<FormData>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return {
      transferDate: `${y}-${m}-${d}`,
      fromLocationId: null,
      toLocationId: null,
      notes: ''
    };
  });

  // Fetch Master Data khi mount (chỉ lấy locations trước)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const locationManagerId = (user?.managerId && user.managerId !== "null") ? Number(user.managerId) : (user?.id ? Number(user.id) : undefined);
        setDataLoading(true);
        const locRes = await locationsApi.getLocations({ isActive: true, pageSize: 100, managerId: locationManagerId });
        setLocations(locRes.Items || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu kho:", error);
        notifyActionError("Không thể tải danh sách kho hàng. Vui lòng thử lại sau.");
      } finally {
        setDataLoading(false);
      }
    };
    fetchInitialData();
  }, [user?.id, user?.managerId, toast]);

  // Fetch sản phẩm theo kho xuất + danh sách sản phẩm đã đăng ký ở kho nhận
  useEffect(() => {
    if (!formData.fromLocationId || !formData.toLocationId) {
      setProducts([]);
      setToWarehouseRegisteredProductIds(new Set());
      setLocationLots([]);
      setItems(prev => prev.map(item => ({ ...item, productId: null, lotId: null })));
      return;
    }

    const fetchTransferableProducts = async () => {
      try {
        setDataLoading(true);

        const toLocation = locations.find(l => l.Id === formData.toLocationId);
        const toWarehouseId = Number(toLocation?.WarehouseId || 0);
        if (!toWarehouseId) {
          setProducts([]);
          setToWarehouseRegisteredProductIds(new Set());
          setLocationLots([]);
          setItems(prev => prev.map(item => ({ ...item, productId: null, lotId: null })));
          notifyFormError("Không xác định được kho tổng của kho nhận.");
          return;
        }

        const [fromProducts, toWarehouseRes, lotRes] = await Promise.all([
          productsApi.getProductsByLocation(formData.fromLocationId!),
          productWarehouseApi.getByWarehouse(toWarehouseId, { isActive: true, page: 1, pageSize: 1000 }),
          productLotsApi.getLotsByLocationId(formData.fromLocationId!)
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const registeredIds = new Set((toWarehouseRes?.Items || []).map((it: any) => Number(it.ProductId || it.productId)));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transferableProducts = (fromProducts || []).filter((p: any) => registeredIds.has(Number(p.Id || p.id)));

        setProducts(transferableProducts);
        setToWarehouseRegisteredProductIds(registeredIds);
        setLocationLots(lotRes || []);

        // Reset item không còn hợp lệ theo rule: phải có ở kho xuất và được đăng ký ở kho nhận
        setItems(prev => prev.map(item => {
          let currentProductId = item.productId;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (currentProductId && !transferableProducts.some((p: any) => Number(p.Id || p.id) === Number(currentProductId))) {
            currentProductId = null;
          }

          let newLotId = null;
          if (currentProductId) {
            const firstLot = (lotRes as { Id: number; ProductId: number }[]).find(l => Number(l.ProductId) === Number(currentProductId));
            newLotId = firstLot?.Id || null;
          }

          return { ...item, productId: currentProductId, lotId: newLotId };
        }));
      } catch (error) {
        console.error("Lỗi tải sản phẩm theo kho xuất/kho nhận:", error);
        notifyActionError("Không thể tải danh sách sản phẩm đủ điều kiện điều chuyển.");
      } finally {
        setDataLoading(false);
      }
    };

    fetchTransferableProducts();
  }, [formData.fromLocationId, formData.toLocationId, locations, toast]);

  // Mapping options cho OdooDropdown
  const productOptions = useMemo(() =>
    products.map(p => ({
      id: p.Id,
      displayValue: p.Name,
      secondaryValue: p.Code
    })), [products]
  );

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await warehouseApi.getWarehousesForCurrentUser();
        const list = Array.isArray(res) ? res : (res?.Items || res?.items || []);
        const map: Record<number, string> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        list.forEach((w: any) => {
          const id = Number(w.Id || w.id);
          if (id) map[id] = String(w.Name || w.name || "");
        });
        setWarehouseNameById(map);
      } catch {
        // ignore warehouse name mapping errors
      }
    };
    loadWarehouses();
  }, []);

  const locationOptions = useMemo(() =>
    locations.map(loc => ({
      id: loc.Id,
      displayValue: loc.Name,
      secondaryValue: warehouseNameById[loc.WarehouseId] || loc.Code || ''
    })), [locations, warehouseNameById]
  );

  const fromLocationOptions = useMemo(
    () => locationOptions.filter((loc) => loc.id !== formData.toLocationId),
    [locationOptions, formData.toLocationId]
  );

  const toLocationOptions = useMemo(
    () => locationOptions.filter((loc) => loc.id !== formData.fromLocationId),
    [locationOptions, formData.fromLocationId]
  );

  // Handlers
  const addLine = () => {
    setItems([...items, { id: Date.now(), productId: null, lotId: null, requestedQty: 1 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    } else {
      setItems([{ id: Date.now(), productId: null, lotId: null, requestedQty: 1 }]);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateItem = useCallback((id: number, field: keyof TransferItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Nếu thay đổi sản phẩm, tự động chọn lotId đầu tiên của sản phẩm đó
        if (field === 'productId') {
          const firstLot = (locationLots as { Id: number; ProductId: number }[]).find(l => l.ProductId === value);
          updated.lotId = firstLot?.Id || null;
        }
        return updated;
      }
      return item;
    }));
  }, [locationLots]);

  const ensureProductCanTransfer = useCallback(async (rowId: number, productId: number | null) => {
    if (!productId || !formData.toLocationId || !formData.fromLocationId) return;

    const inFrom = products.some((p) => Number(p.Id) === Number(productId));
    const registeredInToWarehouse = toWarehouseRegisteredProductIds.has(Number(productId));

    if (!inFrom || !registeredInToWarehouse) {
      setItems(prev => prev.map(item => item.id === rowId ? { ...item, productId: null, lotId: null } : item));
      notifyFormError("Chỉ được chọn sản phẩm có tại kho xuất và đã đăng ký ở kho nhận.");
    }
  }, [formData.fromLocationId, formData.toLocationId, products, toWarehouseRegisteredProductIds, toast]);

  const validateForm = () => {
    const toLocationId = formData.toLocationId;
    if (!formData.fromLocationId || !toLocationId || items.some(i => !i.productId) || items.some(i => i.requestedQty <= 0)) {
      notifyFormError("Vui lòng điền đầy đủ thông tin kho, sản phẩm và số lượng lớn hơn 0.");
      return false;
    }

    if (formData.fromLocationId === toLocationId) {
      notifyFormError("Kho xuất và kho nhận không được trùng nhau.");
      return false;
    }
    return true;
  };

  const toLocationId = formData.toLocationId; // Shortcut

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const fromLoc = locations.find(l => l.Id === formData.fromLocationId);
      const request: CreateTransferOrderRequest = {
        PlannedDate: formData.transferDate,
        WarehouseId: fromLoc?.WarehouseId || 0,
        FromLocationId: formData.fromLocationId!,
        ToLocationId: toLocationId!,
        Note: formData.notes,
        Items: items.map(item => {
          const prod = products.find(p => p.Id === item.productId);
          return {
            ProductId: item.productId as number,
            LotId: item.lotId || 0,
            RequestedQty: item.requestedQty,
            UomId: prod?.BaseUomId || 0
          };
        })
      };

      await transferOrdersApi.createTransfer(request);
      notifySuccess("Đã lưu nháp phiếu điều chuyển.");
      onSave?.();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const backendMsg = error.response?.data?.message || error.response?.data?.title || error.message;
      notifyActionError((backendMsg && String(backendMsg)) || "Không thể lưu nháp phiếu điều chuyển.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const fromLoc = locations.find(l => l.Id === formData.fromLocationId);
      const request: CreateTransferOrderRequest = {
        PlannedDate: formData.transferDate,
        WarehouseId: fromLoc?.WarehouseId || 0,
        FromLocationId: formData.fromLocationId!,
        ToLocationId: toLocationId!,
        Note: formData.notes,
        Items: items.map(item => {
          const prod = products.find(p => p.Id === item.productId);
          return {
            ProductId: item.productId as number,
            LotId: item.lotId || 0,
            RequestedQty: item.requestedQty,
            UomId: prod?.BaseUomId || 0
          };
        })
      };

      // 1. Tạo phiếu (mặc định là DRAFT)
      const res = await transferOrdersApi.createTransfer(request);
      const newId = res.data?.Id;

      if (newId) {
        // 2. Xác nhận (Check availability)
        await transferOrdersApi.checkAvailability(newId);
        notifySuccess("Đã xác nhận phiếu điều chuyển.");
      } else {
        // Trường hợp BE chưa cập nhật code trả về data, vẫn báo thành công nhưng không check availability tự động được
        notifySuccess("Đã tạo phiếu điều chuyển. Vui lòng xác nhận thủ công trong danh sách.");
      }

      onSave?.();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      const backendMsg = error.response?.data?.message || error.response?.data?.title || error.message;
      notifyActionError((backendMsg && String(backendMsg)) || "Không thể xác nhận phiếu điều chuyển.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-[1200px] h-[min(86vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] rounded-[2rem] border border-[#E4002B]/30 shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        <div className="relative z-[2] shrink-0 px-5 py-2 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-1.5 shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
          <div className="flex flex-col items-center text-center min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-7 bg-[#E4002B] rounded-full shrink-0" />
              <div>
                <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">Phiếu điều chuyển</p>
                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-0.5">Lập phiếu điều chuyển nội bộ</h2>
              </div>
            </div>
            <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Luân chuyển hàng hóa giữa các kho trong hệ thống</p>
          </div>

          <button
            onClick={onClose}
            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
            aria-label="Đóng"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex flex-wrap justify-center items-center gap-2">
            {STATUS_FLOW.map((status, index) => (
              <React.Fragment key={status.key}>
                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${status.key === 'DRAFT' ? 'bg-white text-[#E4002B] border-white shadow-md' : 'bg-white/10 text-white/80 border-white/30'}`}>
                  {status.label}
                </span>
                {index < STATUS_FLOW.length - 1 && <span className="text-white/50 text-xs font-light">›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5">
          <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,438px)] gap-4 overflow-hidden">
            <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
              <div className="shrink-0 flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Danh sách sản phẩm</h4>
                </div>
                <button
                  type="button"
                  onClick={addLine}
                  className="px-5 h-10 bg-[#E4002B] text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E4002B] hover:bg-[#cc0027] active:scale-95 transition-all whitespace-nowrap"
                >
                  + Thêm sản phẩm
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-auto custom-scrollbar pr-1">
                {items.length === 0 ? (
                  <div className="h-full min-h-[200px] rounded-[2rem] border border-[#E4002B]/25 bg-gradient-to-b from-[#fff7f8] to-white shadow-sm flex items-center justify-center">
                    <div className="text-center px-6 py-8">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Chưa có sản phẩm</p>
                      <p className="text-[11px] text-gray-400 mt-2 font-medium">Dùng nút &quot;+ Thêm sản phẩm&quot; để thêm dòng</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const unit = products.find((p) => p.Id === item.productId)?.BaseUomName || '--';
                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 hover:border-red-100/50 transition-all"
                        >
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(12rem,1fr)_190px_52px] sm:gap-3 sm:items-end">
                            <div className="min-w-0">
                              <p className="mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</p>
                              <OdooDropdown
                                portal={true}
                                items={productOptions}
                                value={productOptions.find((p) => p.id === item.productId) || null}
                                onChange={async (p) => {
                                  const selectedId = p?.id || null;
                                  updateItem(item.id, 'productId', selectedId);
                                  await ensureProductCanTransfer(item.id, selectedId);
                                }}
                                displayField="displayValue"
                                secondaryField="secondaryValue"
                                placeholder={(!formData.fromLocationId || !formData.toLocationId) ? "Chọn Kho Xuất Và Kho Nhận Trước" : "Chọn Sản Phẩm..."}
                                className="w-full !h-11 !py-0 !rounded-[1rem] !px-4"
                                triggerClassName="!h-11 !rounded-[1rem] !px-4"
                                listMaxHeight="max-h-[170px]"
                                disabled={!formData.fromLocationId || !formData.toLocationId}
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                              <div className="grid h-11 w-full grid-cols-2 overflow-hidden rounded-[1rem] border border-gray-200 bg-white shadow-sm">
                                <input
                                  type="number"
                                  min={1}
                                  max={2147483647}
                                  className="h-full w-full bg-transparent px-1.5 text-center text-[11px] font-black tabular-nums text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  value={item.requestedQty ?? ''}
                                  onChange={(e) => updateItem(item.id, 'requestedQty', e.target.value === '' ? '' : Number(e.target.value))}
                                  placeholder="1"
                                />
                                <div className="flex min-w-0 items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                                  {unit}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="h-11 w-[52px] shrink-0 rounded-[1rem] border border-gray-200/90 bg-white text-[9px] font-black uppercase tracking-widest text-gray-700 transition-all hover:border-red-200/80 hover:bg-red-50/40 hover:text-[#E4002B] active:scale-95"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-0.5 pr-2.5 pb-1.5 pt-0.5">
                <div className="min-h-0 max-h-full overflow-y-auto custom-scrollbar rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-md shadow-gray-200/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Thông tin điều chuyển</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho xuất (nguồn)</label>
                      <OdooDropdown
                        portal
                        items={fromLocationOptions}
                        value={locationOptions.find(l => l.id === formData.fromLocationId) || null}
                        onChange={(val) => setFormData(prev => ({ ...prev, fromLocationId: val?.id || null }))}
                        displayField="displayValue"
                        secondaryField="secondaryValue"
                        placeholder="Chọn Kho Xuất..."
                        className="w-full"
                        triggerClassName={transferDropdownTrigger}
                        listMaxHeight="max-h-56"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho nhận (đích)</label>
                      <OdooDropdown
                        portal
                        items={toLocationOptions}
                        value={locationOptions.find(l => l.id === formData.toLocationId) || null}
                        onChange={(val) => setFormData(prev => ({ ...prev, toLocationId: val?.id || null }))}
                        displayField="displayValue"
                        secondaryField="secondaryValue"
                        placeholder="Chọn Kho Nhận..."
                        className="w-full"
                        triggerClassName={transferDropdownTrigger}
                        listMaxHeight="max-h-56"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ngày tạo phiếu</label>
                        <div className="relative">
                          <input
                            type="text"
                            disabled
                            value={new Date().toLocaleDateString('vi-VN')}
                            className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-10 bg-gray-100/60 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 outline-none cursor-not-allowed kfc-form-field-shadow"
                          />
                          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        </div>
                      </div>
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ngày dự kiến</label>
                        <div className="relative w-full min-w-0 kfc-receipt-datepicker-container [&_.react-datepicker-wrapper]:!block [&_.react-datepicker-wrapper]:!w-full [&_.react-datepicker__input-container]:!w-full">
                          <DatePicker
                            id="transfer-planned-date"
                            locale="vi"
                            calendarClassName="kfc-datepicker-custom"
                            portalId="kfc-transfer-portal"
                            fixedHeight
                            selected={formData.transferDate ? new Date(formData.transferDate + "T00:00:00") : null}
                            minDate={new Date()}
                            onChange={(date: Date | null) => {
                              if (date) {
                                const y = date.getFullYear();
                                const m = String(date.getMonth() + 1).padStart(2, '0');
                                const d = String(date.getDate()).padStart(2, '0');
                                setFormData(prev => ({ ...prev, transferDate: `${y}-${m}-${d}` }));
                              }
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Chọn Ngày..."
                            className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-16 bg-gray-50/50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-800 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/20 kfc-form-field-shadow hover:bg-white hover:border-red-100/30"
                          />
                          <button
                            type="button"
                            className="absolute right-11 top-1/2 z-[2] -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                            aria-label="Mở lịch"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              const el = document.getElementById("transfer-planned-date");
                              el?.focus();
                              el?.click();
                            }}
                          >
                            <Calendar className="h-3.5 w-3.5 pointer-events-none" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ghi chú phiếu điều chuyển</label>
                      <input
                        type="text"
                        placeholder="Nhập ghi chú nội bộ..."
                        className="w-full h-10 px-3.5 bg-gray-50/50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-800 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/20 kfc-form-field-shadow"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full px-0.5 pr-2.5 pb-1.5 box-border">
                <div className="w-full rounded-[1.25rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-3 py-2.5 flex flex-col gap-2 box-border min-w-0">
                  <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                    <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap uppercase tracking-[0.08em]">
                      Ngày tạo {new Date().toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">
                    <div className="flex gap-2 items-baseline min-w-0 justify-between">
                      <span className="text-white/80 uppercase">Số sản phẩm</span>
                      <span className="text-white tabular-nums">{items.length}</span>
                    </div>
                    <div className="flex gap-2 items-baseline min-w-0 justify-between">
                      <span className="text-white/80 uppercase">Tổng số lượng điều chuyển</span>
                      <span className="text-white tabular-nums">{items.reduce((sum, it) => sum + (Number(it.requestedQty) || 0), 0)}</span>
                    </div>
                    <div className="flex gap-2 items-baseline min-w-0 justify-between">
                      <span className="text-white/80 uppercase">Trạng thái</span>
                      <span className="text-white">Nháp</span>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1.5 border-t border-white/15 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSubmitting || dataLoading}
                      className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                    >
                      {isSubmitting ? "Đang xử lý..." : "Lưu đơn nháp"}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmOrder}
                      disabled={isSubmitting || dataLoading}
                      className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                    >
                      {isSubmitting ? "Đang xử lý..." : "Xác nhận đơn"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTransferForm;