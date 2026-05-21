"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from "react";
import { X } from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";
registerLocale("vi", vi);

interface LotLine {
  lotId?: number;
  lotName: string;
  quantity: number;
  expiryDate: string;
}

interface Props {
  isOpen: boolean;
  productId: number;
  productName: string;
  orderedQty: number;      // Tổng số lượng đặt (vd: 100)
  receivedQty: number;     // Tổng số lượng đã nhận xong (vd: 40)
  currentReceiving: number; // Số lượng đang gõ nhập lần này (vd: 10)
  unitName?: string;
  initialLots: LotLine[];
  isReadOnly?: boolean;
  onClose: () => void;
  onSave: (lots: LotLine[]) => void;
}


export default function LotDetailModal({
  isOpen,
  productId,
  productName,
  orderedQty,
  receivedQty,
  currentReceiving,
  unitName = "đơn vị",
  initialLots,
  isReadOnly,
  onClose,
  onSave
}: Props) {
  const [lots, setLots] = useState<LotLine[]>([]);

  const initialized = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      initialized.current = false;
      return;
    }

    if (initialized.current) return; // Chỉ khởi tạo data lần đầu mở lên
    initialized.current = true;


    if (initialLots.length > 0) {
      setLots([initialLots[0]]);
    } else {
      setLots([{ lotName: "", quantity: currentReceiving || (orderedQty - receivedQty), expiryDate: "" }]);
    }
  }, [initialLots, orderedQty, receivedQty, currentReceiving, isOpen]);

  if (!isOpen) return null;

  const generateLotNum = () => {
    const uuid = uuidv4().replace(/\D/g, ""); // chỉ lấy số
    let firstNum = uuid.slice(0, 3);
    let secondNum = uuid.slice(3, 6);

    // nếu thiếu thì pad thêm
    firstNum = firstNum.padEnd(3, "0");
    secondNum = secondNum.padEnd(3, "1");

    // nếu trùng thì đổi cụm sau
    if (firstNum === secondNum) {
      secondNum = uuid.slice(6, 9).padEnd(3, "2");
      if (firstNum === secondNum) {
        secondNum = String((Number(firstNum) + 1) % 1000).padStart(3, "0");
      }
    }

    return { firstNum, secondNum };
  };

  const handleAutoFill = (e: React.MouseEvent | React.TouchEvent, idx: number) => {
    e.preventDefault();
    setLots(prevLots => {
      const newLots = [...prevLots];
      if (!newLots[idx]) {
        newLots[idx] = { lotName: "", quantity: currentReceiving || (orderedQty - receivedQty), expiryDate: "" };
      }

      const threeYearsLater = new Date();
      threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
      const year = threeYearsLater.getFullYear();
      const month = String(threeYearsLater.getMonth() + 1).padStart(2, '0');
      const day = String(threeYearsLater.getDate()).padStart(2, '0');
      const today = new Date();
      const currentDate = today.getFullYear().toString() + String(today.getMonth() + 1).padStart(2, '0');
      const { firstNum, secondNum } = generateLotNum();

      newLots[idx] = {
        ...newLots[idx],
        lotName: `LOT-KFC-${currentDate}-${firstNum}-${secondNum}`,
        expiryDate: `${year}-${month}-${day}`
      };

      return newLots;
    });
  };

  const handleSave = () => {
    // Luôn đảm bảo số lượng trong lô khớp với số lượng đang nhận/cần khai báo
    const finalQty = !isReadOnly ? (orderedQty - receivedQty) : currentReceiving;
    const finalLots = [{
      ...lots[0],
      quantity: finalQty
    }];
    onSave(finalLots);
  };

  const pendingQty = Math.max(0, orderedQty - receivedQty - currentReceiving);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2rem] border border-[#E4002B]/35 shadow-sm p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-7 bg-[#E4002B] rounded-full shrink-0" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Phân bổ lô</p>
                <h3 className="font-black text-gray-900 uppercase text-lg tracking-tight">Chi tiết lô hàng</h3>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-3 ml-6">
              <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block leading-none mb-1">Sản phẩm</span>
                <span className="text-xs font-black text-gray-900 uppercase truncate max-w-[240px] block">{productName}</span>
              </div>
              <div className="bg-blue-50/50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest block leading-none mb-1">Tổng đơn</span>
                <span className="text-xs font-black text-blue-700 tabular-nums">{orderedQty} {unitName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 pr-0 rounded-[1.5rem] border border-[#E4002B]/35 overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-[#ffe3e9] via-[#fff1f4] to-white border-b border-[#E4002B]/35">
                <th className="text-left py-4 pl-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lô</th>
                <th className="text-center py-4 w-32 text-[10px] font-black text-gray-400 uppercase tracking-widest">Số lượng</th>
                <th className="text-center py-4 w-32 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                <th className="text-left py-4 pl-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hạn sử dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
              {/* 1. Dòng đã hoàn thành (nếu có) */}
              {receivedQty > 0 && (
                <tr className="bg-gray-50/50">
                  <td className="py-4 pl-2 font-mono text-gray-400">{lots[0]?.lotName || "---"}</td>
                  <td className="py-4 text-center font-black text-gray-400">{receivedQty}</td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border bg-green-100 text-green-600 border-green-200">Đã hoàn thành</span>
                  </td>
                  <td className="py-4 pl-4 text-gray-400 font-bold">{lots[0]?.expiryDate || "---"}</td>
                </tr>
              )}

              {/* 2. Dòng đang thực hiện (Lần này / Hoặc đang khởi tạo ở bản Nháp) */}
              {(currentReceiving > 0 || !isReadOnly) && (
                <tr className="group">
                  <td className="py-5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          disabled={isReadOnly}
                          className={`w-full border border-gray-100 rounded-[1rem] p-2.5 font-mono text-sm outline-none transition-all shadow-sm ${isReadOnly ? "bg-gray-50 text-gray-400" : "bg-gray-50/50 focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20"}`}
                          value={lots[0]?.lotName || ""}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            const val = e.target.value;
                            setLots(prev => {
                              const newLots = [...prev];
                              newLots[0] = {
                                ...newLots[0],
                                lotName: val,
                                lotId: 0
                              };
                              return newLots;
                            });
                          }}
                          placeholder={isReadOnly ? "" : "Nhập số lô..."}
                        />
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={(e) => handleAutoFill(e, 0)}
                          title="Tự động tạo số lô & HSD"
                          className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl hover:bg-[#E4002B] hover:text-white hover:border-[#E4002B] transition-all shadow-sm flex items-center justify-center shrink-0 w-10 h-10"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-5 px-2">
                    <input
                      type="number"
                      max="2147483647"
                      readOnly
                      className="w-full border border-gray-100 rounded-[1rem] p-2.5 text-center font-black text-sm text-[#E4002B] bg-gray-50/50 outline-none tabular-nums"
                      value={!isReadOnly ? (orderedQty - receivedQty) : currentReceiving}
                    />
                  </td>
                  <td className="py-5 text-center">
                    <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border bg-blue-100 text-blue-700 border-blue-200">
                      {!isReadOnly ? "Khởi tạo lô" : "Đang nhận (lần này)"}
                    </span>
                  </td>
                  <td className="py-5 pl-4">
                    <div className="relative kfc-receipt-datepicker-container">
                        <DatePicker
                        locale="vi" calendarClassName="kfc-datepicker-custom" fixedHeight
                        portalId="kfc-replenishment-portal"
                        minDate={new Date()}
                        disabled={isReadOnly}
                        selected={lots[0]?.expiryDate ? new Date(lots[0].expiryDate) : null}
                        onChange={(date: Date | null) => {
                          if (isReadOnly) return;
                          const newLots = [...lots];
                          if (date) {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            newLots[0].expiryDate = `${year}-${month}-${day}`;
                          } else {
                            newLots[0].expiryDate = "";
                          }
                          setLots(newLots);
                        }}
                        dateFormat="dd/MM/yyyy"
                        placeholderText={isReadOnly ? "" : "dd/MM/yyyy"}
                        className={`w-full border border-gray-100 rounded-[1rem] pl-4 pr-10 py-2.5 text-xs font-bold outline-none transition-all ${isReadOnly ? "bg-gray-50 text-gray-400" : "bg-gray-50/50 focus:bg-white focus:border-red-100/50 focus:ring-8 focus:ring-red-50/20"}`}
                      />
                    </div>
                  </td>
                </tr>
              )}

              {/* 3. Dòng chờ nhập (Còn lại) */}
              {pendingQty > 0 && (
                <tr className="bg-orange-50/30">
                  <td className="py-4 pl-2 font-mono text-orange-400">{lots[0]?.lotName || "---"}</td>
                  <td className="py-4 text-center font-black text-orange-600">{pendingQty}</td>
                  <td className="py-4 text-center">
                    <span className="px-3 py-1 text-[9px] font-black uppercase rounded-full border bg-yellow-100 text-yellow-700 border-yellow-200">Chờ nhập</span>
                  </td>
                  <td className="py-4 pl-4 text-orange-400/70 font-bold">{lots[0]?.expiryDate || "---"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center mb-8 pt-4 border-t border-gray-100">
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block leading-none mb-1">Phân bổ lần này</span>
            <span className="text-base font-black text-blue-600 tabular-nums">
              {!isReadOnly ? (orderedQty - receivedQty) : currentReceiving} / {orderedQty - receivedQty}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isReadOnly ? (
            <button type="button" onClick={onClose} className="w-full h-14 rounded-full border border-gray-200 bg-white text-[11px] font-bold uppercase tracking-[0.06em] text-gray-700 hover:bg-gray-50 hover:border-red-100/50 hover:text-[#E4002B] transition-all">
              Đóng
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} className="flex-1 h-14 rounded-full border border-transparent text-[11px] font-bold uppercase tracking-[0.06em] text-gray-500 hover:text-[#E4002B] hover:bg-red-50/50 transition-all">
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={(!isReadOnly ? (orderedQty - receivedQty) : currentReceiving) === 0}
                className="flex-[2] h-14 bg-[#E4002B] text-white rounded-full border border-[#E4002B] text-[11px] font-bold uppercase tracking-[0.06em] hover:bg-[#cc0027] hover:shadow-lg hover:shadow-red-200/60 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Xác nhận lô
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}