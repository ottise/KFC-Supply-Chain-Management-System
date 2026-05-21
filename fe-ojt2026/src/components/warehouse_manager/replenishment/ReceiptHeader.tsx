/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, useMemo } from "react";
import OdooDropdown from "@/components/common/OdooDropdown";
import { format } from "date-fns";
import { getStoredUserInfo } from "@/lib/utils/authUtils";
import { warehouseApi } from "@/lib/api/warehouse/warehouseApi";
import { locationsApi } from "@/lib/api/warehouse/locationsApi";
import { supplierApi } from "@/lib/api/warehouse/supplierApi";
import { Calendar } from "lucide-react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
registerLocale("vi", vi);

export default function ReceiptHeader({
  vendor, setVendor,
  setVendorId,
  sourceDoc, setSourceDoc,
  creationDate, setCreationDate,
  scheduledDate, setScheduledDate,
  toLocation, setToLocation,
  setToLocationId,
  setToWarehouseId,
  onLocationChange,
  toLocationId: toLocationIdProp,
  status,
  completionDate
}: any) {
  const toLocationId = Number(toLocationIdProp) || 0;
  const s = String(status || "").toLowerCase();
  // Cho phép chỉnh sửa ở trạng thái nháp hoặc khi đang tạo mới phiếu (mã phiếu chưa có)
  const isDraft = s === "nháp" || s === "dự thảo" || s === "draft" || s.includes("nháp") || s.includes("draft") || s === "";
  const isCompleted = s === "hoàn thành" || s === "đã hoàn thành" || s.includes("hoàn tất") || s.includes("completed");
  const isReadOnly = !isDraft;
  const isSourceReadOnly = !isDraft;


  const [apiLocations, setApiLocations] = useState<{ id: number; label: string; warehouseId: number; warehouseName?: string }[]>([]);
  const [apiVendors, setApiVendors] = useState<{ id: number; name: string; address: string; phone: string }[]>([]);
  const [vendorError, setVendorError] = useState(false);

  /** Cùng kiểu trigger với phiếu xuất (CreateOperationForm). */
  const receiptDropdownTrigger =
    "!h-10 !min-h-0 !px-3 !rounded-lg kfc-form-field-shadow hover:!shadow-[0_4px_18px_-6px_rgba(15,23,42,0.1),0_2px_10px_-4px_rgba(228,0,43,0.12)] !text-[10px] !leading-snug [&>div:first-child]:gap-2 [&_input]:!text-[10px] [&_input]:!font-bold [&_input]:!text-gray-800 [&_.odoo-dropdown-value]:!text-[10px] [&_.odoo-dropdown-value]:!font-bold [&_.odoo-dropdown-value]:!text-gray-800 [&_.odoo-dropdown-placeholder]:!text-[10px] [&_.odoo-dropdown-placeholder]:!font-medium [&_.odoo-dropdown-placeholder]:!text-gray-400 [&_svg]:!size-3.5 [&>div:last-child]:!pl-2.5 [&>div:last-child]:!gap-1 [&>div:last-child]:!pr-1.5";

  // State khai báo validate Location
  const [locationError, setLocationError] = useState(false);

  // ==============================
  // 1. GỌI API LOCATION
  // ==============================
  useEffect(() => {
    const timerId = setTimeout(async () => {
      try {
        let finalLocations: { id: number; label: string; warehouseId: number; warehouseName?: string }[] = [];

        const userInfo = getStoredUserInfo();
        let effectiveId: number | undefined = undefined;
        let isAdmin = false;

        if (userInfo) {
          const role = String(userInfo.role || "").toLowerCase();
          if (role.includes('staff')) {
            const rawManagerId = (userInfo as any).managerId || (userInfo as any).ManagerId;
            if (rawManagerId && rawManagerId !== "null") {
              effectiveId = Number(rawManagerId);
            }
          } else if (role.includes('manager')) {
            const rawId = userInfo.id || (userInfo as any).userId || (userInfo as any).uid || (userInfo as any).sub;
            if (rawId && rawId !== "null") {
              effectiveId = Number(rawId);
            }
          } else if (role === 'admin') {
            isAdmin = true;
          }
        }

        let warehouseArray: any[] = [];
        if (isAdmin) {
          warehouseArray = await warehouseApi.getWarehouses();
        } else if (effectiveId) {
          // Fallback to getWarehouses if getWarehousesByManagerId is not available
          // In real scenario, we should filter or use the specific manager method
          warehouseArray = await warehouseApi.getWarehouses();
          // Filter locally if needed
          if (!isAdmin && effectiveId) {
            warehouseArray = warehouseArray.filter((w: any) => (w.ManagerId || w.managerId) === effectiveId);
          }
        }

        if (warehouseArray.length > 0) {
          let allLocations: { id: number; label: string; warehouseId: number; warehouseName?: string }[] = [];
          const locationCache = new Map<number, any>();

          for (const wh of warehouseArray) {
            const whId = wh.Id || wh.id;
            const whName = wh.Name || wh.name || `Kho #${whId}`;

            if (whId) {
              const locRes = await locationsApi.getLocations({
                warehouseId: whId,
                pageSize: 100
              });
              const locsArray = locRes.Items || [];
              locsArray.forEach((l: any) => locationCache.set(l.Id || l.id, l));

              const items = locsArray.map((loc: any) => {
                const locId = loc.Id || loc.id;
                const locName = loc.Name || loc.name || "Vị trí";
                const label = `${locName}`;
                return { id: locId, label, warehouseId: whId, warehouseName: whName };
              });
              allLocations = [...allLocations, ...items];
            }
          }
          const seen = new Set<number>();
          finalLocations = allLocations.filter((l: any) => {
            if (seen.has(l.id)) return false;
            seen.add(l.id);
            return true;
          });
        }

        if (finalLocations.length === 0) {
          setApiLocations([{ id: 0, label: "(Chưa có dữ liệu vị trí)", warehouseId: 0 }]);
        } else {
          setApiLocations(finalLocations);
        }
      } catch (error: any) {
        console.error("Lỗi tải hệ thống:", error);
        setApiLocations([{ id: 0, label: "(Lỗi tải hệ thống)", warehouseId: 0 }]);
      }
    }, 300);
    return () => clearTimeout(timerId);
  }, []);


  // ==============================
  // 2. GỌI API SUPPLIERS
  // ==============================
  useEffect(() => {
    const timerId = setTimeout(async () => {
      try {
        const activeItems = await supplierApi.getAllActiveSuppliers({});
        const vendorObjs = activeItems.map((item) => ({
          id: item.Id,
          name: item.Name || "---",
          address: String(item.Address ?? ""),
          phone: String(item.Phone ?? ""),
        }));

        setApiVendors(vendorObjs);
      } catch (error: any) {
        console.error("Lỗi fetch Suppliers:", error);
      }
    }, 300);
    return () => clearTimeout(timerId);
  }, []);

  const vendorOptions = useMemo(
    () =>
      apiVendors.map((v) => ({
        ...v,
        displayValue: v.name,
        secondaryValue: v.phone || "",
      })),
    [apiVendors],
  );

  const locationOptions = useMemo(
    () =>
      apiLocations
        .filter((l) => l.id !== 0 && !String(l.label).startsWith("("))
        .map((l) => ({
          id: l.id,
          label: l.label,
          displayValue: l.label,
          warehouseId: l.warehouseId,
          secondaryValue: l.warehouseName || "",
        })),
    [apiLocations],
  );

  const selectedVendor = useMemo(
    () => vendorOptions.find((v) => v.name === vendor) ?? null,
    [vendor, vendorOptions],
  );

  /** Khớp theo ID trước (xem phiếu), vì BE thường trả ToLocationName ngắn khác chuỗi "Tên (Kho)" trên dropdown. */
  const selectedLocation = useMemo(() => {
    const trimmed = String(toLocation || "").trim();

    if (locationOptions.length > 0) {
      if (toLocationId > 0) {
        const byId = locationOptions.find((l) => l.id === toLocationId);
        if (byId) return byId;
      }
      if (trimmed) {
        const exact = locationOptions.find((l) => l.label === trimmed);
        if (exact) return exact;
        const byPrefix = locationOptions.find((l) => l.label.startsWith(`${trimmed} (`));
        if (byPrefix) return byPrefix;
      }
    }

    if (toLocationId > 0 || trimmed) {
      const display = trimmed || (toLocationId > 0 ? `Vị trí #${toLocationId}` : "");
      if (!display) return null;
      return {
        id: toLocationId > 0 ? toLocationId : -1,
        label: display,
        displayValue: display,
        warehouseId: 0,
        secondaryValue: "",
      };
    }
    return null;
  }, [toLocationId, toLocation, locationOptions]);

  const handleVendorChange = (item: Record<string, unknown>) => {
    if (!item || Object.keys(item).length === 0) {
      setVendor("");
      if (setVendorId) setVendorId(0);
      return;
    }
    const v = item as { id: number; name: string; address?: string; phone?: string };
    setVendor(v.name);
    if (setVendorId) setVendorId(v.id);
  };

  const handleLocationChange = (item: Record<string, unknown>) => {
    if (!item || Object.keys(item).length === 0) {
      if (onLocationChange) {
        onLocationChange(0, "", 0);
      } else {
        setToLocation("");
        if (setToLocationId) setToLocationId(0);
        if (setToWarehouseId) setToWarehouseId(0);
      }
      return;
    }
    const l = item as { id: number; label: string; displayValue?: string; warehouseId: number };
    const label = l.displayValue || l.label;

    if (onLocationChange) {
      onLocationChange(l.id, label, l.warehouseId);
    } else {
      setToLocation(label);
      if (setToLocationId) setToLocationId(l.id);
      if (setToWarehouseId) setToWarehouseId(l.warehouseId);
    }
  };

  const receiptReadonlyBox =
    "h-10 min-h-[2.5rem] w-full rounded-lg border border-gray-100 bg-gray-50/50 kfc-form-field-shadow px-3 flex items-center min-w-0";
  const receiptReadonlyText = "text-[10px] font-bold text-gray-800 leading-tight w-full min-w-0";

  const vendorRow = useMemo(
    () => (vendor ? apiVendors.find((x) => x.name === vendor) ?? null : null),
    [vendor, apiVendors],
  );

  const supplierAddressDisplay = !vendor
    ? "—"
    : (vendorRow?.address?.trim() || "Chưa cập nhật địa chỉ");
  const supplierContactDisplay = !vendor
    ? "—"
    : (String(vendorRow?.phone ?? "").trim() || "Chưa cập nhật SĐT");

  return (
    <div className="min-h-0 max-h-full overflow-y-auto custom-scrollbar bg-white rounded-[1.25rem] border border-red-100/40 shadow-md shadow-gray-200/30 p-3 box-border min-w-0">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-1 h-6 bg-[#E4002B] rounded-full shrink-0" />
        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Thông tin nhập hàng</h3>
      </div>

      {/* Đồng bộ layout / ô chỉ đọc / portal dropdown với phiếu xuất */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2 items-start min-w-0">
        <div className="min-w-0 relative">
          <label htmlFor="vendor-select" className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Nhà cung cấp</label>
          <OdooDropdown
            portal
            items={vendorOptions}
            value={selectedVendor}
            onChange={handleVendorChange as (item: (typeof vendorOptions)[number]) => void}
            displayField="displayValue"
            secondaryField="secondaryValue"
            placeholder="Chọn Nhà Cung Cấp..."
            disabled={isReadOnly}
            className={`w-full min-w-0 ${vendorError ? "[&>div]:border-red-300" : ""}`}
            triggerClassName={receiptDropdownTrigger}
            listMaxHeight="max-h-56"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="source-doc" className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Chứng từ gốc</label>
          <input id="source-doc" spellCheck={false} disabled={isSourceReadOnly} type="text" placeholder="Nhập Số PO Hoặc Vận Đơn..." value={sourceDoc} onChange={(e) => setSourceDoc(e.target.value)} className="w-full h-10 px-3.5 bg-gray-50/50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-800 outline-none transition-all placeholder:font-medium placeholder:text-gray-400 focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/20 kfc-form-field-shadow hover:bg-white hover:border-red-100/30 disabled:bg-gray-100/50 disabled:text-gray-500 disabled:cursor-not-allowed" />
        </div>

        <div className="col-span-2 grid min-w-0 w-full grid-cols-[minmax(0,1fr)_7.25rem] gap-x-2 items-start">
          <div className="min-w-0 flex flex-col">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Địa chỉ nhà cung cấp</label>
            <div
              className={receiptReadonlyBox}
              title={!vendor ? "Chọn nhà cung cấp để hiển thị địa chỉ" : supplierAddressDisplay}
            >
              <p className={`${receiptReadonlyText} line-clamp-2 ${!vendor ? "!text-gray-400" : ""}`}>
                {supplierAddressDisplay}
              </p>
            </div>
          </div>
          <div className="min-w-0 w-full flex flex-col">
            <label className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Liên Lạc</label>
            <div
              className={receiptReadonlyBox}
              title={!vendor ? "Chọn nhà cung cấp để hiển thị liên lạc" : supplierContactDisplay}
            >
              <p className={`${receiptReadonlyText} tabular-nums truncate text-left ${!vendor ? "!text-gray-400" : ""}`}>
                {supplierContactDisplay}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-2 min-w-0 relative">
          <label htmlFor="location-select" className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">Vị trí đến</label>
          <OdooDropdown
            portal
            items={locationOptions}
            value={selectedLocation}
            onChange={handleLocationChange as (item: (typeof locationOptions)[number]) => void}
            displayField="displayValue"
            secondaryField="secondaryValue"
            placeholder="Chọn Vị Trí Đến..."
            disabled={isReadOnly}
            className={`w-full min-w-0 ${locationError ? "[&>div]:border-red-300" : ""}`}
            triggerClassName={receiptDropdownTrigger}
            listMaxHeight="max-h-56"
          />
        </div>

        <div className="col-span-2 flex min-w-0 w-full flex-col gap-2 min-[480px]:flex-row min-[480px]:items-end min-[480px]:justify-between min-[480px]:gap-3">
          <p className="order-2 text-[10px] font-medium leading-snug text-gray-400 min-[480px]:order-1 min-[480px]:min-w-0 min-[480px]:flex-1 min-[480px]:pb-1">
            Dự kiến nhận hàng theo chứng từ hoặc lịch giao. Chỉnh lại nếu kế hoạch vận chuyển thay đổi.
          </p>
          <div className="order-1 w-full max-w-[11rem] shrink-0 min-[480px]:order-2">
            <label htmlFor="scheduled-date" className="text-[8px] font-black text-gray-400 uppercase tracking-[0.18em] ml-0.5 mb-1.5 block leading-tight">
              Ngày dự kiến
            </label>
            <div className="relative w-full min-w-0 kfc-receipt-datepicker-container [&_.react-datepicker-wrapper]:!block [&_.react-datepicker-wrapper]:!w-full [&_.react-datepicker__input-container]:!w-full">
              <DatePicker
                id="scheduled-date"
                locale="vi"
                calendarClassName="kfc-datepicker-custom"
                portalId="kfc-replenishment-portal"
                disabled={isReadOnly}
                fixedHeight
                wrapperClassName="!block !w-full min-w-0"
                selected={scheduledDate && scheduledDate.includes('-') ? new Date(scheduledDate + "T00:00:00") : (scheduledDate ? new Date(scheduledDate) : null)}
                minDate={creationDate && creationDate.includes('-') ? new Date(creationDate + "T00:00:00") : (creationDate ? new Date(creationDate) : new Date())}
                onChange={(date: Date | null) => {
                  if (!date) {
                    setScheduledDate('');
                    return;
                  }
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  setScheduledDate(`${year}-${month}-${day}`);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn Ngày..."
                isClearable={!isReadOnly}
                className="!box-border w-full !h-10 min-h-[2.5rem] pl-3.5 pr-16 bg-gray-50/50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-800 outline-none focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/30 transition-all cursor-pointer kfc-form-field-shadow hover:bg-white hover:border-red-100/30 disabled:bg-gray-100/50 disabled:text-gray-500 disabled:cursor-not-allowed text-left leading-tight tabular-nums placeholder:font-medium placeholder:text-gray-400"
              />
              {!isReadOnly ? (
                <button
                  type="button"
                  className="absolute right-11 top-1/2 z-[2] -translate-y-1/2 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Mở lịch"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const el = document.getElementById("scheduled-date");
                    el?.focus();
                    el?.click();
                  }}
                >
                  <Calendar className="h-3.5 w-3.5 pointer-events-none" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {isCompleted && completionDate && (
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Thời gian nhận hàng</span>
          </div>
          <div className="bg-green-50/50 border border-green-100/50 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
            <span className="text-[10px] font-black text-green-700 tabular-nums">
              {(() => {
                if (!completionDate) return "---";
                try {
                  const date = new Date(
                    String(completionDate).endsWith("Z") || String(completionDate).includes("+")
                      ? String(completionDate)
                      : `${String(completionDate)}Z`
                  );
                  return format(date, "HH:mm dd/MM/yyyy");
                } catch {
                  return String(completionDate);
                }
              })()}
            </span>
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}