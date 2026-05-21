/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import {
  Package,
  Truck,
  X,
  AlertTriangle,
  CheckCircle,
  Play,
  Ship,
  Check,
  FileText,
  Clock,
  Calendar,
  ClipboardList,
  StickyNote,
  ChevronRight,
  Edit3
} from 'lucide-react';
import {
  Transfer,
  TransferItem,
  TransferStatus
} from '@/types/warehouse';
import { stockDocumentsApi } from '@/lib/api/warehouse/stockDocumentsApi';
import { productsApi } from '@/lib/api/warehouse/productsApi';
import { productLotsApi } from '@/lib/api/warehouse/productLotsApi';
import { ordersApi } from '@/lib/api/warehouse/ordersApi';
import { locationsApi } from '@/lib/api/warehouse/locationsApi';
import { supplierApi } from '@/lib/api/warehouse/supplierApi';
import { partnersApi } from '@/lib/api/warehouse/partnersApi';
import { useToast } from '@/components/ui/ToastProvider';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OdooDropdown from '@/components/common/OdooDropdown';

interface Props {
  transfer: Transfer | null;
  onClose: () => void;
  onUpdate: (updatedData: Transfer) => void;
  onStatusChange?: (transferId: number | null, newStatus: TransferStatus) => void;
}

type TabType = 'products' | 'notes';

registerLocale('vi', vi);

