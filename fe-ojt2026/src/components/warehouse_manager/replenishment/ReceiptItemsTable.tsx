"use client";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { productsApi } from "@/lib/api/warehouse/productsApi";
import { uomService } from "@/lib/api/warehouse/UomApi";
import { productWarehouseApi } from "@/lib/api/warehouse/productWarehouseApi";

function ProductAutocomplete({ value, onChange, disabled, defaultUnit, warehouseId }: any) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiProducts, setApiProducts] = useState<any[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [inputValue, setInputValue] = useState(value || "");
  const [productError, setProductError] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
    setProductError(false);
  }, [value]);

  useEffect(() => {
    const timerId = setTimeout(async () => {
      try {
        let dataArray = [];
        if (warehouseId && warehouseId > 0) {
          const [resWh, resProd] = await Promise.all([
            productWarehouseApi.getByWarehouse(warehouseId, {
              page: 1,
              pageSize: 50,
              search: searchKeyword || undefined,
            }),
            productsApi.getProducts({
              page: 1,
              pageSize: 100,
              search: searchKeyword || undefined,
            })
          ]);

          const prodMap = new Map((resProd.Items || []).map((p: any) => [p.Id, p]));

          dataArray = (resWh.Items || []).map((pw: any) => {
            const fullProd = prodMap.get(pw.ProductId);
            return {
              Id: pw.ProductId,
              Name: pw.ProductName,
              // Merge: prefer full product data for UoM fields
              PurchaseUomId: fullProd?.PurchaseUomId || pw.PurchaseUomId,
              BaseUomId: fullProd?.BaseUomId || pw.BaseUomId,
              PurchaseUomName: fullProd?.PurchaseUomName || pw.PurchaseUomName,
              BaseUomName: fullProd?.BaseUomName || pw.BaseUomName,
              PurchasePrice: fullProd?.PurchasePrice || pw.PurchasePrice || pw.SalePrice || pw.Price,
              StockPrice: pw.StockPrice || fullProd?.StockPrice
            };
          });
        } else {
          const res = await productsApi.getProducts({
            page: 1,
            pageSize: 100,
            search: searchKeyword || undefined,
          });
          dataArray = res.Items || [];
        }

        const uomIds = Array.from(
          new Set(dataArray.map((item: any) => item?.PurchaseUomId || item?.BaseUomId).filter(Boolean)),
        );

        const uomMap: Record<string, string> = {};
        await Promise.all(
          uomIds.map(async (uId) => {
            try {
              const uData = await uomService.getUomById(Number(uId));
              uomMap[String(uId)] = uData?.Name || `ĐVT #${uId}`;
            } catch {
              // ignore
            }
          }),
        );

        const results = dataArray.map((item: any) => {
          if (typeof item === "string") return { id: 0, name: item, unit: defaultUnit || "Kg" };

          const uId = item.PurchaseUomId || item.BaseUomId;
          const uName =
            uId && uomMap[String(uId)]
              ? uomMap[String(uId)]
              : item.PurchaseUomName || item.BaseUomName || defaultUnit || "Kg";

          return {
            id: item.Id || item.id || 0,
            name: item.Name || item.name || item.ProductName || item.code || "SP không tên",
            unit: uName,
            uomId: uId,
            price: item.PurchasePrice || item.purchasePrice || item.SalePrice || item.salePrice || item.UnitPrice || item.unitPrice || 0,
            stockPrice: item.StockPrice || item.stockPrice || 0,
          };
        });

        setApiProducts(results.length ? results : [{ name: "(Không tìm thấy nguyên liệu)", unit: "" }]);
      } catch (err) {
        console.error("Error fetching products:", err);
        setApiProducts([{ name: "(Lỗi tải hệ thống)", unit: "" }]);
      }
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchKeyword, defaultUnit, warehouseId]);

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          spellCheck={false}
          disabled={disabled}
          type="text"
          value={inputValue}
          placeholder="Chọn nguyên liệu..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setInputValue(val);
            setSearchKeyword(val);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setSearchKeyword("");
            setShowDropdown(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setShowDropdown(false);
              if (inputValue && !apiProducts.some((p) => p.name === inputValue)) setProductError(true);
              else setProductError(false);
            }, 200);
          }}
          className={`w-full h-11 pl-3 pr-8 bg-gray-50/50 border border-gray-100 rounded-[1rem] text-[11px] font-semibold outline-none focus:bg-white focus:border-red-100/50 focus:ring-2 focus:ring-red-50/25 transition-all placeholder:text-gray-300 ${productError ? "border-red-300 bg-red-50/50 text-red-600" : "text-gray-800"
            } ${disabled ? "bg-gray-100/50 text-gray-400 cursor-not-allowed" : "hover:bg-white hover:border-red-100/30 shadow-sm"}`}
        />
        {!disabled && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        )}
      </div>

      {showDropdown && !disabled && apiProducts.length > 0 && (
        <div className="absolute top-full left-0 z-[110] w-full min-w-[280px] mt-1 bg-white border border-gray-100 rounded-[1rem] shadow-lg max-h-60 overflow-y-auto p-1.5 custom-scrollbar">
          {apiProducts.map((prod, idx) => (
            <div
              key={idx}
              className="px-3 py-2.5 flex justify-between items-center gap-3 rounded-lg hover:bg-red-50 hover:text-[#E4002B] cursor-pointer transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                if (!String(prod.name || "").startsWith("(")) {
                  setInputValue(prod.name);
                  onChange({
                    id: prod.id,
                    name: prod.name,
                    unit: prod.unit,
                    uomId: prod.uomId,
                    price: prod.price,
                    stockPrice: prod.stockPrice,
                  });
                }
                setShowDropdown(false);
              }}
            >
              <span className="text-xs font-bold truncate flex-1" title={prod.name}>
                {prod.name}
              </span>
              {prod.unit && (
                <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 rounded px-1.5 py-0.5 flex-shrink-0">
                  {prod.unit}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReceiptItemsTable({
  items,
  status,
  masterIngredients,
  onUpdateItem,
  onRemoveItem,
  onAddItem,
  onOpenLotModal,
  warehouseId,
  showAddButton = true,
}: any) {
  const isDraft = status === "Nháp" || status === "Dự thảo" || status === "Draft";
  const s = String(status).toLowerCase();
  const isConfirmed = s.includes("ready") || s.includes("confirmed") || s.includes("sẵn sàng") || s.includes("sẵn");
  const isPartial = s.includes("partial");
  const isReceivingMode = isConfirmed || isPartial;
  const isCompleted = s.includes("completed") || s.includes("hoàn thành") || s.includes("xong");
  const isInputQtyDisabled = isCompleted;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar pr-1">
        {items.length === 0 ? (
          <div className="h-full min-h-[360px] rounded-[2rem] border border-[#E4002B]/25 bg-gradient-to-b from-[#fff7f8] to-white shadow-sm flex items-center justify-center">
            <div className="text-center px-6">
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">
                Chưa có sản phẩm
              </p>
              {showAddButton && (
                <button
                  type="button"
                  onClick={onAddItem}
                  disabled={!isDraft}
                  className="px-6 h-11 bg-[#E4002B] text-white text-[10px] font-black uppercase tracking-widest rounded-full border border-[#E4002B] hover:bg-[#cc0027] active:scale-95 transition-all disabled:opacity-40"
                >
                  + Thêm sản phẩm
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item: any) => {
              const ordered = Number(item.quantity) || 0;
              const received = Number(item.receivedQty || item.receivedqty) || 0;
              const remaining = Math.max(0, ordered - received);
              const currentReceiving = isReceivingMode ? item.actual_qty ?? 0 : item.quantity;

              const totalInLots =
                item.lots?.reduce((sum: number, l: any) => sum + (Number(l.quantity) || 0), 0) || 0;
              const hasLotName = item.lots?.[0]?.lotName && item.lots[0].lotName !== "";
              const isMatch = isReceivingMode
                ? hasLotName && totalInLots > 0
                : totalInLots === currentReceiving && totalInLots > 0;
              const isExceeding = isReceivingMode && remaining > 0 && currentReceiving > remaining;

              const unitPrice = Number(item.unitPrice) || 0;
              const lineTotal =
                isReceivingMode && remaining <= 0 ? 0 : (Number(currentReceiving) || 0) * unitPrice;

              const isExistingItem = item.id > 0 && item.id < 1000000000;

              return (
                <div
                  key={item.id}
                  className="group rounded-[1.25rem] border border-gray-100/90 bg-white p-3 shadow-sm shadow-gray-200/25 transition-all duration-200 hover:border-red-100/50 hover:shadow-md hover:shadow-red-100/10 sm:p-3.5"
                >
                  <div className="flex flex-col gap-2.5">
                    {/* ... (receiving mode logic) ... */}
                    {isReceivingMode && (
                      <div className="flex flex-col gap-2.5 rounded-xl border border-[#E4002B]/12 bg-gradient-to-b from-white to-[#fff8fa] p-3">
                        {/* ... (qty display logic) ... */}
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                            Đã đặt: <span className="text-slate-900 ml-1">{ordered}</span>
                          </span>
                          <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                            Đã nhận: <span className="text-slate-900 ml-1">{received}</span>
                          </span>
                          <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                            Còn: <span className="text-blue-900 ml-1">{remaining}</span>
                          </span>
                        </div>

                        {remaining > 0 && (
                          <div className="w-full max-w-[240px]">
                            <p className="text-[10px] font-black text-[#E4002B]/70 uppercase tracking-widest mb-1.5 text-left">Số lượng nhận</p>
                            <div
                              className={`h-11 w-full rounded-[1rem] bg-white border shadow-sm overflow-hidden flex items-center transition-all ${isExceeding ? "border-red-300 ring-2 ring-red-100" : "border-[#E4002B]/20 focus-within:ring-2 focus-within:ring-[#E4002B]/15"
                                }`}
                            >
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                max={Math.max(0, remaining)}
                                disabled={isInputQtyDisabled}
                                value={Math.min(Number(currentReceiving) || 0, Math.max(0, remaining)) === 0 ? "" : Math.min(Number(currentReceiving) || 0, Math.max(0, remaining))}
                                onKeyDown={(e) => {
                                  const allowKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                                  if (allowKeys.includes(e.key)) return;
                                  if (!/^\d$/.test(e.key)) e.preventDefault();
                                }}
                                onPaste={(e) => {
                                  const text = e.clipboardData.getData("text");
                                  if (!/^\d+$/.test(text)) e.preventDefault();
                                }}
                                onChange={(e) => {
                                  const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 9);
                                  const num = digitsOnly === "" ? 0 : Number(digitsOnly);
                                  const safeNum = Number.isFinite(num) ? num : 0;
                                  const clamped = Math.min(safeNum, Math.max(0, remaining));
                                  onUpdateItem(item.id, "actual_qty", clamped);
                                }}
                                className="w-[96px] min-w-[96px] max-w-[96px] h-full px-2 bg-transparent text-center font-black outline-none text-[13px] text-gray-900 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="min-w-0 flex-1 h-full border-l border-[#E4002B]/10 bg-[#fff6f8] text-[10px] font-black text-[#E4002B]/70 uppercase flex items-center justify-center px-1.5 text-center leading-tight">
                                {item.unit || "ĐVT"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-[1.25rem] border border-gray-100/80 bg-gradient-to-b from-gray-50/70 to-white p-3 sm:p-3.5">
                      {/* Hàng 1: Sản phẩm | Đơn giá | Số lượng */}
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(12rem,1fr)_auto_minmax(0,9.5rem)] sm:gap-3 sm:items-end">
                        <div className="min-w-0">
                          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">Sản phẩm</p>
                          <ProductAutocomplete
                            disabled={!isDraft || isExistingItem}
                            value={item.product}
                            defaultUnit={item.unit}
                            warehouseId={warehouseId}
                            onChange={(selectedObj: any) => onUpdateItem(item.id, "product", selectedObj)}
                          />
                        </div>

                        <div className="min-w-0 w-fit sm:min-w-[7.5rem]">
                          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 text-center">Đơn giá</p>
                          <div
                            className="flex h-11 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-[1rem] border border-gray-200/90 bg-white px-4 text-[11px] font-black tabular-nums text-gray-800 shadow-[0_1px_0_rgba(0,0,0,0.03)]"
                            title={`${new Intl.NumberFormat("vi-VN").format(unitPrice)} / ${item.unit || "ĐVT"}`}
                          >
                            {new Intl.NumberFormat("vi-VN").format(unitPrice)} / {item.unit || "ĐVT"}
                          </div>
                        </div>

                        <div className="min-w-0 w-full sm:max-w-none sm:justify-self-stretch">
                          <p className="mb-1 text-[9px] font-black uppercase tracking-[0.14em] text-gray-400">
                            {isReceivingMode ? "Số lượng đặt" : "Số lượng"}
                          </p>
                          <div
                            className={`flex h-11 w-full overflow-hidden rounded-[1rem] border border-gray-200/90 bg-white shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-all ${isExceeding ? "border-red-300 ring-2 ring-red-100" : ""
                              }`}
                          >
                            <input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={999999999}
                              disabled={isReceivingMode || isInputQtyDisabled}
                              value={isReceivingMode ? (ordered === 0 ? "" : ordered) : (currentReceiving === 0 ? "" : currentReceiving)}
                              onKeyDown={(e) => {
                                const allowKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
                                if (allowKeys.includes(e.key)) return;
                                if (!/^\d$/.test(e.key)) e.preventDefault();
                              }}
                              onPaste={(e) => {
                                const text = e.clipboardData.getData("text");
                                if (!/^\d+$/.test(text)) e.preventDefault();
                              }}
                              onChange={(e) => {
                                if (isReceivingMode) return;
                                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 9);
                                const num = digitsOnly === "" ? 0 : Number(digitsOnly);
                                onUpdateItem(item.id, "quantity", Number.isFinite(num) ? num : 0);
                              }}
                              className="h-full w-[4.5rem] min-w-[4.5rem] max-w-[4.5rem] bg-transparent px-1.5 text-center text-[11px] font-black tabular-nums text-gray-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <div className="flex min-w-0 flex-1 items-center justify-center border-l border-gray-100 bg-gray-50/50 px-1 text-center text-[9px] font-black uppercase leading-tight text-gray-500">
                              {item.unit || "ĐVT"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div role="presentation" aria-hidden className="py-3">
                        <div className="h-px w-full rounded-full bg-gray-200" />
                      </div>

                      {/* Hàng 2: Nhập lô + Xóa (trái) | Thành tiền (phải) */}
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenLotModal(item)}
                            className={`h-10 shrink-0 rounded-full border px-4 text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.98] ${isMatch
                              ? "border-emerald-200/90 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70"
                              : "border-amber-200/90 bg-amber-50 text-amber-900 hover:bg-amber-100/60"
                              }`}
                          >
                            {isExistingItem || item.lots?.[0]?.lotName ? "Xem số lô" : "Nhập lô"}
                          </button>

                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.id)}
                              className="h-10 shrink-0 rounded-full border border-gray-200/90 bg-white px-4 text-[9px] font-black uppercase tracking-widest text-gray-800 transition-all hover:border-red-200/80 hover:bg-red-50/40 hover:text-[#E4002B] active:scale-[0.98]"
                            >
                              Xóa
                            </button>
                          )}
                        </div>

                        <p
                          className="text-left text-[20px] font-black tabular-nums leading-none text-[#E4002B] text-ellipsis overflow-hidden whitespace-nowrap sm:text-right sm:text-[22px]"
                          title={`${new Intl.NumberFormat("vi-VN").format(lineTotal)} VND`}
                        >
                          {new Intl.NumberFormat("vi-VN").format(lineTotal)} VND
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {showAddButton && isDraft && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onAddItem}
                  className="w-full h-11 rounded-[1.1rem] border border-[#E4002B]/25 bg-white text-[11px] font-bold uppercase tracking-[0.06em] text-[#E4002B] hover:bg-red-50/40 transition-all"
                >
                  + Thêm dòng sản phẩm
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
