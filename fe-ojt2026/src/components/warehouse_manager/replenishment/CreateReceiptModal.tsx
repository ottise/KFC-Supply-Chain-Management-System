"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from 'lucide-react';
import { purchaseOrderApi } from "@/lib/api/warehouse/purchaseOrderApi";
import { stockDocumentsApi } from "@/lib/api/warehouse/stockDocumentsApi";
import ReceiptHeader from "./ReceiptHeader";
import ReceiptItemsTable from "./ReceiptItemsTable";
import LotDetailModal from "./LotDetailModal";
import ReceiptDetailModal from "./ReceiptDetailModal";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function CreateReceiptModal({ isOpen, receiptData, onClose, onSave }: any) {
  const toast = useToast();
  const notifyFormError = (detail: string) => toast.error("Thông tin chưa hợp lệ", detail);
  const notifySuccess = (detail: string) => toast.success("Thao tác thành công", detail);
  // Helper lấy ngày hôm nay định dạng YYYY-MM-DD
  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const [status, setStatus] = useState("Dự thảo");
  const [vendor, setVendor] = useState("");
  const [vendorId, setVendorId] = useState(0);
  const [sourceDoc, setSourceDoc] = useState("");

  // KHỞI TẠO THẲNG GIÁ TRỊ MẶC ĐỊNH - KHÔNG ĐỂ RỖNG
  const [creationDate, setCreationDate] = useState(getTodayStr());
  const [scheduledDate, setScheduledDate] = useState(getTodayStr());

  const [toLocation, setToLocation] = useState("");
  const [toLocationId, setToLocationId] = useState(0);
  const [toWarehouseId, setToWarehouseId] = useState(0);
  const [items, setItems] = useState<any[]>([]);

  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [poId, setPoId] = useState(0); // PurchaseOrderId
  const [docId, setDocId] = useState(0); // StockDocumentId
  const [activeLotItem, setActiveLotItem] = useState<any>(null);
  const [managerId, setManagerId] = useState<string>("");
  const [showReceivedDetail, setShowReceivedDetail] = useState(false);
  const [receptionHistory, setReceptionHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);


  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const userInfo = require("@/lib/utils/authUtils").getStoredUserInfo();

        let effectiveId = "";
        if (userInfo && userInfo.role) {
          const role = String(userInfo.role).toLowerCase();
          if (role !== 'admin') {
            if (role.includes('staff')) {
              const rawManagerId = (userInfo as any).managerId || (userInfo as any).ManagerId;
              if (rawManagerId && rawManagerId !== "null") {
                effectiveId = rawManagerId;
              }
            } else if (role.includes('manager')) {
              const rawId = userInfo.id || (userInfo as any).userId || (userInfo as any).uid || (userInfo as any).sub;
              if (rawId && rawId !== "null") {
                effectiveId = rawId;
              }
            }
          }
        }

        setManagerId(effectiveId);
      }
    } catch (error) {
      console.error("Lỗi khi set managerId:", error);
    }
  }, []);

  const isInitialized = useRef(false);

  const masterIngredients = [
    { name: "Thịt Gà Tươi - Cánh", unit: "Kg" },
    { name: "Thịt Gà Tươi - Đùi", unit: "Kg" },
    { name: "Dầu Chiên Oliu", unit: "Lít" }
  ];

  // Khởi tạo Modal khi mở
  useEffect(() => {
    if (!isOpen) {
      isInitialized.current = false;
      return;
    }

    // Nếu đã khởi tạo rồi thì không nạp lại dữ liệu tránh mất state user đang nhập
    if (isInitialized.current) return;

    if (receiptData) {
      console.log(">>> [MODAL] Nạp dữ liệu cũ:", receiptData);
      setStatus(receiptData.status || "Dự thảo");
      const s = String(receiptData.status || "").toLowerCase();
      const isDraftLike = s.includes("nháp") || s.includes("dự thảo") || s.includes("draft");
      setIsEditMode(!isDraftLike);

      setVendor(receiptData.vendor || "");
      setVendorId(Number(receiptData.vendorId) || 0);
      setSourceDoc(receiptData.source || "");

      // Ưu tiên lấy ngày từ receiptData, nếu không có mới lấy hôm nay
      const dCreate = receiptData.creationDate || getTodayStr();
      const dSched = receiptData.scheduledDate || getTodayStr();
      setCreationDate(dCreate);
      setScheduledDate(dSched);

      const locFromPath =
        receiptData.locationPath || receiptData.warehouse
          ? [receiptData.warehouse, receiptData.locationPath].filter(Boolean).join(" | ")
          : "";
      setToLocation(
        String(receiptData.toLocation || "").trim() || locFromPath || "",
      );
      setToLocationId(Number(receiptData.toLocationId) || 0);
      setToWarehouseId(Number(receiptData.warehouseId || receiptData.WarehouseId || receiptData.toWarehouseId || receiptData.ToWarehouseId) || 0);

      const mappedItems = (receiptData.items || []).map((it: any) => {
        const ordered = Number(it.quantity) || 0;
        const received = Number(it.receivedQty || it.actual_qty || 0);
        const remaining = Math.max(0, ordered - received);
        const s = String(receiptData.status || "").toLowerCase();
        const isReceiving = s.includes("ready") || s.includes("confirmed") || s.includes("partial") || s.includes("sẵn");

        return {
          ...it,
          quantity: ordered,
          receivedQty: received,
          actual_qty: isReceiving ? 0 : 0
        };
      });
      setItems(mappedItems);
      setPoId(Number(receiptData.id) || 0);
      setDocId(Number(receiptData.docId) || 0);
    } else {
      console.log(">>> [MODAL] Khởi tạo phiếu mới");
      setStatus("Dự thảo");
      setIsEditMode(true);
      setVendor("");
      setVendorId(0);
      setSourceDoc("");
      setCreationDate(getTodayStr());
      setScheduledDate(getTodayStr());
      setToLocation("");
      setToLocationId(0);
      setToWarehouseId(0);
      setItems([]);
      setPoId(0);
      setDocId(0);
    }

    isInitialized.current = true;
  }, [isOpen, receiptData]);

  const handleLocationUpdate = (locId: number, name: string, whId: number) => {
    // Nếu location không đổi thì không làm gì
    if (locId === toLocationId) return;

    setToLocationId(locId);
    setToLocation(name);
    setToWarehouseId(whId);

    // Reset danh sách sản phẩm khi đổi kho (chỉ thực hiện ở chế độ đang soạn thảo)
    const s = String(status || "").toLowerCase();
    const isDraft = s.includes("draft") || s === "nháp" || s === "dự thảo" || s === "";

    if (isDraft && items.length > 0) {
      setItems([{ id: -Date.now(), product: "", quantity: 1, unit: "Kg", lots: [] }]);
    }
  };

  const updateItemRow = (id: number, field: string, value: any) => {

    const s = String(status || "").toLowerCase();
    const isReceivingMode = s.includes("ready") || s.includes("confirmed") || s.includes("partial") || s.includes("sẵn");

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          if (field === 'product') {
            const price = Number(value.price || value.stockPrice) || 0;
            const qty = Number(item.quantity) || 0;
            return {
              ...item,
              product: value.name || value,
              unit: value.unit || "Kg",
              uomId: Number(value.uomId) || 0,
              productId: Number(value.id) || 0,
              unitPrice: price,
              subtotal: qty * price
            };
          }
          if (field === 'quantity' || field === 'actual_qty') {
            const numVal = value === "" ? 0 : Math.floor(Number(value));
            const finalVal = numVal > 0 ? numVal : 0;
            const updatedItem = { ...item, [field]: finalVal, subtotal: finalVal * (item.unitPrice || 0) };

            // Tự động đồng bộ số lượng vào Lô nếu có
            if (updatedItem.lots && updatedItem.lots.length > 0) {
              updatedItem.lots = [{
                ...updatedItem.lots[0],
                quantity: finalVal
              }];
              // Xóa báo đỏ nếu có
            }
            return updatedItem;
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };


  const handleSaveLots = (updatedLots: any[]) => {
    if (activeLotItem) {
      updateItemRow(activeLotItem.id, 'lots', updatedLots);
      const totalQty = updatedLots.reduce((sum, lot) => sum + (Number(lot.quantity) || 0), 0);
      const s = String(status).toLowerCase();
      const isReadyMode = s.includes("ready") || s.includes("confirmed") || s.includes("sẵn sàng") || s.includes("sẵn");
      if (isReadyMode) updateItemRow(activeLotItem.id, 'actual_qty', totalQty);
      else updateItemRow(activeLotItem.id, 'quantity', totalQty);
      setActiveLotItem(null);
    }
  };

  // CHUẨN HÓA ĐỊNH DẠNG ISO GIỐNG BODY MẪU
  const toSafeISO = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === "") return new Date().toISOString();
    // Nếu dateStr là YYYY-MM-DD, chuyển thành ISO chuẩn
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date().toISOString();
      // Set cứng 12:00 trưa để tránh lệch múi giờ nếu backend xử lý non-UTC
      d.setHours(12, 0, 0, 0);
      return d.toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const prepareItemsForApi = (currentItems: any[], isDraft: boolean = true) => {
    const consolidatedMap = new Map<string, any>();

    currentItems
      .filter(it => it.productId && Number(it.productId) > 0)
      .forEach((item: any) => {
        const lot = item.lots?.[0] || {};
        const pId = Number(item.productId);
        const lId = Number(lot.lotId) || Number(item.lotId) || Number(item.LotId) || 0;
        const lName = lot.lotName || item.lotName || item.LotName || "";

        // Key dùng để gộp: Nếu có lotId thì dùng pId_lId, nếu là lô mới thì dùng pId_lName
        const key = lId > 0 ? `${pId}_${lId}` : `${pId}_name_${lName}`;

        if (consolidatedMap.has(key)) {
          const existing = consolidatedMap.get(key);
          existing.quantity += Number(item.quantity) || 0;
          if (!isDraft) {
            existing.realQuantity += Number(item.actual_qty ?? item.receivedQty ?? 0);
          }
          // Chọn ngày hết hạn xa nhất (an toàn nhất)
          const currentExp = lot.expiryDate || lot.expirationDate;
          if (currentExp && existing._rawExp && new Date(currentExp) > new Date(existing._rawExp)) {
            existing._rawExp = currentExp;
            existing.expirationDate = toSafeISO(currentExp);
          }
        } else {
          const finalId = (typeof item.id === 'number' && item.id > 0 && item.id < 1000000) ? item.id : 0;
          const apiItem: any = {
            id: finalId,
            productId: pId,
            lotId: lId,
            uomId: Number(item.uomId) || 0,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0
          };

          apiItem.lotName = lName;
          apiItem._rawExp = lot.expiryDate || lot.expirationDate || scheduledDate;
          apiItem.expirationDate = toSafeISO(apiItem._rawExp);

          if (!isDraft) {
            apiItem.realQuantity = Number(item.actual_qty ?? item.receivedQty ?? 0);
          }

          consolidatedMap.set(key, apiItem);
        }
      });

    return Array.from(consolidatedMap.values()).map(item => {
      item.subtotal = item.quantity * item.unitPrice;
      delete item._rawExp;
      return item;
    });
  };

  const handleSaveDraft = async () => {
    if ((!vendorId || !vendor?.trim()) && (!toLocationId || !toLocation?.trim())) {
      notifyFormError("Vui lòng chọn đầy đủ nhà cung cấp và vị trí nhập hàng.");
      return;
    }
    if (!vendorId || !vendor?.trim()) {
      notifyFormError("Vui lòng chọn nhà cung cấp.");
      return;
    }
    if (!toLocationId || !toLocation?.trim()) {
      notifyFormError("Vui lòng chọn vị trí nhập hàng.");
      return;
    }
    const apiItems = prepareItemsForApi(items, true);
    if (apiItems.length === 0) {
      notifyFormError("Vui lòng thêm ít nhất một sản phẩm.");
      return;
    }

    if (apiItems.some(it => it.quantity <= 0)) {
      notifyFormError("Số lượng sản phẩm phải là giá trị lớn hơn 0.");
      return;
    }

    const missingLot = items.find(it => {
      const productId = Number(it.productId) || 0;
      if (productId <= 0) return false;
      const totalInLots = it.lots?.reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0) || 0;
      const currentQty = Number(it.quantity) || 0;
      return totalInLots !== currentQty || !it.lots?.[0]?.lotName;
    });
    if (missingLot) {
      notifyFormError("Vui lòng khai báo đầy đủ thông tin số lô.");
      return;
    }

    setIsSavingDraft(true);

    try {
      const nowISO = new Date().toISOString();
      const body = {
        docId: docId,
        supplierId: vendorId,
        toLocationId: toLocationId,
        managerId: managerId || undefined,
        plannedDate: toSafeISO(scheduledDate),
        createdAt: nowISO,
        origin: sourceDoc,
        items: apiItems
      };

      console.log(">>> [API SAVE DRAFT] Body gửi đi (với CreatedAt mới nhất):", body);
      const res = await purchaseOrderApi.createDraft(body);
      const serverDocId = res.DocId || res.docId || docId;
      const serverPoId = res.Id || res.id || poId;

      setDocId(serverDocId);
      setPoId(serverPoId);

      // Cập nhật lại state cục bộ để hiển thị đúng thời gian vừa lưu
      const savedDateStr = nowISO.split('T')[0];
      setCreationDate(savedDateStr);

      onSave({
        ...receiptData,
        id: serverPoId,
        docId: serverDocId,
        vendor, vendorId,
        source: sourceDoc, // Đảm bảo field name là source để khớp Dashboard
        origin: sourceDoc,
        creationDate: savedDateStr,
        scheduledDate,
        toLocation, toLocationId,
        status: status || "Dự thảo",
        items: items
      });
      notifySuccess("Đã lưu nháp phiếu nhập.");
      notifySuccess("Đã lưu nháp phiếu nhập.");
    } catch (err: any) {
      console.error("Lỗi lưu nháp:", err);
      const msg = err.response?.data?.message || err.response?.data || "Lỗi lưu nháp";
      notifyFormError(`Không thể lưu nháp. ${typeof msg === "string" ? msg : "Vui lòng liên hệ quản trị viên."}`);
    } finally { setIsSavingDraft(false); }
  };

  const handleConfirmOrder = async () => {
    if ((!vendorId || !vendor?.trim()) && (!toLocationId || !toLocation?.trim())) { notifyFormError("Vui lòng chọn đầy đủ nhà cung cấp và vị trí nhập hàng."); return; }
    if (!vendorId || !vendor?.trim()) { notifyFormError("Vui lòng chọn nhà cung cấp."); return; }
    if (!toLocationId || !toLocation?.trim()) { notifyFormError("Vui lòng chọn vị trí nhập hàng."); return; }
    const apiItems = prepareItemsForApi(items, false);
    if (apiItems.length === 0) { notifyFormError("Vui lòng thêm ít nhất một sản phẩm."); return; }

    if (apiItems.some(it => it.quantity <= 0)) {
      notifyFormError("Số lượng sản phẩm phải là giá trị lớn hơn 0.");
      return;
    }

    const missingLot = items.find(it => {
      const productId = Number(it.productId) || 0;
      if (productId <= 0) return false;
      const totalInLots = it.lots?.reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0) || 0;
      const currentQty = Number(it.quantity) || 0;
      return totalInLots !== currentQty || !it.lots?.[0]?.lotName;
    });
    if (missingLot) {
      notifyFormError("Vui lòng khai báo đầy đủ thông tin số lô.");
      return;
    }

    setIsConfirming(true);
    try {
      const body = {
        supplierId: vendorId,
        plannedDate: toSafeISO(scheduledDate),
        docId: docId,
        toLocationId: toLocationId,
        managerId: managerId || undefined,
        origin: sourceDoc,
        items: apiItems
      };

      console.log(">>> [API CONFIRM] Gửi kèm origin:", body);
      const res = await purchaseOrderApi.confirmPurchaseOrder(body);
      const serverPoId = res.Id || res.id || poId;
      const serverDocId = res.DocId || res.docId || docId;
      onSave({ ...receiptData, id: serverPoId, docId: serverDocId, status: "Confirmed", items, source: sourceDoc });
      notifySuccess("Đã xác nhận phiếu nhập.");
      onClose();
    } catch (err: any) {
      notifyFormError("Không thể xác nhận phiếu. Vui lòng kiểm tra lại số lượng và dữ liệu sản phẩm.");
    } finally { setIsConfirming(false); }
  };

  const handleCompleteOrder = async () => {
    const invalidItem = items.find((it: any) => (Number(it.actual_qty) || 0) > (Number(it.quantity) - Number(it.receivedQty || 0)));
    if (invalidItem) { notifyFormError("Số lượng thực nhận không được vượt quá số lượng còn lại."); return; }

    const apiItems = prepareItemsForApi(items, false);
    setIsConfirming(true);
    try {
      const body = {
        supplierId: vendorId,
        plannedDate: toSafeISO(scheduledDate),
        docId: docId,
        toLocationId: toLocationId,
        managerId: managerId || undefined,
        origin: sourceDoc || "---",
        isSplit: true,
        items: apiItems
      };
      const res = await purchaseOrderApi.completePurchaseOrder(body);
      const serverPoId = res.Id || res.id || poId;
      const serverDocId = res.DocId || res.docId || docId;
      onSave({ ...receiptData, id: serverPoId, docId: serverDocId, status: "Completed", items });
      notifySuccess("Đã hoàn thành phiếu nhập.");
      onClose();
    } catch (err: any) {
      notifyFormError("Không thể hoàn thành phiếu nhập. Vui lòng thử lại.");
    } finally { setIsConfirming(false); }
  };

  const fetchReceptionHistory = async () => {
    if (!docId) return;
    setIsLoadingHistory(true);
    try {
      const transactions = await stockDocumentsApi.getStockTransactionsByDocumentId(docId);
      console.log(">>> [HISTORY] Raw Transactions:", transactions);

      const completed = transactions.filter((t: any) => {
        const s = String(t.status || t.Status || "").toLowerCase();
        const qty = Number(t.actualQty || t.ActualQty || t.actual_qty || 0);
        return (s.includes("complete") || s.includes("hoàn thành") || s === "1" || s === "completed") && qty > 0;
      });

      const groups: { [key: string]: any[] } = {};
      completed.forEach((t: any) => {
        const rawDate = t.completedAt || t.CompletedAt || t.completed_at;
        if (!rawDate) return;
        const date = new Date(rawDate);
        if (isNaN(date.getTime())) return;

        // Group by minute (YYYY-MM-DDTHH:mm) to merge items received in the same session
        const key = date.toISOString().substring(0, 16);
        if (!groups[key]) groups[key] = [];
        groups[key].push(t);
      });

      const history = Object.entries(groups).map(([timeKey, items], index) => {
        const firstItem = items[0];
        const rawDate = firstItem.completedAt || firstItem.CompletedAt || firstItem.completed_at;
        return {
          id: index + 1,
          receivedAt: rawDate,
          items: items.map(it => ({
            product: it.productName || it.ProductName || it.product_name,
            quantity: Number(it.actualQty || it.ActualQty || it.actual_qty || 0),
            unit: it.uomName || it.UomName || it.uom_name || "Kg",
            lotName: it.lotName || it.LotName || it.lot_name
          }))
        };
      });

      history.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      setReceptionHistory(history);
      setShowReceivedDetail(true);
    } catch (err) {
      console.error("Lỗi tải lịch sử:", err);
      notifyFormError("Không thể tải lịch sử nhận hàng. Vui lòng thử lại sau.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAction = () => {
    const s = String(status || "").toLowerCase();
    if (s.includes("nháp") || s.includes("dự thảo") || s.includes("draft")) handleConfirmOrder();
    else handleCompleteOrder();
  };

  const handleAddProductLine = () => {
    setItems((prev: any[]) => [...prev, { id: -Date.now(), product: "", quantity: 1, unit: "Kg", lots: [] }]);
  };

  const handleRemoveItem = async (id: number) => {
    // Nếu là ID thật từ DB (không phải ID tạm thời từ Date.now())
    if (id > 0 && id < 1000000000) {
      try {
        await purchaseOrderApi.deletePurchaseOrderItem(id);
      } catch (err: any) {
        console.error("Lỗi khi xóa dòng sản phẩm:", err);
        const msg = err.response?.data?.message || err.response?.data || "Lỗi khi xóa dòng sản phẩm";
        notifyFormError(`Không thể xóa dòng sản phẩm. ${typeof msg === "string" ? msg : "Vui lòng liên hệ quản trị viên."}`);
        return;
      }
    }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleCancelOrder = async () => {
    if (!poId) return;
    setIsCancelling(true);
    try {
      await purchaseOrderApi.cancelPurchaseOrder(poId);
      notifySuccess("Đã hủy phiếu nhập kho thành công.");
      onSave({ ...receiptData, status: "Cancelled" });
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi hủy phiếu:", err);
      const msg = err.response?.data?.message || err.response?.data || "Lỗi khi hủy phiếu";
      notifyFormError(`Không thể hủy phiếu. ${typeof msg === "string" ? msg : "Vui lòng liên hệ quản trị viên."}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!poId) return;
    setIsCancelling(true);
    try {
      await purchaseOrderApi.deletePurchaseOrder(poId);
      notifySuccess("Đã xóa phiếu nháp thành công.");
      onSave({ ...receiptData, id: null }); // Signal deletion to list
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi xóa phiếu:", err);
      const msg = err.response?.data?.message || err.response?.data || "Lỗi khi xóa phiếu";
      notifyFormError(`Không thể xóa phiếu. ${typeof msg === "string" ? msg : "Vui lòng liên hệ quản trị viên."}`);
    } finally {
      setIsCancelling(false);
      setShowDeleteConfirm(false);
    }
  };


  const totalItemLines = items.length;
  const statusLower = String(status || "").toLowerCase();
  const isDraftStatus = statusLower.includes("draft") || status === "Dự thảo" || status === "Nháp";
  const isCompletedStatus = statusLower.includes("completed") || status === "Đã hoàn thành" || statusLower.includes("hoàn tất") || status === "Hoàn tất";
  const isPartiallyReceived = statusLower.includes("partial") || statusLower.includes("một phần");
  const isNotCancellable = isCompletedStatus || isPartiallyReceived;


  const resolveQtyForSummary = (it: any) => {
    if (isCompletedStatus) return Number(it.receivedQty ?? it.actual_qty ?? it.quantity ?? 0) || 0;
    if (isDraftStatus) return Number(it.quantity ?? it.receivedQty ?? it.actual_qty ?? 0) || 0;
    return Number(it.actual_qty ?? it.receivedQty ?? it.quantity ?? 0) || 0;
  };

  const totalAmount = items.reduce((sum: number, it: any) => {
    const qty = resolveQtyForSummary(it);
    const unitPrice = Number(it.unitPrice || 0) || 0;
    return sum + (qty * unitPrice);
  }, 0);
  const totalPlannedQty = items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
  const receiptSummaryStatusLabel = (() => {
    if (isCompletedStatus) return "Hoàn thành";
    if (statusLower.includes("cancelled") || statusLower.includes("đã hủy")) return "Đã hủy";
    if (statusLower.includes("partial") || String(status || "").toLowerCase().includes("một phần")) return "Nhận một phần";
    if (statusLower.includes("ready") || statusLower.includes("confirmed") || statusLower.includes("sẵn")) return "Sẵn sàng";
    if (isDraftStatus) return "Nháp";
    return String(status || "—");
  })();

  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300" aria-hidden="true" />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-2 sm:p-3 animate-in zoom-in-95 duration-200 pointer-events-none overflow-y-auto overscroll-contain">
        <div className="bg-white rounded-[2rem] border border-[#E4002B]/30 shadow-sm w-[1200px] max-w-[96vw] h-[min(86vh,calc(100vh-1rem))] max-h-[calc(100vh-1rem)] min-h-0 flex flex-col pointer-events-auto overflow-hidden animate-in fade-in duration-300 my-auto">
          {/* Header — đồng bộ Report / MoveDetailView */}
          <div className="relative z-[2] shrink-0 px-5 py-2 border-b border-[#b30022] bg-[#E4002B] text-white flex flex-col gap-1.5 shadow-[0_8px_28px_-6px_rgba(120,0,20,0.45)]">
            <div className="flex flex-col items-center text-center">
              <p className="text-[10px] font-black text-white/80 uppercase tracking-[0.2em]">
                {poId === 0 ? "Phiếu nhập kho" : "Chi tiết phiếu nhập"}
              </p>
              <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tight mt-0.5">
                {poId === 0 ? "Tạo phiếu nhập kho" : "Chi tiết phiếu nhập kho"}
              </h2>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">
                {poId === 0 ? "Tạo mới từ nhà cung cấp" : `Mã phiếu: ${receiptData?.code || "—"}`}
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
              {statusLower.includes("cancelled") || statusLower.includes("đã hủy") ? (
                <span className="text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 rounded-lg border bg-white/95 text-red-600 border-white shadow-lg shadow-red-900/20">
                  Phiếu đã hủy
                </span>
              ) : (
                <>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isDraftStatus ? "bg-white text-[#E4002B] border-white shadow-md" : "bg-white/10 text-white/80 border-white/30"}`}>
                    Nháp
                  </span>
                  <span className="text-white/50 text-xs font-light">›</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${(!isDraftStatus && !isCompletedStatus) ? "bg-white text-[#E4002B] border-white shadow-md" : "bg-white/10 text-white/80 border-white/30"}`}>
                    Sẵn sàng
                  </span>
                  <span className="text-white/50 text-xs font-light">›</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg border transition-all ${isCompletedStatus ? "bg-white text-[#E4002B] border-white shadow-md" : "bg-white/10 text-white/80 border-white/30"}`}>
                    Hoàn thành
                  </span>
                </>
              )}
            </div>

          </div>

          <div className="flex-1 min-h-0 px-4 py-2 sm:px-5 overflow-hidden bg-white flex flex-col gap-1.5">

            <div className="flex-1 min-h-0 grid min-w-0 grid-cols-1 min-[1000px]:grid-cols-[minmax(0,1fr)_minmax(0,438px)] gap-4 overflow-hidden">
              {/* LEFT: Sản phẩm (rộng hơn) */}
              <div className="min-h-0 min-w-0 rounded-[1.5rem] border border-gray-100 bg-white p-3 overflow-hidden flex flex-col shadow-md shadow-gray-200/40">
                <div className="shrink-0 flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-7 bg-[#E4002B] rounded-full" />
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Danh sách sản phẩm</h4>
                  </div>

                  {isEditMode && (String(status).toLowerCase().includes("draft") || status === "Dự thảo" || status === "Nháp") && (
                    <button
                      type="button"
                      onClick={handleAddProductLine}
                      className="px-4 h-9 bg-[#E4002B] text-white text-[9px] font-black uppercase tracking-[0.08em] rounded-full border border-[#E4002B] hover:bg-[#cc0027] active:scale-95 transition-all whitespace-nowrap"
                    >
                      + THÊM SẢN PHẨM
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-0">
                  <ReceiptItemsTable
                    items={items}
                    warehouseId={toWarehouseId}
                    status={isEditMode ? status : 'Completed'}
                    masterIngredients={masterIngredients}
                    onUpdateItem={updateItemRow}
                    onAddItem={handleAddProductLine}
                    onRemoveItem={handleRemoveItem}
                    onOpenLotModal={(item: any) => {
                      if (!isEditMode) return;
                      setActiveLotItem(item);
                    }}
                    showAddButton={false}
                  />
                </div>
              </div>

              {/* RIGHT: đồng bộ layout phiếu xuất — form cuộn + card đỏ cố định thấp */}
              <div className="flex h-full min-h-0 min-w-0 flex-col gap-2">
                <div className="flex-1 min-h-0 min-w-0 overflow-hidden px-0.5 pr-2.5 pb-1.5 pt-0.5">
                  <ReceiptHeader
                    vendor={vendor}
                    setVendor={isEditMode ? setVendor : (() => { })}
                    setVendorId={isEditMode ? setVendorId : (() => { })}
                    sourceDoc={sourceDoc}
                    setSourceDoc={isEditMode ? setSourceDoc : (() => { })}
                    creationDate={creationDate}
                    setCreationDate={isEditMode ? setCreationDate : (() => { })}
                    scheduledDate={scheduledDate}
                    setScheduledDate={isEditMode ? setScheduledDate : (() => { })}
                    toLocation={toLocation}
                    setToLocation={isEditMode ? setToLocation : (() => { })}
                    setToLocationId={isEditMode ? setToLocationId : (() => { })}
                    setToWarehouseId={isEditMode ? setToWarehouseId : (() => { })}
                    onLocationChange={isEditMode ? handleLocationUpdate : undefined}
                    toLocationId={toLocationId}
                    status={isEditMode ? status : 'Completed'}
                    completionDate={receiptData?.updatedAt}
                  />
                </div>

                <div className="shrink-0 w-full px-0.5 pr-2.5 pb-1.5 box-border">
                  <div className="w-full rounded-[1.25rem] bg-gradient-to-b from-[#ff2b4f] to-[#d10025] text-white px-3 py-2.5 flex flex-col gap-2 kfc-summary-red-card box-border min-w-0">
                    <div className="shrink-0 border-b border-white/20 pb-1.5 flex items-start justify-between gap-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">TÓM TẮT</p>
                      <p className="text-[10px] font-black text-white tabular-nums whitespace-nowrap uppercase tracking-[0.08em]">
                        Ngày tạo {(() => {
                          if (!creationDate) return "—";
                          const dt = creationDate.includes("-")
                            ? new Date(`${creationDate}T12:00:00`)
                            : new Date(creationDate);
                          if (Number.isNaN(dt.getTime())) return "—";
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
                          <span className="text-white tabular-nums">{totalPlannedQty}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-baseline min-w-0">
                        <span className="shrink-0 w-3 text-center text-white font-black leading-none pt-px select-none" aria-hidden>
                          •
                        </span>
                        <div className="flex flex-1 min-w-0 justify-between gap-2">
                          <span className="text-white/80 uppercase">Trạng thái</span>
                          <span className="text-white text-right truncate max-w-[55%]" title={receiptSummaryStatusLabel}>
                            {receiptSummaryStatusLabel}
                          </span>
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
                            title={`${new Intl.NumberFormat("vi-VN").format(totalAmount)} VND`}
                          >
                            {new Intl.NumberFormat("vi-VN").format(totalAmount)} VND
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1.5 border-t border-white/15">
                      {!isCompletedStatus ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {poId !== 0 &&
                            items.some((it: any) => (Number(it.receivedQty) || 0) > 0) && (
                              <button
                                type="button"
                                onClick={fetchReceptionHistory}
                                disabled={isLoadingHistory}
                                className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                              >
                                {isLoadingHistory ? "Đang tải..." : "Chi tiết đã nhận"}
                              </button>
                            )}

                          {isDraftStatus && !isEditMode && (
                            <button
                              type="button"
                              onClick={() => setIsEditMode(true)}
                              className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white"
                            >
                              Chỉnh sửa
                            </button>
                          )}

                          {isDraftStatus && isEditMode && (
                            <button
                              type="button"
                              onClick={handleSaveDraft}
                              disabled={isSavingDraft || isConfirming}
                              className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                            >
                              {isSavingDraft ? "Đang lưu..." : "Lưu Đơn Nháp"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleAction}
                            disabled={isConfirming}
                            className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white rounded-full border border-white disabled:opacity-50"
                          >
                            {isConfirming ? "Đang xử lý..." : (isDraftStatus ? "Xác Nhận Nhập Kho" : "Hoàn thành")}
                          </button>

                          {poId !== 0 && !isNotCancellable && (

                            <button
                              type="button"
                              onClick={isDraftStatus ? () => setShowDeleteConfirm(true) : handleCancelOrder}
                              disabled={isCancelling}
                              className="flex-1 basis-0 min-w-0 h-8 text-[9px] font-bold uppercase tracking-[0.05em] text-white bg-transparent rounded-full border border-white/70 disabled:opacity-50"
                            >
                              {isCancelling ? "Đang xử lý..." : (isDraftStatus ? "Xóa phiếu" : "Hủy phiếu")}
                            </button>
                          )}
                        </div>

                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full min-w-0 h-8 text-[9px] font-black uppercase tracking-[0.06em] text-[#E4002B] bg-white/90 rounded-full border border-white opacity-100 cursor-not-allowed"
                        >
                          Đã hoàn thành
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeLotItem && (
        <LotDetailModal
          isOpen={true}
          productId={activeLotItem.productId}
          productName={activeLotItem.product}
          orderedQty={activeLotItem.quantity}
          unitName={activeLotItem.unit}
          receivedQty={activeLotItem.receivedQty || 0}
          currentReceiving={!(String(status).toLowerCase().includes("draft") || status === "Dự thảo" || status === "Nháp") ? (activeLotItem.actual_qty || 0) : activeLotItem.quantity}
          initialLots={activeLotItem.lots || []}
          isReadOnly={!(String(status).toLowerCase().includes("draft") || status === "Dự thảo" || status === "Nháp") || (activeLotItem.id > 0 && activeLotItem.id < 1000000000)}
          onClose={() => setActiveLotItem(null)}
          onSave={handleSaveLots}
        />
      )}

      {showReceivedDetail && (
        <ReceiptDetailModal
          receipt={{
            ...receiptData,
            code: `${receiptData?.code || '---'}`,
            receptions: receptionHistory
          }}
          onClose={() => setShowReceivedDetail(false)}
        />
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Xác nhận xóa phiếu"
        message="Bạn có chắc chắn muốn XÓA phiếu nháp này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy bỏ"
        type="danger"
        isLoading={isCancelling}
        onConfirm={handleDeleteOrder}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
    ,
    document.body
  );
}