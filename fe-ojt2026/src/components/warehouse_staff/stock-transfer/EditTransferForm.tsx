"use client";
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    X,
    Plus,
    Calendar,
    ArrowRightLeft
} from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { toast } from 'react-hot-toast';

// APIs & Context
import { transferOrdersApi } from "@/lib/api/warehouse/transferOrdersApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { locationsApi } from "@/lib/api/warehouse/locationsApi";
import { productLotsApi } from "@/lib/api/warehouse/productLotsApi";

// Types & Components
import type { Product } from '@/types/warehouse/masterData';
import type { Location } from '@/types/warehouse/locations';
import type { UpdateTransferOrderRequest, AddTransferItemRequest, TransferOrderDetail } from "@/types/warehouse/transferOrders";
import OdooDropdown from '@/components/common/OdooDropdown';
import { useAuth } from '@/hooks/useAuth';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

registerLocale("vi", vi);

interface Props {
    transferId: number;
    onClose: () => void;
    onSave?: () => void;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
            title?: string;
        };
    };
    message?: string;
}

interface TransferItemUI {
    id: number; // For UI key tracking. If from BE, it's the actual Item ID. If new, it's Date.now()
    isFromBackend: boolean;
    actualItemId?: number; // The real ID in DB
    productId: number | null;
    uomId: number | null;
    lotId: number | null;
    requestedQty: number;
}

interface FormData {
    planedDate: string;
    fromLocationId: number | null;
    toLocationId: number | null;
    notes: string;
}



const STATUS_FLOW: { key: string; label: string }[] = [
    { key: 'DRAFT', label: 'Nháp' },
    { key: 'WAITING', label: 'Chờ xử lý' },
    { key: 'READY', label: 'Đã sẵn sàng' },
    { key: 'DONE', label: 'Hoàn thành' },
];

const CANCELLED_STATUS = { key: 'CANCELLED', label: 'Đã hủy' };

