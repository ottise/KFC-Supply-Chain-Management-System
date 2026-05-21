"use client";
import React, { useCallback, memo, useMemo } from 'react';
import { Phone, MapPin, Users } from 'lucide-react';
import type { Customer } from '@/types/customer';
import { formatPhoneNumber } from '@/lib/utils';
import CustomerPagination from './CustomerPagination';

interface CustomerTableProps {
  customers: Customer[];
  onRowClick?: (customer: Customer) => void;
  currentPage?: number;
  itemsPerPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
}

// Memoized status badge component
const StatusBadge = memo(({ isActive }: { isActive: boolean }) => {
  if (isActive) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 border border-current rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-xs font-bold uppercase tracking-wide">
          Hoạt Động
        </span>
      </div>
    );
  } else {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 text-gray-600 border border-current rounded-full">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        <span className="text-xs font-bold uppercase tracking-wide">
          Ngừng
        </span>
      </div>
    );
  }
});

StatusBadge.displayName = 'StatusBadge';

// Memoized row component to prevent unnecessary re-renders
const CustomerRow = memo(({
  customer,
  onRowClick,
  onToggleStatus,
  index,
  stt
}: {
  customer: Customer;
  onRowClick?: (customer: Customer) => void;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
  index: number;
  stt: number;
}) => {
  const handleRowClick = useCallback(() => {
    onRowClick?.(customer);
  }, [customer, onRowClick]);

  return (
    <tr
      onClick={handleRowClick}
      className="hover:bg-red-50/50 transition-colors group [&_*]:cursor-pointer select-none cursor-pointer"
    >
      <td className="px-8 py-6 text-center align-middle">
        <span className="font-bold text-gray-400 group-hover:text-[#E4002B] transition-colors">
          {stt}
        </span>
      </td>
      <td className="px-8 py-6 align-middle">
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 group-hover:text-[#E4002B] transition-colors leading-tight truncate">
            {customer.CustomerName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500 font-medium truncate">
              {customer.Email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 align-middle">
        <span className="text-sm font-semibold text-gray-700">
          {formatPhoneNumber(customer.Phone)}
        </span>
      </td>
      <td className="px-8 py-6 align-middle">
        <span className="block text-sm font-medium text-gray-600 break-words whitespace-normal leading-relaxed max-w-[250px]">
          {customer.Address || '-'}
        </span>
      </td>
      <td className="px-8 py-6 text-center align-middle">
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus?.(customer.Id, customer.IsActive);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:ring-offset-2 ${
              customer.IsActive ? 'bg-red-500' : 'bg-gray-300'
            }`}
          >
            <span className="sr-only">Toggle status</span>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                customer.IsActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </td>
    </tr>
  );
});

CustomerRow.displayName = 'CustomerRow';

// Memoized empty state component
const EmptyState = memo(() => {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 text-base font-bold">
            Không có khách hàng nào
          </p>
          <p className="text-gray-400 text-sm">
            Thử thay đổi bộ lọc hoặc tạo khách hàng mới
          </p>
        </div>
      </td>
    </tr>
  );
});

EmptyState.displayName = 'EmptyState';

// Memoized table header component
const TableHeader = memo(() => {
  return (
    <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">
      <tr>
        <th className="px-8 py-5 text-center font-black text-gray-400 uppercase tracking-widest w-16">
          STT
        </th>
        <th className="px-8 py-5 text-left font-black text-gray-400 uppercase tracking-widest">
          KHÁCH HÀNG
        </th>
        <th className="px-8 py-5 text-left font-black text-gray-400 uppercase tracking-widest">
          ĐIỆN THOẠI
        </th>
        <th className="px-8 py-5 text-left font-black text-gray-400 uppercase tracking-widest">
          ĐỊA CHỈ
        </th>
        <th className="px-8 py-5 text-center font-black text-gray-400 uppercase tracking-widest">
          TRẠNG THÁI
        </th>
      </tr>
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onRowClick,
  currentPage = 1,
  itemsPerPage = 10,
  totalPages,
  totalItems,
  onPageChange,
  onToggleStatus
}) => {
  // Memoize empty check
  const isEmpty = useMemo(() => !customers || customers.length === 0, [customers]);

  // Memoize STT calculation
  const customerRows = useMemo(() => {
    return customers.map((customer, index) => {
      const stt = (currentPage - 1) * itemsPerPage + index + 1;
      return { customer, index, stt };
    });
  }, [customers, currentPage, itemsPerPage]);

  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] shadow-sm overflow-hidden w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse whitespace-nowrap" style={{ minWidth: '600px' }}>
          <TableHeader />
          <tbody className="divide-y divide-gray-50">
          {isEmpty ? (
            <EmptyState />
          ) : (
            customerRows.map(({ customer, index, stt }) => (
              <CustomerRow
                key={customer.Id}
                customer={customer}
                onRowClick={onRowClick}
                onToggleStatus={onToggleStatus}
                index={index}
                stt={stt}
              />
            ))
          )}
        </tbody>
        </table>
      </div>
      {totalPages !== undefined && onPageChange && (
        <CustomerPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={itemsPerPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default CustomerTable;
