"use client";

// 1. Định nghĩa cấu trúc của một bản ghi Replenishment
interface ReplenishmentItem {
  id?: number;
  code: string;
  vendor: string;
  vendorId?: number;
  responsible?: string;
  status: string;
  fromLocation?: string;
  toLocation?: string;
  warehouse?: string;
  locationPath?: string;
  source?: string;
  itemCount?: number;
  totalQuantity?: number;
  scheduledDate?: string;
  creationDate?: string;
  items?: Array<Record<string, unknown>>;
}

// 2. Định nghĩa kiểu cho các Props của Component
interface ReplenishmentTableProps {
  data: ReplenishmentItem[];
  onRowClick: (item: ReplenishmentItem) => void;
}

export default function ReplenishmentTable({
  data,
  onRowClick
}: ReplenishmentTableProps) {

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left table-fixed border-collapse">
        <thead>
          <tr>
            <th className="w-[17%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Mã phiếu / Chứng từ</th>
            <th className="w-[22%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Nhà cung cấp</th>
            <th className="w-[29%] px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Vị trí nhập</th>
            <th className="w-[12%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Ngày dự kiến</th>
            <th className="w-[10%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Sản phẩm | đơn vị</th>
            <th className="w-[10%] px-6 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50 border-b border-gray-100 whitespace-nowrap">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-[11px] font-medium text-gray-600">
          {data.map((receipt: ReplenishmentItem, idx: number) => (
            <tr
              key={receipt.id || idx}
              onClick={() => onRowClick(receipt)}
              className="group hover:bg-red-50/20 cursor-pointer transition-colors"
            >
              {/* Cột 1: Mã phiếu & chứng từ gốc */}
              <td className="px-6 py-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-black text-gray-900 text-[13px] tracking-tight group-hover:text-[#E4002B] transition-colors line-clamp-1 min-w-0">
                      {receipt.code || '---'}
                    </span>
                    {receipt.source && receipt.source !== "---" && receipt.source !== receipt.code && (
                      <span className="inline-flex h-5 items-center rounded-full border border-[#E4002B]/20 bg-gradient-to-b from-white to-red-50/70 px-2 text-[8px] font-black uppercase tracking-[0.07em] text-[#E4002B] shadow-[0_2px_8px_-6px_rgba(228,0,43,0.65)] whitespace-nowrap">
                        {receipt.source}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Đặt: {receipt.creationDate || "---"}</span>
                  </div>
                </div>
              </td>

              {/* Cột 2: Nhà cung cấp */}
              <td className="px-6 py-4">
                <span className="text-[12px] font-bold text-gray-700 leading-tight line-clamp-2">{receipt.fromLocation || "Kho NCC"}</span>
              </td>

              {/* Cột 3: Vị trí nhập */}
              <td className="px-6 py-4 transition-colors">
                <div className="flex flex-col min-w-0">
                  <span className="font-black text-gray-900 text-[11px] uppercase tracking-tighter" title={receipt.warehouse}>
                    {receipt.warehouse || (receipt.toLocation?.includes(" - ") ? receipt.toLocation.split(" - ")[0] : "Kho Tổng")}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5 border-l-2 border-gray-200 pl-2 leading-relaxed" title={receipt.locationPath}>
                    {receipt.locationPath || (receipt.toLocation?.includes(" - ") ? receipt.toLocation.split(" - ").slice(1).join(" | ") : receipt.toLocation || "Vị trí chưa xác định")}
                  </span>
                </div>
              </td>

              {/* Cột 4: Ngày dự kiến - Đưa vào giữa và căn giữa */}
              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <div className={`flex flex-col items-center px-4 py-1.5 rounded-xl border transition-all ${receipt.scheduledDate ? "bg-blue-50/30 border-blue-100" : "bg-gray-50 border-gray-100"}`}>
                    <span className={`text-[11px] font-black tabular-nums transition-colors ${receipt.scheduledDate ? "text-blue-700" : "text-gray-400"}`}>
                      {receipt.scheduledDate || "---"}
                    </span>
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-tighter -mt-0.5 whitespace-nowrap">Dự kiến giao</span>
                  </div>
                </div>
              </td>

              {/* Cột 5: Sản phẩm | Đơn vị - Căn giữa cho cân đối */}
              <td className="px-6 py-4">
                <div className="flex justify-center">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 w-fit">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-gray-900 text-xs">{(receipt.itemCount || 0).toString().padStart(2, '0')}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Items</span>
                    </div>
                    <div className="w-[1.5px] h-5 bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                      <span className="font-black text-gray-900 text-xs">{(receipt.totalQuantity || 0).toString().padStart(2, '0')}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Units</span>
                    </div>
                  </div>
                </div>
              </td>

              {/* Cột 6: Trạng thái */}
              <td className="px-6 py-4 text-center">
                <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border ${(receipt.status === "Đã hoàn thành" || receipt.status === "Completed") ? "bg-green-100 text-green-600 border-green-200" :
                  (receipt.status === "Nhận một phần" || receipt.status === "PartiallyReceived") ? "bg-yellow-100 text-yellow-600 border-yellow-200" :
                    (receipt.status === "Sẵn sàng" || receipt.status === "Confirmed" || receipt.status === "Ready") ? "bg-blue-100 text-blue-700 border-blue-200" :
                      (receipt.status === "Cancelled" || receipt.status === "Đã hủy") ? "bg-red-100 text-red-700 border-red-200" :
                        "bg-gray-100 text-gray-600 border-gray-200"
                  }`}>
                  {receipt.status === 'Draft' || receipt.status === 'Dự thảo' || receipt.status === 'Nháp' ? 'Nháp' :
                    receipt.status === 'Confirmed' ? 'Sẵn sàng' :
                      receipt.status === 'PartiallyReceived' ? 'Một phần' :
                        receipt.status === 'Completed' ? 'Hoàn tất' :
                          receipt.status === 'Cancelled' ? 'Đã hủy' : receipt.status}
                </span>

              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-20 text-center">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không tìm thấy dữ liệu phù hợp</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