const EditTransferForm: React.FC<Props> = ({ transferId, onClose, onSave }) => {
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [initialItems, setInitialItems] = useState<TransferItemUI[]>([]);

    // States cho Master Data
    const [products, setProducts] = useState<Product[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [locationLots, setLocationLots] = useState<unknown[]>([]);
    const [dataLoading, setDataLoading] = useState(true);

    const [items, setItems] = useState<TransferItemUI[]>([]);

    const [formData, setFormData] = useState<FormData>({
        planedDate: new Date().toISOString().split('T')[0],
        fromLocationId: null,
        toLocationId: null,
        notes: ''
    });

    const [originalData, setOriginalData] = useState<TransferOrderDetail | null>(null);

    // Fetch Master Data & Transfer Data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const locationManagerId = (user?.managerId && user.managerId !== "null") ? Number(user.managerId) : (user?.id ? Number(user.id) : undefined);
                setDataLoading(true);
                const [locRes, transferRes] = await Promise.all([
                    locationsApi.getLocations({ isActive: true, pageSize: 100, managerId: locationManagerId }),
                    transferOrdersApi.getTransferById(transferId)
                ]);

                setLocations(locRes.Items || []);
                setOriginalData(transferRes);

                // Map transfer info
                const plannedDt = transferRes.PlannedDate
                    ? String(transferRes.PlannedDate).split('T')[0]
                    : new Date().toISOString().split('T')[0];

                let formattedDate = plannedDt;
                if (plannedDt && plannedDt.includes('/')) {
                    const parts = plannedDt.split('/');
                    if (parts.length === 3) formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }

                setFormData({
                    planedDate: formattedDate,
                    fromLocationId: transferRes.FromLocationId || null,
                    toLocationId: transferRes.ToLocationId || null,
                    notes: transferRes.Note || ''
                });

                // Map Items
                const mappedItems: TransferItemUI[] = (transferRes.Items || []).map(item => ({
                    id: item.Id,
                    isFromBackend: true,
                    actualItemId: item.Id,
                    productId: item.ProductId,
                    uomId: item.UomId,
                    lotId: item.LotId || 0,
                    requestedQty: item.RequestedQty ?? item.Quantity ?? 0
                }));

                setItems(mappedItems.length > 0 ? mappedItems : [{ id: Date.now(), isFromBackend: false, productId: null, uomId: null, lotId: null, requestedQty: 1 }]);
                setInitialItems(mappedItems);

            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
                toast.error("Không thể tải thông tin phiếu điều chuyển");
            } finally {
                setDataLoading(false);
            }
        };
        if (transferId) {
            fetchData();
        }
    }, [transferId, user?.id, user?.managerId]);

    // Fetch sản phẩm theo location (fromLocationId)
    useEffect(() => {
        if (!formData.fromLocationId) {
            setProducts([]);
            return;
        }

        const fetchProductsByLocation = async () => {
            try {
                setDataLoading(true);
                const [prodRes, lotRes] = await Promise.all([
                    productsApi.getProductsByLocation(formData.fromLocationId!),
                    productLotsApi.getLotsByLocationId(formData.fromLocationId!)
                ]);
                setProducts(prodRes || []);
                setLocationLots(lotRes || []);

                // Kiểm tra lại các item hiện tại, nếu sản phẩm không có ở kho mới thì reset
                // Đồng thời auto-select lotId mới cho các sản phẩm hợp lệ
                setItems(prev => prev.map(item => {
                    let currentProductId = item.productId;
                    if (currentProductId && !prodRes.some(p => (p.Id || (p as unknown as { id: number }).id) === currentProductId)) {
                        currentProductId = null;
                    }

                    // Tìm lotId tự động tại kho mới
                    let newLotId = item.lotId;
                    if (currentProductId) {
                        const firstLot = (lotRes as { Id: number; ProductId: number }[]).find(l => l.ProductId === currentProductId);
                        newLotId = firstLot?.Id || null;
                    } else {
                        newLotId = null;
                    }

                    return { ...item, productId: currentProductId, lotId: newLotId };
                }));
            } catch (error) {
                console.error("Lỗi tải sản phẩm theo vị trí:", error);
                toast.error("Không thể tải danh sách sản phẩm cho vị trí này");
            } finally {
                setDataLoading(false);
            }
        };

        fetchProductsByLocation();
    }, [formData.fromLocationId]);

    // Mapping options cho OdooDropdown
    const productOptions = useMemo(() =>
        products.map(p => ({
            id: p.Id,
            displayValue: p.Name,
            secondaryValue: p.Code,
            baseUomId: p.BaseUomId
        })), [products]
    );

    const locationOptions = useMemo(() =>
        locations.map(loc => ({
            id: loc.Id,
            displayValue: loc.Name,
            secondaryValue: loc.Code || loc.Type || ''
        })), [locations]
    );

    // Handlers
    const addLine = () => {
        setItems([...items, { id: Date.now(), isFromBackend: false, productId: null, uomId: null, lotId: 0, requestedQty: 1 }]);
    };

    const removeItem = (id: number) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        } else {
            setItems([{ id: Date.now(), isFromBackend: false, productId: null, uomId: null, lotId: 0, requestedQty: 1 }]);
        }
    };

    const updateItem = useCallback((id: number, field: keyof TransferItemUI, value: number | string | null | boolean) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, [field]: value };
                // If product changed, update default UOM and Lot
                if (field === 'productId') {
                    const prod = products.find(p => p.Id === value);
                    if (prod) {
                        updated.uomId = prod.BaseUomId;
                    }
                    // Auto-select first available lot
                    const firstLot = (locationLots as { Id: number; ProductId: number }[]).find(l => l.ProductId === value);
                    updated.lotId = firstLot?.Id || null;
                }
                return updated;
            }
            return item;
        }));
    }, [products, locationLots]);

    const handleSubmit = async () => {
        if (!formData.fromLocationId || !formData.toLocationId || items.some(i => !i.productId)) {
            toast.error("Vui lòng điền đầy đủ thông tin kho và sản phẩm");
            return;
        }

        if (formData.fromLocationId === formData.toLocationId) {
            toast.error("Kho xuất và kho nhận không được trùng nhau");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Update Header
            const headerRequest: UpdateTransferOrderRequest = {
                PlannedDate: formData.planedDate || undefined,
                FromLocationId: formData.fromLocationId ?? undefined,
                ToLocationId: formData.toLocationId ?? undefined,
                Note: formData.notes
            };
            if (!headerRequest.ToLocationId || !headerRequest.FromLocationId) {
                toast.error("Vui lòng chọn đầy đủ kho xuất và kho nhận");
                setIsSubmitting(false);
                return;
            }
            await transferOrdersApi.updateTransfer(transferId, headerRequest);

            // 2. Diff Items to Add/Update/Delete
            const currentItemIds = items.filter(i => i.isFromBackend).map(i => i.actualItemId);
            const itemsToDelete = initialItems.filter(i => !currentItemIds.includes(i.actualItemId));

            const newItems = items.filter(i => !i.isFromBackend);
            const updatedItems = items.filter(i => i.isFromBackend);

            // Delete removed items
            for (const delItem of itemsToDelete) {
                if (delItem.actualItemId) {
                    await transferOrdersApi.deleteItem(transferId, delItem.actualItemId);
                }
            }

            // Add new items
            for (const newItem of newItems) {
                const addReq: AddTransferItemRequest = {
                    ProductId: newItem.productId as number,
                    LotId: newItem.lotId || 0,
                    UomId: newItem.uomId || 1, // fallback to 1 if null
                    RequestedQty: newItem.requestedQty
                };
                await transferOrdersApi.addItem(transferId, addReq);
            }

            // Update existing items
            for (const updItem of updatedItems) {
                const existing = initialItems.find(i => i.actualItemId === updItem.actualItemId);
                // Only update if changed
                if (existing &&
                    (existing.productId !== updItem.productId ||
                        existing.requestedQty !== updItem.requestedQty ||
                        existing.lotId !== updItem.lotId)) {

                    const updReq: AddTransferItemRequest = {
                        ProductId: updItem.productId as number,
                        LotId: updItem.lotId || 0,
                        UomId: updItem.uomId || 1,
                        RequestedQty: updItem.requestedQty
                    };
                    await transferOrdersApi.updateItem(transferId, updItem.actualItemId as number, updReq);
                }
            }

            toast.success("Cập nhật phiếu điều chuyển thành công!");
            return true;
        } catch (error) {
            const err = error as ApiError;
            console.error("Lỗi khi cập nhật phiếu:", err);
            const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Lỗi khi cập nhật phiếu điều chuyển";
            toast.error(errorMessage);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            // Save changes first if editable
            if (!isReadOnly) {
                await handleSubmit();
            }
            await transferOrdersApi.checkAvailability(transferId);
            toast.success("Xác nhận phiếu thành công!");
            onSave?.();
            onClose();
        } catch (error) {
            const err = error as ApiError;
            console.error("Lỗi khi xác nhận:", err);
            toast.error(err.message || "Lỗi khi xác nhận phiếu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleComplete = async () => {
        setIsSubmitting(true);
        try {
            // Save changes first if editable
            if (!isReadOnly) {
                await handleSubmit();
            }
            await transferOrdersApi.completeTransfer(transferId);
            toast.success("Hoàn thành phiếu điều chuyển!");
            onSave?.();
            onClose();
        } catch (error) {
            const err = error as ApiError;
            console.error("Lỗi khi hoàn thành:", err);
            toast.error(err.message || "Lỗi khi hoàn thành phiếu");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        setIsSubmitting(true);
        try {
            await transferOrdersApi.cancelTransfer(transferId);
            toast.success("Đã hủy phiếu điều chuyển!");
            onSave?.();
            onClose();
        } catch (error) {
            const err = error as ApiError;
            console.error("Lỗi khi hủy phiếu:", err);
            const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Lỗi khi hủy phiếu điều chuyển";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteOrder = () => {
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = async () => {
        setShowDeleteConfirm(false);
        setIsSubmitting(true);
        try {
            await transferOrdersApi.deleteTransfer(transferId);
            toast.success("Đã xóa phiếu điều chuyển thành công!");
            onSave?.();
            onClose();
        } catch (error) {
            const err = error as ApiError;
            console.error("Lỗi khi xóa phiếu:", err);
            const errorMessage = err.response?.data?.message || err.response?.data?.title || err.message || "Lỗi khi xóa phiếu điều chuyển";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentStatus = (originalData?.Status || '').toUpperCase();
    const statusFlow = currentStatus === 'CANCELLED' ? [...STATUS_FLOW, CANCELLED_STATUS] : STATUS_FLOW;
    
    // Giống bên manager: Chỉ cho phép sửa khi ở trạng thái Nháp
    const isEditable = currentStatus === 'DRAFT';
    const isReadOnly = !isEditing;
    const totalQty = items.reduce((sum, it) => sum + (Number(it.requestedQty) || 0), 0);
    // Edit allowed in DRAFT, WAITING, and READY

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 animate-in fade-in duration-300 overflow-y-auto overscroll-contain">
            <div className="bg-white w-full max-w-[1200px] h-[min(86vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] rounded-[2rem] border border-[#E4002B]/30 shadow-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 my-auto">

                {/* Header - Red KFC Style */}
                <div className="relative z-[2] shrink-0 px-5 py-2 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-1.5 shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-xl border border-white/10"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex flex-col items-center text-center min-w-0">
                        <div className="flex items-center justify-center gap-2 mb-0.5">
                            <ArrowRightLeft className="w-5 h-5 text-white/90" />
                            <div>
                                <p className="text-[9px] font-black text-white/80 uppercase tracking-[0.15em] leading-tight">Phiếu điều chuyển</p>
                                <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-1.5 leading-tight">CHI TIẾT PHIẾU ĐIỀU CHUYỂN</h2>
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1 opacity-90">
                            Mã phiếu: {originalData?.TransferNo || "Đang tải..."}
                        </p>
                    </div>

                    {/* Status Stepper */}
                    <div className="text-center">
                        <div className="flex justify-center items-center gap-3">
                            {statusFlow.map((status, index) => {
                                const isCurrent = currentStatus === status.key.toUpperCase() || currentStatus === status.label.toUpperCase();
                                return (
                                    <React.Fragment key={status.key}>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${isCurrent ? 'bg-white text-[#E4002B]' : 'bg-white/20 text-white'}`}>
                                            {status.label}
                                        </div>
                                        {index < statusFlow.length - 1 && <span className="text-white/50 text-[10px]">❯</span>}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5 relative">
                    {dataLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-[#E4002B] rounded-full animate-spin"></div>
                        </div>
                    )}

                    <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,438px)] gap-4 overflow-hidden">
                        <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
                            <div className="shrink-0 flex items-center justify-between gap-4 mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Danh sách sản phẩm</h4>
                                </div>
                                {!isReadOnly && (
                                    <button
                                        type="button"
                                        onClick={addLine}
                                        className="px-5 h-10 bg-[#E4002B] text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E4002B] hover:bg-[#cc0027] active:scale-95 transition-all whitespace-nowrap"
                                    >
                                        + Thêm sản phẩm
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar pr-1">
                                {items.length === 0 ? (
                                    <div className="h-full min-h-[200px] rounded-[2rem] border border-[#E4002B]/25 bg-gradient-to-b from-[#fff7f8] to-white shadow-sm flex items-center justify-center">
                                        <div className="text-center px-6 py-8">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không có mặt hàng nào</p>
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
                                                                items={productOptions}
                                                                value={productOptions.find((p) => p.id === item.productId) || null}
                                                                onChange={(p) => { if (!isReadOnly) updateItem(item.id, 'productId', p?.id || null); }}
                                                                displayField="displayValue"
                                                                secondaryField="secondaryValue"
                                                                placeholder="Chọn Sản Phẩm..."
                                                                className="w-full !h-11 !py-0 !rounded-[1rem] !px-4"
                                                                triggerClassName="!h-11 !rounded-[1rem] !px-4"
                                                                listMaxHeight="max-h-[170px]"
                                                                disabled={isReadOnly}
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
                                                                    disabled={isReadOnly}
                                                                />
                                                                <div className="flex min-w-0 items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                                                                    {unit}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(item.id)}
                                                            disabled={isReadOnly}
                                                            className="h-11 w-[52px] shrink-0 rounded-[1rem] border border-gray-200/90 bg-white text-[9px] font-black uppercase tracking-widest text-gray-700 transition-all hover:border-red-200/80 hover:bg-red-50/40 hover:text-[#E4002B] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
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
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho xuất (Nguồn)</label>
                                            <OdooDropdown
                                                items={locationOptions}
                                                value={locationOptions.find(l => l.id === formData.fromLocationId) || null}
                                                onChange={(val) => { if (!isReadOnly) setFormData(prev => ({ ...prev, fromLocationId: val?.id || null })) }}
                                                displayField="displayValue"
                                                secondaryField="secondaryValue"
                                                placeholder="Chọn Kho Xuất..."
                                                className="w-full"
                                                disabled={isReadOnly}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Kho nhận (Đích)</label>
                                            <OdooDropdown
                                                items={locationOptions}
                                                value={locationOptions.find(l => l.id === formData.toLocationId) || null}
                                                onChange={(val) => { if (!isReadOnly) setFormData(prev => ({ ...prev, toLocationId: val?.id || null })) }}
                                                displayField="displayValue"
                                                secondaryField="secondaryValue"
                                                placeholder="Chọn Kho Nhận..."
                                                className="w-full"
                                                disabled={isReadOnly}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ngày tạo phiếu</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        disabled
                                                        value={originalData?.CreatedAt ? new Date(originalData.CreatedAt.endsWith('Z') ? originalData.CreatedAt : originalData.CreatedAt + 'Z').toLocaleDateString('vi-VN') : '--'}
                                                        className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-10 bg-gray-100/60 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 outline-none cursor-not-allowed kfc-form-field-shadow"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ngày dự kiến</label>
                                                <div className="relative kfc-receipt-datepicker-container">
                                                    <DatePicker
                                                        selected={formData.planedDate ? new Date(formData.planedDate + "T00:00:00") : null}
                                                        onChange={(date: Date | null) => {
                                                            if (date && !isReadOnly) {
                                                                const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
                                                                setFormData(prev => ({ ...prev, planedDate: `${y}-${m}-${d}` }));
                                                            }
                                                        }}
                                                        dateFormat="dd/MM/yyyy"
                                                        locale="vi"
                                                        className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-10 bg-gray-50/50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-800 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/20 kfc-form-field-shadow hover:bg-white hover:border-red-100/30 disabled:bg-gray-100/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                                                        disabled={isReadOnly}
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Ghi chú phiếu điều chuyển</label>
                                            <input
                                                type="text"
                                                className="w-full h-10 rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3.5 text-[10px] leading-none font-bold text-gray-800 outline-none focus:border-red-100/50 focus:bg-white focus:ring-2 focus:ring-red-50/30 transition-all placeholder:text-gray-400"
                                                placeholder="Nhập ghi chú nội bộ..."
                                                value={formData.notes || ''}
                                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                                disabled={isReadOnly}
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
                                            Ngày tạo {originalData?.CreatedAt ? new Date(originalData.CreatedAt.endsWith('Z') ? originalData.CreatedAt : originalData.CreatedAt + 'Z').toLocaleDateString('vi-VN') : '--'}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-1 text-[9px] font-bold leading-tight shrink-0">
                                        <div className="flex gap-2 items-baseline min-w-0 justify-between">
                                            <span className="text-white/80 uppercase">Số sản phẩm</span>
                                            <span className="text-white tabular-nums">{items.length}</span>
                                        </div>
                                        <div className="flex gap-2 items-baseline min-w-0 justify-between">
                                            <span className="text-white/80 uppercase">Tổng số lượng điều chuyển</span>
                                            <span className="text-white tabular-nums">{totalQty}</span>
                                        </div>
                                        <div className="flex gap-2 items-baseline min-w-0 justify-between">
                                            <span className="text-white/80 uppercase">Trạng thái</span>
                                            <span className="text-white">{statusFlow.find((s) => s.key === currentStatus)?.label || originalData?.Status || 'Nháp'}</span>
                                        </div>
                                    </div>

                                    <div className="shrink-0 pt-1.5 border-t border-white/15 flex items-center gap-1.5">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    disabled={isSubmitting || dataLoading}
                                                    className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const success = await handleSubmit();
                                                        if (success) {
                                                            setIsEditing(false);
                                                            onSave?.();
                                                        }
                                                    }}
                                                    disabled={isSubmitting || dataLoading}
                                                    className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                                                >
                                                    {isSubmitting ? "Đang lưu..." : "Lưu"}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {isEditable && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditing(true)}
                                                        disabled={isSubmitting || dataLoading}
                                                        className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                                                    >
                                                        Chỉnh sửa
                                                    </button>
                                                )}
                                            </>
                                        )}

                                        {currentStatus === 'DRAFT' && (
                                            <button
                                                type="button"
                                                onClick={handleConfirm}
                                                disabled={isSubmitting || dataLoading}
                                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Đang xử lý..." : "Xác nhận đơn"}
                                            </button>
                                        )}

                                        {currentStatus === 'WAITING' && (
                                            <button
                                                type="button"
                                                onClick={handleConfirm}
                                                disabled={isSubmitting || dataLoading}
                                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Đang xử lý..." : "Kiểm tra tồn kho"}
                                            </button>
                                        )}

                                        {currentStatus === 'READY' && (
                                            <button
                                                type="button"
                                                onClick={handleComplete}
                                                disabled={isSubmitting || dataLoading}
                                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Đang xử lý..." : "Hoàn thành đơn"}
                                            </button>
                                        )}

                                        {(currentStatus === 'WAITING' || currentStatus === 'READY') && (
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                disabled={isSubmitting || dataLoading}
                                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Đang xử lý..." : "Hủy phiếu"}
                                            </button>
                                        )}

                                        {currentStatus === 'DRAFT' && (
                                            <button
                                                type="button"
                                                onClick={handleDeleteOrder}
                                                disabled={isSubmitting || dataLoading}
                                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                                            >
                                                {isSubmitting ? "Đang xử lý..." : "Xóa phiếu"}
                                            </button>
                                        )}
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
                isLoading={isSubmitting}
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        </div>
    );
};

export default EditTransferForm;
