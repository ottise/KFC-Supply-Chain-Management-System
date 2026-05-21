"use client";

import type { Supplier } from "@/types/warehouse/partners";

export default function VendorTable({ 
  suppliers, 
  loading,
  onRowClick,
  onToggleStatus,
  currentPage = 1,
  pageSize = 10
}: { 
  suppliers: Supplier[], 
  loading: boolean,
  onRowClick: (s: Supplier) => void,
  onToggleStatus: (id: number, currentlyActive: boolean) => void,
  currentPage?: number,
  pageSize?: number
}) {
  return (
    <div className="w-full relative bg-white rounded-t-3xl">
      <table className="w-full text-sm border-separate border-spacing-0">
        <thead className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md shadow-sm">
          <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[6%]">STT</th>
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[20%]">Nhà cung ứng</th>
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[15%]">Liên hệ</th>
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[15%]">Email</th>
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[18%]">Địa chỉ</th>
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[14%]">Đại diện</th>
            <th className="px-6 py-3 text-left border-b border-gray-100 w-[12%]">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {suppliers.length > 0 ? suppliers.map((supplier, index) => (
            <tr 
              key={supplier.Id} 
              onClick={() => onRowClick(supplier)}
              className="hover:bg-red-50/40 cursor-pointer transition-all group"
            >
              {/* Cột STT */}
              <td className="px-6 py-2.5">
                <span className="text-sm font-bold text-gray-500">{(currentPage - 1) * pageSize + index + 1}</span>
              </td>

              {/* Cột Tên & Mã */}
              <td className="px-6 py-2.5">
                <p className="text-[13px] font-bold text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight uppercase">{supplier.Name}</p>
                {supplier.Code && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{supplier.Code}</p>}
              </td>

              {/* Cột Điện thoại */}
              <td className="px-6 py-2.5">
                <p className="text-[13px] font-semibold text-gray-700">{supplier.Phone}</p>
              </td>

              {/* Cột Email */}
              <td className="px-6 py-2.5">
                <p className="text-[13px] font-medium text-gray-600 truncate">{supplier.Email}</p>
              </td>

              {/* Cột Địa chỉ */}
              <td className="px-6 py-2.5 break-words max-w-[200px]">
                <p className="text-[13px] font-medium text-gray-700 leading-snug">{supplier.Address}</p>
              </td>

              {/* Cột Người đại diện */}
              <td className="px-6 py-2.5">
                <p className="text-[13px] font-semibold text-gray-700">{supplier.ContactPerson || '---'}</p>
              </td>

              {/* Cột Trạng thái */}
              <td className="px-6 py-2.5">
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(supplier.Id, supplier.IsActive);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:ring-offset-2 ${
                      supplier.IsActive ? 'bg-red-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className="sr-only">Toggle status</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        supplier.IsActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </td>
            </tr>
          )) : !loading ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm font-bold">
                Không có dữ liệu nhà cung ứng
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}