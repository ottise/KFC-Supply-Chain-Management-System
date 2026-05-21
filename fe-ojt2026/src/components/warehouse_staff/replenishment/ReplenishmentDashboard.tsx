"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

import { useState, useEffect, useRef } from "react";
import ReplenishmentFilter from "./ReplenishmentFilter";
import ReplenishmentTable from "./ReplenishmentTable";
import ReplenishmentPagination from "./ReplenishmentPagination";
import CreateReceiptModal from "./CreateReceiptModal";
import ReceiptDetailModal from "./ReceiptDetailModal";
import { getStoredUserInfo } from "@/lib/utils/authUtils";
import { purchaseOrderApi } from "@/lib/api/warehouse/purchaseOrderApi";
import { locationsApi } from "@/lib/api/warehouse/locationsApi";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { productLotsApi } from "@/lib/api/warehouse/productLotsApi";
import { uomService } from "@/lib/api/warehouse/UomApi";

export default function ReplenishmentDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [fromPlannedDate, setFromPlannedDate] = useState("");
  const [toPlannedDate, setToPlannedDate] = useState("");

  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const locationCache = useRef(new Map<number, any>());
  const warehouseCache = useRef(new Map<number, any>());
  const abortControllerRef = useRef<AbortController | null>(null);

  // GỌI API LẤY DANH SÁCH PHIẾU
  const fetchReceipts = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);

    const getApiStatus = (uiStatus: string) => {
      switch (uiStatus) {
        case "Nháp":
          return "Draft";
        case "Sẵn sàng":
          return "Confirmed";
        case "Nhận một phần":
          return "PartiallyReceived";
        case "Đã hoàn thành":
          return "Completed";
        default:
          return undefined;
      }
    };

    // Get user info to filter
    const userInfo = getStoredUserInfo();
    let filterCreatedById = undefined;

    // If not admin, restrict the visible POs
    if (userInfo && userInfo.role !== 'admin') {
      filterCreatedById = Number(userInfo?.id || (userInfo as any)?.uid || (userInfo as any)?.sub);

      if (!filterCreatedById) {
        setReceipts([]);
        setTotalItems(0);
        setTotalPages(1);
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await purchaseOrderApi.searchPurchaseOrders({
        search: searchTerm?.trim() || undefined,
        status: getApiStatus(statusFilter) as any,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        fromPlannedDate: fromPlannedDate || undefined,
        toPlannedDate: toPlannedDate || undefined,
        createdById: filterCreatedById,
        page: currentPage,
        pageSize: pageSize,
      }, { signal });



      let rawData: any[] = [];
      if (res) {
        // Cấu trúc phân trang chuẩn (Items, TotalCount, TotalPages, HasNext, HasPrevious)
        rawData = res.Items || [];
        setTotalPages(res.TotalPages || 1);
        setTotalItems(res.TotalItems || 0);
      }

      // Hàm đệ quy lấy thông tin Vị trí
      const resolveLocationPath = async (
        locId: number,
      ): Promise<{ warehouse: string; warehouseId: number; path: string }> => {
        if (!locId)
          return { warehouse: "Kho Tổng", warehouseId: 0, path: "Vị trí chưa xác định" };

        const pathParts: string[] = [];
        let currentWhName = "Kho Tổng";
        let currentWhId = 0;

        let currId: number | null = locId;
        while (currId) {
          let locData = locationCache.current.get(currId);
          if (!locData) {
            try {
              locData = await locationsApi.getLocationById(currId);
              if (locData) locationCache.current.set(currId, locData);
            } catch {
              break;
            }
          }

          if (!locData) break;

          const name = locData.Name || locData.name || "";
          pathParts.unshift(name);

          const whId = locData.WarehouseId || locData.warehouseId;
          if (whId) currentWhId = whId;
          if (whId && !warehouseCache.current.has(whId)) {
            try {
              const wData = await warehouseApi.getWarehouseById(whId);
              warehouseCache.current.set(whId, wData);
              currentWhName = wData.Name || wData.name || currentWhName;
            } catch {
              // ignore
            }
          } else if (whId) {
            currentWhName =
              warehouseCache.current.get(whId)?.Name ||
              warehouseCache.current.get(whId)?.name ||
              currentWhName;
          }

          currId = locData.ParentId || locData.parentId;
        }

        let finalPath = pathParts.join(" | ");
        if (finalPath.includes(" - ")) {
          const locParts = finalPath.split(" - ");
          currentWhName = locParts[0];
          finalPath = locParts.slice(1).join(" | ");
        }

        return { warehouse: currentWhName, warehouseId: currentWhId, path: finalPath };
      };

      const mappedData = await Promise.all(
        rawData.map(async (item: any) => {
          const locId = item.ToLocationId ?? item.toLocationId;
          const resolved = await resolveLocationPath(locId);

          const safeDate = (dt: any) => {
            if (!dt) return "";
            const s = String(dt);
            return s.length >= 10 ? s.substring(0, 10) : s;
          };

          return {
            id: item.Id ?? item.id,
            docId: item.DocId ?? item.docId ?? 0,
            code: item.DocumentNo ?? item.documentNo ?? item.Code ?? item.code ?? "---",
            source: item.Origin ?? item.origin ?? "---",
            vendor: item.SupplierName ?? item.supplierName ?? "---",
            vendorId: item.SupplierId ?? item.supplierId ?? 0,
            fromLocation: item.SupplierName ?? item.supplierName,
            toLocation: item.ToLocationName ?? item.toLocationName,
            toLocationId: item.ToLocationId ?? item.toLocationId ?? 0,
            warehouse: resolved.warehouse,
            warehouseId: resolved.warehouseId,
            locationPath: resolved.path,
            status: item.Status ?? item.status ?? "Dự thảo",
            itemCount:
              item.ItemCount ??
              item.itemCount ??
              item.item_count ??
              item.TotalItem ??
              item.totalItem ??
              0,
            totalQuantity:
              item.TotalQuantity ??
              item.totalQuantity ??
              item.total_quantity ??
              item.TotalQty ??
              item.totalQty ??
              0,
            responsible: item.Responsible ?? item.responsible ?? "---",
            date: safeDate(item.CreatedAt || item.createdAt || item.CreatedDate || item.createdDate || item.created_at),
            creationDate: safeDate(item.CreatedAt || item.createdAt || item.CreatedDate || item.createdDate || item.created_at),
            scheduledDate: safeDate(
              item.PlannedDate ||
              item.plannedDate ||
              item.planned_date ||
              item.ExpectedDate ||
              item.expectedDate ||
              item.expected_date ||
              item.ScheduledDate ||
              item.scheduledDate ||
              item.scheduled_date
            ),
            updatedAt: item.UpdatedAt || item.updatedAt || item.completionDate || item.CompletionDate || item.completedAt || item.CompletedAt,
          };
        })
      );

      setReceipts(mappedData);
    } catch (error: any) {
      if (axios.isCancel(error)) {
        console.log("Request canceled:", error.message);
        return;
      }
      console.error("Lỗi khi fetch danh sách phiếu nhập:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, fromDate, toDate, fromPlannedDate, toPlannedDate, currentPage, pageSize]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [editingReceipt, setEditingReceipt] = useState<any>(null);

  const handleCreateNewDraft = () => {
    setEditingReceipt(null);
    setIsCreateOpen(true);
  };

  const handleUpdateReceipt = (updatedData: any) => {
    fetchReceipts();
    setIsCreateOpen(false);
    setEditingReceipt(null);
  };

  const handleDateChange = (from: string, to: string, type: "created" | "planned") => {
    if (type === "created") {
      setFromDate(from);
      setToDate(to);
      setFromPlannedDate("");
      setToPlannedDate("");
    } else {
      setFromPlannedDate(from);
      setToPlannedDate(to);
      setFromDate("");
      setToDate("");
    }
  };

  return (
    <div className="space-y-6 relative animate-in fade-in duration-500">
      <ReplenishmentFilter
        onSearch={setSearchTerm}
        onFilterStatus={setStatusFilter}
        onDateChange={handleDateChange}
        onCreateClick={handleCreateNewDraft}
      />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 z-20 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-[#E4002B] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đang tải dữ liệu...</span>
            </div>
          </div>
        )}
        <ReplenishmentTable
          data={receipts}
          onRowClick={async (receipt) => {
            setIsLoading(true);
            let fullDetail = receipt;

            if (receipt.id) {
              try {
                // Fetch full PO to ensure Origin/Source is populated
                const fullPO = (await purchaseOrderApi.getPurchaseOrderById(receipt.id)) as any;
                if (fullPO) {
                  fullDetail = {
                    ...receipt,
                    source: fullPO.Origin || fullPO.origin || receipt.source,
                    vendorId: fullPO.SupplierId || fullPO.supplierId || receipt.vendorId,
                    status: fullPO.Status || fullPO.status || receipt.status,
                    scheduledDate: (fullPO.PlannedDate || fullPO.plannedDate || "").split("T")[0] || receipt.scheduledDate,
                  };
                }

                const itemsList = await purchaseOrderApi.getPurchaseOrderItemsByOrderId(receipt.id);

                const resolvedItems = await Promise.all(
                  itemsList.map(async (it: any) => {
                    let prodName =
                      it.ProductName || it.productName || it.product?.name || it.Product?.Name || "Đang tải...";
                    let unitName = it.UnitName || it.unitName || it.Unit || it.unit || "Kg";

                    if (prodName === "Đang tải...") {
                      try {
                        const pData = await productsApi.getProductById(Number(it.ProductId || it.productId));
                        prodName = pData.Name || "N/A";

                        const uId = pData.PurchaseUomId || pData.BaseUomId;
                        if (uId) {
                          const uData = await uomService.getUomById(Number(uId));
                          unitName = uData.Name || "Kg";
                        }
                      } catch {
                        // ignore
                      }
                    }

                    let resolvedLots: any[] = [];
                    let lotInfo = it.Lot || it.lot;
                    const lotId = it.LotId || it.lotId || (lotInfo?.Id || lotInfo?.id) || 0;

                    // Nếu có LotId nhưng thiếu Object Lot, ta thử fetch thêm
                    if (lotId > 0 && !lotInfo) {
                      try {
                        lotInfo = await productLotsApi.getLotById(lotId);
                      } catch (e) {
                        console.warn(`Không lấy được thông tin Lô ID: ${lotId}`);
                      }
                    }

                    if (lotId > 0) {
                      resolvedLots = [{
                        lotId: lotId,
                        lotName: (lotInfo && (lotInfo.LotNumber || lotInfo.lotNumber)) || "---",
                        quantity: it.OrderedQty ?? it.orderedQty ?? it.Quantity ?? it.quantity ?? 0,
                        expiryDate: (lotInfo?.ExpirationDate || lotInfo?.expirationDate || "").split("T")[0],
                      }];
                    }

                    return {
                      id: it.Id || it.id || Math.random(),
                      productId: it.ProductId || it.productId,
                      product: prodName,
                      quantity: it.OrderedQty ?? it.orderedQty ?? it.Quantity ?? it.quantity ?? 0,
                      actual_qty: it.ReceivedQty ?? it.receivedQty ?? it.ActualQty ?? it.actual_qty ?? 0,
                      receivedQty: it.ReceivedQty ?? it.receivedQty ?? 0,
                      unitPrice: it.UnitPrice ?? it.unitPrice ?? 0,
                      subtotal: it.Subtotal ?? it.subtotal ?? 0,
                      unit: unitName,
                      lots: resolvedLots,
                    };
                  })
                );

                fullDetail = {
                  ...receipt,
                  items: resolvedItems,
                };
              } catch (err) {
                console.error("Lỗi fetch items chi tiết:", err);
              }
            }

            if (fullDetail.status === "Đã hoàn thành") {
              setSelectedReceipt(fullDetail);
            } else {
              setEditingReceipt(fullDetail);
              setIsCreateOpen(true);
            }
            setIsLoading(false);
          }}
        />
      </div>

      <ReplenishmentPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      <CreateReceiptModal
        key={isCreateOpen ? editingReceipt?.id || "new-order" : "closed"}
        isOpen={isCreateOpen}
        receiptData={editingReceipt}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingReceipt(null);
        }}
        onSave={handleUpdateReceipt}
      />

      <ReceiptDetailModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
    </div>
  );
}
