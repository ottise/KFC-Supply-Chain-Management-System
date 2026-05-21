"use client";
import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
}) => {
  const safeCurrentPage = totalPages > 0
    ? Math.min(Math.max(Math.trunc(currentPage), 1), totalPages)
    : 1;

  // Generate page numbers to show with ellipsis for many pages
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if not too many
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let startPage = Math.max(2, safeCurrentPage - 1);
      let endPage = Math.min(totalPages - 1, safeCurrentPage + 1);

      // Adjust if we're at the beginning
      if (safeCurrentPage <= 2) {
        startPage = 2;
        endPage = 3;
      }

      // Adjust if we're at the end
      if (safeCurrentPage >= totalPages - 1) {
        startPage = totalPages - 2;
        endPage = totalPages - 1;
      }

      // Add ellipsis before range if needed
      if (startPage > 2) {
        pages.push('...');
      }

      // Add range pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis after range if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-100">
      <div className="text-xs font-semibold text-gray-400">
        Hiển thị <span className="text-gray-700">{totalItems > 0 ? ((safeCurrentPage - 1) * pageSize + 1) : 0}</span> -{' '}
        <span className="text-gray-700">{Math.min(safeCurrentPage * pageSize, totalItems)}</span> của{' '}
        <span className="text-gray-700">{totalItems}</span> sản phẩm
      </div>

      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={totalPages === 0 || safeCurrentPage === 1}
          className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 disabled:hover:bg-transparent text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`w-10 h-10 rounded-lg text-xs font-bold uppercase transition-all ${page === safeCurrentPage
                  ? 'bg-[#E4002B] text-white shadow-md shadow-red-100'
                  : page === '...'
                    ? 'text-gray-400 cursor-default'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === totalPages || totalPages === 0}
          className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 disabled:hover:bg-transparent text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