// Status configuration with colors and labels
const STATUS_CONFIG: Record<TransferStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  DRAFT: { label: 'Nháp', bgColor: 'bg-gray-100', textColor: 'text-gray-600', borderColor: 'border-gray-200' },
  WAITING: { label: 'Không đủ tồn kho', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
  READY: { label: 'Sẵn sàng', bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-200' },
  DONE: { label: 'Hoàn thành', bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-200' },
  CANCELLED: { label: 'Đã hủy', bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-200' },
};

// Status transition flow
const STATUS_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  DRAFT: ['WAITING', 'READY', 'CANCELLED'],
  WAITING: ['READY', 'CANCELLED'],
  READY: ['DONE', 'CANCELLED'],
  DONE: [],
  CANCELLED: [],
};

// Button configuration for status transitions
const TRANSITION_BUTTONS: Record<string, { label: string; icon: React.ReactNode; bgColor: string; hoverColor: string }> = {
  WAITING: { label: 'Xử lý', icon: <Play className="w-4 h-4" />, bgColor: 'bg-yellow-500', hoverColor: 'hover:bg-yellow-600' },
  READY: { label: 'Sẵn sàng', icon: <Check className="w-4 h-4" />, bgColor: 'bg-blue-500', hoverColor: 'hover:bg-blue-600' },
  DONE: { label: 'Hoàn thành', icon: <CheckCircle className="w-4 h-4" />, bgColor: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
  CANCELLED: { label: 'Hủy phiếu', icon: <X className="w-4 h-4" />, bgColor: 'bg-red-500', hoverColor: 'hover:bg-red-600' },
};

// Status flow for Odoo-style statusbar (main flow only)
const STATUS_FLOW: { key: TransferStatus; label: string }[] = [
  { key: 'DRAFT', label: 'Nháp' },
  { key: 'WAITING', label: 'Kiểm tra tồn kho' },
  { key: 'READY', label: 'Sẵn sàng' },
  { key: 'DONE', label: 'Hoàn thành' },
];

// Special statuses outside main flow
const SPECIAL_STATUSES: TransferStatus[] = ['CANCELLED'];

const TransferDetailBox: React.FC<Props> = ({ transfer, onClose, onUpdate, onStatusChange }) => {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Transfer | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('products');

  const outboundDropdownTrigger =
    '!h-10 !min-h-0 !px-3 !rounded-lg kfc-form-field-shadow hover:!shadow-[0_4px_18px_-6px_rgba(15,23,42,0.1),0_2px_10px_-4px_rgba(228,0,43,0.12)] !text-[10px] !leading-snug [&>div:first-child]:gap-2 [&_input]:!text-[10px] [&_input]:!font-bold [&_input]:!text-gray-800 [&_.odoo-dropdown-value]:!text-[10px] [&_.odoo-dropdown-value]:!font-bold [&_.odoo-dropdown-value]:!text-gray-800 [&_.odoo-dropdown-placeholder]:!text-[10px] [&_.odoo-dropdown-placeholder]:!font-medium [&_.odoo-dropdown-placeholder]:!text-gray-400 [&_svg]:!size-3.5 [&>div:last-child]:!pl-2.5 [&>div:last-child]:!gap-1';

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Combobox Data
  const [locationsList, setLocationsList] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [originalItemIds, setOriginalItemIds] = useState<number[]>([]);

  const productOptions = useMemo(() =>
    productsList.map(p => ({
      ...p,
      id: p.id ?? p.Id,
      displayValue: p.name ?? p.Name,
      secondaryValue: p.code ?? p.Code ?? ''
    })), [productsList]
  );

  const customerOptions = useMemo(() =>
    suppliersList.map(c => ({
      ...c,
      id: c.Id ?? (c as any).id,
      displayValue: c.CustomerName ?? (c as any).customerName ?? (c as any).Name ?? (c as any).name,
      secondaryValue:
        c.Phone ??
        (c as any).phone ??
        (c as any).PhoneNumber ??
        (c as any).phoneNumber ??
        (c as any).Mobile ??
        (c as any).mobile ??
        (c as any).ContactPhone ??
        (c as any).contactPhone ??
        ''
    })), [suppliersList]
  );

  const locationOptions = useMemo(() =>
    locationsList.map(loc => ({
      ...loc,
      id: (loc as any).id ?? (loc as any).Id,
      displayValue: loc.name ?? (loc as any).Name,
      secondaryValue: loc.code ?? (loc as any).Code ?? loc.type ?? (loc as any).Type ?? ''
    })), [locationsList]
  );

  const resolvedCustomerPhone = useMemo(() => {
    const rawPhone = String(formData?.customerPhone ?? '').trim();
    if (rawPhone) return rawPhone;

    const selectedCustomer = customerOptions.find(c => c.id === formData?.customerId);
    const fallback = String(selectedCustomer?.secondaryValue ?? '').trim();
    return fallback;
  }, [formData?.customerPhone, formData?.customerId, customerOptions]);

  const handleCustomerChange = useCallback((selectedCustomer: any) => {
    setFormData(prev => {
      if (!prev) return prev;

      const isOutTransfer = prev.documentType === 'OUT' || prev.documentType === 'TRANSFER';
      const isInTransfer = prev.documentType === 'IN';

      const mappedPhone =
        selectedCustomer?.secondaryValue ??
        selectedCustomer?.Phone ??
        selectedCustomer?.phone ??
        selectedCustomer?.PhoneNumber ??
        selectedCustomer?.phoneNumber ??
        selectedCustomer?.Mobile ??
        selectedCustomer?.mobile ??
        selectedCustomer?.ContactPhone ??
        selectedCustomer?.contactPhone ??
        '';

      const mappedAddress =
        selectedCustomer?.Address ??
        selectedCustomer?.address ??
        selectedCustomer?.FullAddress ??
        selectedCustomer?.fullAddress ??
        selectedCustomer?.DeliveryAddress ??
        selectedCustomer?.deliveryAddress ??
        '';

      return {
        ...prev,
        customerId: selectedCustomer?.id || null,
        customerName: selectedCustomer?.displayValue || '',
        customerPhone: mappedPhone,
        destination: mappedAddress,
        toLocationId: isOutTransfer ? (selectedCustomer?.id || null) : prev.toLocationId,
        fromLocationId: isInTransfer ? (selectedCustomer?.id || null) : prev.fromLocationId,
      };
    });
  }, []);

  const handleLocationChange = useCallback(async (selectedLocation: any) => {
    const newLocationId = selectedLocation?.id || null;
    if (!formData) return;

    setIsLoading(true);
    try {
      // Validate existing lines against the new location
      const validatedItems = await Promise.all(formData.items.map(async (item) => {
        if (!item.productId || !newLocationId) return item;

        try {
          const availableLots = await productLotsApi.getLotsByLocationAndProductId(newLocationId, item.productId);
          if (availableLots && availableLots.length > 0) {
            return {
              ...item,
              lotOptions: availableLots,
              lotId: availableLots[0].Id,
              lotNumber: availableLots[0].LotNumber
            };
          } else {
            // Product not available in new location -> Reset line
            return {
              ...item,
              productId: null as any,
              productName: '',
              uomId: null,
              unitPrice: 0,
              lotOptions: [],
              lotId: null,
              lotNumber: '',
              actualQty: 0
            };
          }
        } catch (err) {
          return item;
        }
      }));

      setFormData({
        ...formData,
        fromLocationId: newLocationId,
        fromLocationName: selectedLocation?.displayValue || '',
        items: validatedItems
      });
      toast.info("Đã cập nhật kho xuất và kiểm tra tồn kho cho các sản phẩm", "Cập Nhật");
    } catch (error) {
      console.error("Error updating location:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, productLotsApi, toast]);

  const handleToLocationChange = useCallback((selectedLocation: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        toLocationId: selectedLocation?.id || null,
        destination: selectedLocation?.displayValue || ''
      };
    });
  }, []);

  useEffect(() => {
    const fetchProductsForWarehouse = async () => {
      // Nếu là phiếu OUT (Xuất kho) thì filter theo kho xuất
      // Nếu là phiếu IN (Nhập kho) thì có thể lấy All Products hoặc tùy logic
      const locId = formData?.fromLocationId;
      if (!locId) {
        // Fallback to all products or empty
        try {
          const prodData = await productsApi.getProducts({ pageSize: 1000, isActive: true });
          let pList = [];
          if (Array.isArray(prodData)) pList = prodData;
          else if (prodData && typeof prodData === 'object') pList = (prodData as any).Items || (prodData as any).items || (prodData as any).data || [];
          setProductsList(pList);
        } catch (err) {
          console.error(err);
        }
        return;
      }

      try {
        const data = await productsApi.getProductsByLocation(locId);
        setProductsList(data);
      } catch (err) {
        console.error("Failed to fetch products for location:", err);
      }
    };
    if (isEditing) {
      fetchProductsForWarehouse();
    }
  }, [formData?.fromLocationId, isEditing]);

  useEffect(() => {
    // Tải danh sách kho và nhà cung cấp / khách hàng để cho việc edit combobox
    const fetchDropdownData = async () => {
      try {
        const [locData, supData, custData] = await Promise.all([
          locationsApi.getAllLocations(),
          transfer?.documentType === 'IN' ? supplierApi.getSuppliers({ pageSize: 100 }) : Promise.resolve({ Items: [] }),
          transfer?.documentType === 'OUT' ? partnersApi.getCustomers(1, 100) : Promise.resolve({ items: [] }),
        ]);
        setLocationsList(locData);
        if (transfer?.documentType === 'IN') {
          setSuppliersList(supData.Items || []);
        } else if (transfer?.documentType === 'OUT') {
          setSuppliersList(custData.items || custData.data || custData.Items || []);
        } else {
          setSuppliersList([]);
        }
      } catch (err) {
        console.error("Failed to load dropdown data:", err);
      }
    };
    fetchDropdownData();
  }, [transfer?.documentType]);

  const addLine = () => {
    if (!formData) return;
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { id: Date.now(), productId: null, productName: '', plannedQty: 0, actualQty: 0, unitPrice: 0 } as any
      ]
    });
  };

  const removeItem = (idxToRemove: number) => {
    if (!formData) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, idx) => idx !== idxToRemove)
    });
  };

  const mapStatus = (status?: string): TransferStatus => {
    const statusMap: Record<string, TransferStatus> = {
      'draft': 'DRAFT',
      'waiting': 'WAITING',
      'ready': 'READY',
      'done': 'DONE',
      'cancelled': 'CANCELLED'
    };
    return statusMap[status?.toLowerCase() || ''] || 'DRAFT';
  };

  // Cập nhật formData khi transfer prop thay đổi bằng cách GET API lấy chi tiết
  const fetchTransferDetails = async () => {
    if (!transfer?.id) {
      setFormData(null);
      return;
    }
    try {
      setIsLoading(true);
      const detailData = await stockDocumentsApi.getOutTransferById(transfer.id);

      let enrichedItems: any[] = [];
      if (detailData.items || detailData.Items) {
        const rawItems = detailData.items || detailData.Items;
        enrichedItems = await Promise.all(rawItems.map(async (item: any) => {
          let productName = item.productName || item.ProductName;
          let uomName = item.unitName || item.UomName;
          let lotNumber = item.lotNumber || item.LotNumber;

          if (!productName || !uomName) {
            try {
              const p = await productsApi.getProductById(item.productId || item.ProductId);
              productName = productName || p.Name;
              uomName = uomName || p.BaseUomName;
            } catch (err) {
              console.error(`Failed to fetch product ${item.productId}:`, err);
            }
          }

          const lotId = item.lotId || item.LotId;
          if (lotId && !lotNumber) {
            try {
              const l = await productLotsApi.getLotById(lotId);
              lotNumber = l.LotNumber;
            } catch (err) {
              console.error(`Failed to fetch lot ${lotId}:`, err);
            }
          }

          return {
            ...item,
            ResolvedProductName: productName,
            ResolvedUomName: uomName,
            ResolvedLotNumber: lotNumber || '--'
          };
        }));
      }

      const mappedFormData: Transfer = {
        id: detailData.id || detailData.Id,
        code: detailData.orderNo || detailData.OrderNo || transfer.code,
        documentType: transfer.documentType,
        status: mapStatus(detailData.status || detailData.Status),
        referenceType: transfer.referenceType,
        referenceId: detailData.id || detailData.Id,
        saleOrderNo: detailData.orderNo || detailData.OrderNo || transfer.saleOrderNo,
        fromLocationId: detailData.fromLocationId || detailData.FromLocationId || transfer.fromLocationId,
        fromLocationName: detailData.fromLocationName || detailData.FromLocationName || transfer.fromLocationName || "Kho tổng trung tâm",
        toLocationId: detailData.toLocationId || detailData.ToLocationId || transfer.toLocationId,
        destination: detailData.toLocationName || detailData.ToLocationName || transfer.destination,
        customerId: detailData.customerId || detailData.CustomerId || transfer.customerId,
        customerName: detailData.customerName || detailData.CustomerName || transfer.customerName,
        customerPhone:
          detailData.customerPhone ||
          detailData.CustomerPhone ||
          detailData.phone ||
          detailData.Phone ||
          detailData.phoneNumber ||
          detailData.PhoneNumber ||
          transfer.customerPhone,
        date: (detailData.plannedDate || detailData.PlannedDate) ? (() => {
          const d = new Date(detailData.plannedDate || detailData.PlannedDate);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${dd}`;
        })() : transfer.date,
        completedAt: detailData.completedAt || detailData.CompletedAt || transfer.completedAt,
        carrierId: transfer.carrierId,
        carrierName: transfer.carrierName,
        carrier: transfer.carrier,
        responsible: detailData.createdByName || detailData.CreatedByName || transfer.responsible,
        notes: detailData.note || detailData.Note || "",

        items: enrichedItems.map((i: any) => ({
          id: i.id || i.Id,
          productId: i.productId || i.ProductId,
          productName: i.ResolvedProductName || 'Unknown Product',
          lotId: i.lotId || i.LotId || null,
          lotNumber: i.ResolvedLotNumber,
          expirationDate: i.expirationDate || i.ExpirationDate || null,
          plannedQty: i.orderedQty || i.OrderedQty || 0,
          actualQty: i.shippedQty || i.ShippedQty || i.orderedQty || i.OrderedQty || 0,
          unitPrice: i.unitPrice || i.UnitPrice || 0,
          uomId: null,
          unitName: i.ResolvedUomName || '--',
          availableQty: 0
        }))
      };

      setOriginalItemIds(mappedFormData.items.map(i => i.id).filter(id => typeof id === 'number') as number[]);
      setFormData(mappedFormData);
      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết phiếu xuất:", error);
      setFormData({ ...transfer, notes: transfer.notes || "", fromLocationName: transfer.fromLocationName || "Kho tổng trung tâm" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransferDetails();
  }, [transfer]);

  if (!transfer || !formData) return null;

  const handleSave = async () => {
    if (!formData.id) return;
    try {
      setIsLoading(true);

      if (formData.documentType === 'IN') {
        const updatePromises = formData.items.map(item => {
          if (!item.id) return Promise.resolve();
          return ordersApi.updatePurchaseOrderItemReceivedQty(item.id, item.actualQty);
        });
        await Promise.all(updatePromises);
        toast.success("Cập nhật số lượng nhập kho thành công", "Thành Công");
      } else {
        // Fail-safe: Tự động cộng dồn các dòng trùng sản phẩm/lot trước khi gửi lên Server
        const consolidatedMap = new Map<string, { id?: number; productId: number; orderedQty: number; unitPrice: number; lotId: number | null }>();

        formData.items.forEach((item) => {
          if (!item.productId) return;
          const key = `${item.productId}-${item.lotId || 'no-lot'}`;
          const currentQty = typeof item.actualQty === 'number' ? item.actualQty : Number(item.actualQty) || 0;

          if (consolidatedMap.has(key)) {
            const existing = consolidatedMap.get(key)!;
            existing.orderedQty += currentQty;
          } else {
            consolidatedMap.set(key, {
              id: originalItemIds.includes(item.id as number) ? (item.id as number) : undefined,
              productId: item.productId,
              orderedQty: currentQty,
              unitPrice: item.unitPrice || 0,
              lotId: item.lotId
            });
          }
        });

        await stockDocumentsApi.updateSaleOrderHeader(formData.id, {
          note: formData.notes,
          customerId: formData.customerId,
          locationId: formData.fromLocationId,
          toLocationId: formData.documentType === 'OUT' ? formData.customerId : formData.toLocationId,
          plannedDate: formData.date
        });

        const consolidatedItems = Array.from(consolidatedMap.values());
        const updatePromises = consolidatedItems.map(item => {
          const payload = {
            productId: item.productId,
            orderedQty: item.orderedQty,
            unitPrice: item.unitPrice
          };

          if (item.id) {
            return stockDocumentsApi.updateSaleOrderItem(formData.id!, item.id, payload);
          } else {
            return stockDocumentsApi.addSaleOrderItem(formData.id!, payload);
          }
        });

        // Xóa các item cũ không còn trong danh sách đã consolidate
        const deletePromises = originalItemIds
          .filter(id => !consolidatedItems.some(item => item.id === id))
          .map(id => stockDocumentsApi.deleteSaleOrderItem(formData.id!, id));

        await Promise.all([...updatePromises, ...deletePromises]);
        toast.success("Cập nhật phiếu xuất thành công", "Thành Công");
      }

      await fetchTransferDetails();
      if (onUpdate) onUpdate(formData);
      setIsEditing(false);
    } catch (error: any) {
      console.error("Lỗi khi lưu phiếu:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu phiếu", "Thất Bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: TransferStatus | 'READY') => {
    if (!formData.id) return;
    try {
      setIsLoading(true);
      let response;

      if (newStatus === 'CHECK_AVAILABILITY' as any) {
        response = await stockDocumentsApi.checkAvailability(formData.id);
        const fbStatus = mapStatus(response?.data?.status || response?.data?.Status || response?.status || response?.Status || '');
        const vnStatus = {
          'DRAFT': 'Nháp',
          'WAITING': 'Chờ xử lý',
          'READY': 'Đã sẵn sàng',
          'DONE': 'Hoàn thành',
          'CANCELLED': 'Đã hủy'
        }[fbStatus] || fbStatus;

        toast.success(`Đã kiểm tra tồn kho. Trạng thái hiện tại: ${vnStatus}`, "Trạng Thái");
      }
      else if (newStatus === 'DONE') {
        response = await stockDocumentsApi.completeSaleOrder(formData.id);
        toast.success("Hoàn thành phiếu xuất kho thành công!", "Trạng Thái");
      }
      else if (newStatus === 'CANCELLED') {
        response = await stockDocumentsApi.cancelSaleOrder(formData.id);
        toast.success("Đã hủy phiếu xuất kho!", "Trạng Thái");
      }
      else {
        return;
      }

      await fetchTransferDetails();

      if (onStatusChange) {
        const returnedStatus = response?.data?.status || response?.status;
        const finalStatus = returnedStatus ? mapStatus(returnedStatus) : (newStatus as TransferStatus);
        onStatusChange(formData.id, finalStatus);
      }
    } catch (error: any) {
      console.error("Lỗi khi chuyển trạng thái:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi chuyển trạng thái", "Thất Bại");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!formData.id) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!formData.id) return;

    try {
      setIsLoading(true);
      await stockDocumentsApi.deleteSaleOrder(formData.id);
      toast.success("Đã xóa phiếu nháp thành công!", "Trạng Thái");
      if (onUpdate) onUpdate(formData);
      onClose();
    } catch (error: any) {
      console.error("Lỗi khi xóa phiếu:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi xóa phiếu", "Thất Bại");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if expiration date is expired or expiring soon (within 30 days)
  const getExpirationStatus = (expirationDate: string | null): { isExpired: boolean; isExpiringSoon: boolean; daysUntilExpiry: number | null } => {
    if (!expirationDate) return { isExpired: false, isExpiringSoon: false, daysUntilExpiry: null };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(expirationDate);
    expDate.setHours(0, 0, 0, 0);

    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isExpired: diffDays < 0,
      isExpiringSoon: diffDays >= 0 && diffDays <= 30,
      daysUntilExpiry: diffDays
    };
  };

  // Check quantity discrepancy
  const hasQuantityDiscrepancy = (item: TransferItem): boolean => {
    return item.plannedQty !== item.actualQty;
  };

  const statusKey = (formData.status || 'DRAFT').toUpperCase() as TransferStatus;
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG['DRAFT'];
  const availableTransitions = STATUS_TRANSITIONS[statusKey] || [];

  const totalItemLines = formData.items.length;
  const totalAmount = formData.items.reduce(
    (sum, item) => sum + (Number(item.actualQty) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const totalPlannedQty = formData.items.reduce((sum, item) => sum + (Number(item.plannedQty) || 0), 0);

  // BE restricts updates to DRAFT only for SaleOrders/Outbound
  // For IN (Receipts), we might allow updating 'actualQty' during the process
  const isEditable = formData.documentType === 'IN'
    ? (statusKey !== 'DONE' && statusKey !== 'CANCELLED')
    : (statusKey === 'DRAFT');

  const isTransferDoc = formData.documentType === 'TRANSFER';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" aria-hidden="true" />
      <div
        className="relative bg-white w-[1200px] max-w-[96vw] h-[min(86vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] min-h-0 rounded-[2rem] shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 pointer-events-auto border border-[#E4002B]/30"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đang tải chi tiết...</span>
            </div>
          </div>
        )}

        <div className="relative z-[2] shrink-0 px-5 py-2 text-white flex flex-col gap-1.5 bg-[#E4002B] border-b border-[#b30022] shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
              {formData.documentType === 'IN' ? 'Phiếu nhập kho' : isTransferDoc ? 'Phiếu điều chuyển kho' : 'Phiếu xuất kho'}
            </p>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight mt-0.5">
              {formData.code || '---'}
            </h2>
            <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">
              {formData.documentType === 'IN' ? 'Chi tiết phiếu nhập kho' : isTransferDoc ? 'Chi tiết điều chuyển nội bộ' : 'Chi tiết phiếu xuất kho'}
            </p>
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
            {STATUS_FLOW.map((s, idx) => {
              const isActive = s.key === statusKey;
              const isDone = STATUS_FLOW.findIndex((x) => x.key === statusKey) > idx;
              return (
                <React.Fragment key={s.key}>
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border ${isActive
                      ? 'bg-white text-[#E4002B] border-white shadow-md'
                      : isDone
                        ? 'bg-white/20 text-white border-white/40'
                        : 'bg-white/10 text-white/80 border-white/30'
                      }`}
                  >
                    {s.label}
                  </span>
                  {idx < STATUS_FLOW.length - 1 && <span className="text-white/50 text-xs font-light">›</span>}
                </React.Fragment>
              );
            })}
            {statusKey === 'CANCELLED' && (
              <>
                <span className="text-white/50 text-xs font-light">›</span>
                <span className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border bg-white text-[#E4002B] border-white shadow-md">
                  Đã hủy
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5">
          <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,438px)] gap-4 overflow-hidden">
            <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
              <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'products'
                    ? 'bg-white text-[#E4002B] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`px-5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'notes'
                    ? 'bg-white text-[#E4002B] shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                  Ghi chú
                </button>
              </div>

              <div className="shrink-0 flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-7 bg-[#E4002B] rounded-full shrink-0" />
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest truncate">
                    {activeTab === 'products'
                      ? 'Danh sách sản phẩm'
                      : `Ghi chú ${formData.documentType === 'IN' ? 'nhập kho' : isTransferDoc ? 'điều chuyển' : 'xuất kho'}`}
                  </h4>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addLine}
                    className="px-5 h-10 bg-[#E4002B] text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E4002B] hover:bg-[#cc0027] active:scale-95 transition-all whitespace-nowrap shrink-0"
                  >
                    + Thêm sản phẩm
                  </button>
                )}
              </div>

              {activeTab === 'products' ? (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                  <div className="space-y-3">
                    {formData.items.map((item, idx) => {
                      const lineTotal = (Number(item.actualQty) || 0) * (Number(item.unitPrice) || 0);

                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-4 hover:border-red-100/50 transition-all"
                        >
                          <div className="flex flex-col">
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,180px)] sm:gap-3 sm:items-end">
                              <div className="min-w-0">
                                <p className="mb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</p>
                                {isEditing ? (
                                  <OdooDropdown
                                    portal
                                    items={productOptions}
                                    value={productOptions.find(p => p.id === item.productId) || null}
                                    onChange={async (p: any) => {
                                      if (!p?.id) {
                                        const newItems = [...formData.items];
                                        newItems[idx] = {
                                          ...newItems[idx],
                                          productId: null as any,
                                          productName: '',
                                          uomId: null,
                                          unitName: '',
                                          unitPrice: 0,
                                        };
                                        setFormData({ ...formData, items: newItems });
                                        return;
                                      }

                                      // Kiểm tra trùng sản phẩm ở dòng khác
                                      const prodId = Number(p.id);
                                      const existingIdx = formData.items.findIndex((it, i) => it.productId === prodId && i !== idx);

                                      if (existingIdx !== -1) {
                                        const newItems = [...formData.items];
                                        const currentQty = Number(newItems[idx].actualQty) || 0;
                                        const existingItem = newItems[existingIdx];
                                        existingItem.actualQty = (Number(existingItem.actualQty) || 0) + currentQty;

                                        // Xóa dòng hiện tại (nếu là dòng mới) hoặc clear nó
                                        newItems.splice(idx, 1);

                                        setFormData({ ...formData, items: newItems });
                                        toast.info(`Sản phẩm đã có trong danh sách, số lượng được cộng dồn vào dòng sẵn có`, "Cộng dồn sản phẩm");
                                        return;
                                      }

                                      try {
                                        const prodDetail = await productsApi.getProductById(prodId);
                                        const newItems = [...formData.items];
                                        newItems[idx].productId = prodId;
                                        newItems[idx].productName = p.displayValue;
                                        newItems[idx].uomId = prodDetail.BaseUomId;
                                        newItems[idx].unitName = prodDetail.BaseUomName;
                                        newItems[idx].unitPrice = prodDetail.SalePrice || 0;
                                        setFormData({ ...formData, items: newItems });
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    displayField="displayValue"
                                    secondaryField="secondaryValue"
                                    placeholder="Chọn Sản Phẩm..."
                                    className="w-full !h-11 !py-0 !rounded-[1rem] !px-4"
                                    triggerClassName="!h-11 !rounded-[1rem] !px-4"
                                    listMaxHeight="max-h-[200px]"
                                  />
                                ) : (
                                  <div className="h-11 rounded-[1rem] border border-gray-200 bg-white px-3 flex items-center">
                                    <p className="text-xs font-bold text-gray-800 truncate">{item.productName}</p>
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0 w-fit sm:min-w-[130px] sm:justify-self-end text-center">
                                <p className="mb-1 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Đơn giá</p>
                                <div className="flex h-11 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[1rem] border border-gray-200 bg-white px-4 text-[11px] font-black tabular-nums text-gray-700 shadow-sm">
                                  {new Intl.NumberFormat('vi-VN').format(item.unitPrice || 0)} / {item.unitName || 'ĐVT'}
                                </div>
                              </div>

                              <div className="min-w-0 w-full max-w-[170px] sm:justify-self-end">
                                <p className="mb-1 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lượng</p>
                                <div className="grid grid-cols-2 h-11 w-full max-w-[170px] overflow-hidden rounded-[1rem] border border-gray-200 bg-white shadow-sm transition-all">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      inputMode="numeric"
                                      min={1}
                                      className="h-full w-full bg-transparent px-1.5 text-center text-[11px] font-black tabular-nums text-gray-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      value={item.actualQty}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === '') {
                                          const newItems = [...formData.items];
                                          newItems[idx].actualQty = 0;
                                          setFormData({ ...formData, items: newItems });
                                          return;
                                        }
                                        const numVal = parseInt(val, 10);
                                        if (!isNaN(numVal) && numVal > 0) {
                                          const newItems = [...formData.items];
                                          newItems[idx].actualQty = numVal;
                                          setFormData({ ...formData, items: newItems });
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-transparent px-1.5 text-center text-[11px] font-black tabular-nums text-gray-900 flex items-center justify-center">
                                      {item.actualQty}
                                    </div>
                                  )}
                                  <div className="flex min-w-0 h-full items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                                    {item.unitName || 'ĐVT'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div role="presentation" aria-hidden className="py-3">
                              <div className="h-px w-full rounded-full bg-gray-200" />
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                              {isEditing ? (
                                <button
                                  type="button"
                                  onClick={() => removeItem(idx)}
                                  className="h-10 w-fit shrink-0 rounded-full border border-gray-200/90 bg-white px-4 text-[9px] font-black uppercase tracking-widest text-gray-800 transition-all hover:border-red-200/80 hover:bg-red-50/40 hover:text-[#E4002B] active:scale-95"
                                >
                                  Xóa
                                </button>
                              ) : (
                                <div />
                              )}
                              <p
                                className="w-full min-w-0 max-w-full text-left text-[20px] font-black leading-none text-[#E4002B] tabular-nums whitespace-nowrap overflow-hidden text-ellipsis sm:text-right sm:text-[22px]"
                                title={`${new Intl.NumberFormat('vi-VN').format(lineTotal)} VND`}
                              >
                                {new Intl.NumberFormat('vi-VN').format(lineTotal)} VND
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isEditing && (
                      <button onClick={addLine} className="w-full py-2.5 text-[10px] bg-white font-black uppercase text-gray-400 hover:bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center gap-1.5 transition-all">
                        Thêm dòng sản phẩm
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 rounded-[1.25rem] border border-gray-100 bg-white p-3">
                  {isEditing ? (
                    <textarea
                      placeholder="Nhập ghi chú quan trọng..."
                      className="w-full h-full bg-gray-50 border border-gray-200 focus:border-[#E4002B] focus:bg-white p-4 rounded-xl text-[10px] font-bold text-gray-800 transition-all outline-none resize-none placeholder:text-gray-400 kfc-form-field-shadow"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 border border-gray-200 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-800 whitespace-pre-wrap">{formData.notes || ''}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
              <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-0.5 pr-2.5 pb-1.5 pt-0.5">
                <div className="bg-white rounded-[1.25rem] border border-red-100/40 shadow-md shadow-gray-200/30 p-3 box-border min-w-0">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-1 h-6 bg-[#E4002B] rounded-full shrink-0" />
                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Thông tin xuất kho</h3>
                  </div>

                  <div className="space-y-2">
                    {/* Hàng nhãn / hàng ô tách biệt để Khách hàng & Ngày (và Địa chỉ & Liên lạc) thẳng hàng */}
                    <div className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-1.5">
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 block leading-tight self-end">
                        Khách hàng
                      </label>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 block leading-tight self-end">
                        Ngày thực hiện
                      </label>
                      <div className="min-w-0">
                        <div
                          className={`bg-white ${isEditing ? 'p-0 border-transparent' : 'h-10 min-h-[2.5rem] flex items-center px-3 py-2 border-gray-200 kfc-form-field-shadow'} rounded-xl border`}
                        >
                          {isEditing ? (
                            <OdooDropdown
                              portal
                              items={customerOptions}
                              value={customerOptions.find(c => c.id === formData.customerId) || null}
                              onChange={handleCustomerChange}
                              displayField="displayValue"
                              secondaryField="secondaryValue"
                              placeholder={formData.documentType === 'IN' ? 'Chọn Nhà Cung Cấp...' : 'Chọn Khách Hàng...'}
                              className="w-full"
                              triggerClassName={outboundDropdownTrigger}
                              listMaxHeight="max-h-[200px]"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-800 truncate">{formData.customerName || '--'}</span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div
                          className="relative h-10 min-h-[2.5rem] w-full min-w-0 kfc-receipt-datepicker-container [&_.react-datepicker-wrapper]:!flex [&_.react-datepicker-wrapper]:!h-full [&_.react-datepicker-wrapper]:!w-full [&_.react-datepicker-wrapper]:min-h-0 [&_.react-datepicker__input-container]:!flex [&_.react-datepicker__input-container]:!h-full [&_.react-datepicker__input-container]:!w-full [&_.react-datepicker__input-container]:min-h-0 [&_input]:!h-full [&_input]:!min-h-0 [&_input]:!box-border"
                        >
                          <DatePicker
                            id="transfer-detail-date-staff"
                            locale="vi"
                            wrapperClassName="!flex !h-full !w-full min-h-0"
                            selected={formData.date ? new Date(formData.date) : null}
                            onChange={(date: Date | null) => {
                              if (!date) {
                                setFormData({ ...formData, date: '' });
                                return;
                              }
                              const yyyy = date.getFullYear();
                              const mm = String(date.getMonth() + 1).padStart(2, '0');
                              const dd = String(date.getDate()).padStart(2, '0');
                              setFormData({ ...formData, date: `${yyyy}-${mm}-${dd}` });
                            }}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Chọn Ngày..."
                            isClearable={isEditing}
                            disabled={!isEditing}
                            calendarClassName="kfc-datepicker-custom"
                            portalId="kfc-stock-portal"
                            className={`box-border w-full min-h-0 flex-1 bg-white border border-gray-200 rounded-xl px-3.5 text-[10px] font-bold leading-none text-gray-800 tabular-nums outline-none transition-all kfc-form-field-shadow placeholder:font-medium placeholder:text-gray-400 ${isEditing ? 'pr-16 focus:border-[#E4002B] cursor-pointer' : 'pr-3 cursor-default bg-gray-50'}`}
                          />
                          {isEditing ? (
                            <button
                              type="button"
                              className="absolute right-11 top-1/2 z-[2] -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                              aria-label="Mở lịch"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                const el = document.getElementById('transfer-detail-date-staff');
                                el?.focus();
                                el?.click();
                              }}
                            >
                              <Calendar className="h-3.5 w-3.5 pointer-events-none" strokeWidth={2} />
                            </button>
                          ) : null}
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
                        <div className="h-10 min-h-[2.5rem] w-full rounded-xl border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3 flex items-center min-w-0" title={formData.destination || '--'}>
                          <p className="text-[10px] font-bold text-gray-800 truncate leading-tight w-full">{formData.destination || '--'}</p>
                        </div>
                        <div className="h-10 min-h-[2.5rem] w-full rounded-xl border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3 flex items-center min-w-0" title={resolvedCustomerPhone || '--'}>
                          <p className="text-[10px] font-bold text-gray-800 truncate leading-tight w-full tabular-nums">{resolvedCustomerPhone || '--'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho xuất hàng</label>
                      <div className={`bg-white ${isEditing ? 'p-0 border-transparent' : 'h-10 min-h-[2.5rem] flex items-center px-3 py-2 border-gray-200 kfc-form-field-shadow'} rounded-xl border`}>
                        {isEditing ? (
                          <OdooDropdown
                            portal
                            items={locationOptions}
                            value={locationOptions.find(l => l.id === formData.fromLocationId) || null}
                            onChange={handleLocationChange}
                            displayField="displayValue"
                            secondaryField="secondaryValue"
                            placeholder="Chọn Kho Xuất..."
                            className="w-full"
                            triggerClassName={outboundDropdownTrigger}
                            listMaxHeight="max-h-[200px]"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-800 truncate" title={formData.fromLocationName || 'Kho Tổng Trung Tâm'}>{formData.fromLocationName || 'Kho Tổng Trung Tâm'}</span>
                        )}
                      </div>
                    </div>

                    {formData.saleOrderNo && (
                      <div>
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Đơn bán hàng (SO)</label>
                        <div className="h-10 rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3 flex items-center">
                          <span className="text-[10px] font-bold text-gray-800 truncate">{formData.saleOrderNo}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0 w-full px-0.5 pr-2.5 pb-1.5 box-border">
                <div className="w-full rounded-[1.25rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-3 py-2.5 flex flex-col gap-2 kfc-summary-red-card box-border min-w-0">
                  <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                    <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap uppercase tracking-[0.08em]">
                      Ngày thực hiện {formData.date ? (formData.date.indexOf('-') !== -1 ? `${formData.date.split('-')[2]}/${formData.date.split('-')[1]}/${formData.date.split('-')[0]}` : formData.date) : '—'}
                    </p>
                  </div>

                  <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">

                    <div className="flex gap-2 items-baseline min-w-0">
                      <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                      <div className="flex flex-1 min-w-0 justify-between gap-2">
                        <span className="text-white/80 uppercase">Số sản phẩm</span>
                        <span className="text-white tabular-nums">{totalItemLines}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-baseline min-w-0">
                      <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                      <div className="flex flex-1 min-w-0 justify-between gap-2">
                        <span className="text-white/80 uppercase">Tổng số lượng kế hoạch</span>
                        <span className="text-white tabular-nums">{totalPlannedQty}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-baseline min-w-0">
                      <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
                      <div className="flex flex-1 min-w-0 justify-between gap-2">
                        <span className="text-white/80 uppercase">Trạng thái</span>
                        <span className="text-white">{statusConfig.label}</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/20 my-0.5 ml-5" />

                    <div className="flex gap-2 items-baseline min-w-0">
                      <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>•</span>
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => setIsEditing(false)} className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70">Hủy</button>
                          <button type="button" onClick={handleSave} className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white">Lưu</button>
                        </>
                      ) : (
                        <>
                          {isEditable && <button type="button" onClick={() => setIsEditing(true)} className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white">Chỉnh sửa</button>}
                          {(statusKey === 'DRAFT' || statusKey === 'WAITING') && <button type="button" onClick={() => handleStatusChange('CHECK_AVAILABILITY' as any)} className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white">Kiểm tra tồn kho</button>}
                          {statusKey === 'READY' && <button type="button" onClick={() => handleStatusChange('DONE')} className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white">Hoàn thành</button>}
                          {statusKey !== 'DONE' && statusKey !== 'CANCELLED' && <button type="button" onClick={statusKey === 'DRAFT' ? handleDeleteOrder : () => handleStatusChange('CANCELLED')} className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70">{statusKey === 'DRAFT' ? 'Xóa phiếu' : 'Hủy phiếu'}</button>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa phiếu"
        message="Bạn có chắc chắn muốn XÓA phiếu nháp này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={isLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div >
  );
};

export default TransferDetailBox;
