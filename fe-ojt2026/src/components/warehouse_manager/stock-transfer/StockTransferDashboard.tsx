"use client";

import { useState, useEffect } from "react";
import { useAuthContext } from "@/lib/contexts/AuthContext";
import TransferTable from "./TransferTable";
import EditTransferForm from "./EditTransferForm";
import CreateTransferForm from "./CreateTransferForm";
import TransferFilter from "./TransferFilter";
import TransferPagination from "./TransferPagination";
import { transferOrdersApi } from "@/lib/api/warehouse/transferOrdersApi";
import type { TransferOrderDetail, TransferOrderListItem } from "@/types/warehouse/transferOrders";


export default function StockTransferDashboard() {
  const { user } = useAuthContext();
  const [transfers, setTransfers] = useState<TransferOrderListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [selectedTransfer, setSelectedTransfer] = useState<TransferOrderDetail | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // const [transfers, setTransfers] = useState<Transfer[]>(mockInternalTransfers);

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        let finalItems: TransferOrderListItem[] = [];
        let totalItems = 0;
        let totalPages = 0;

        if (searchTerm) {
          // CALL BOTH IN PARALLEL
          const [resByCode, resByName] = await Promise.all([
            transferOrdersApi.getTransferOrders({
              status: statusFilter !== "all" ? statusFilter : undefined,
              transferNo: searchTerm,
              page: currentPage,
              pageSize: rowsPerPage,
              createdById: user?.id ? Number(user.id) : undefined,
            }),
            transferOrdersApi.getTransferOrders({
              status: statusFilter !== "all" ? statusFilter : undefined,
              locationName: searchTerm,
              page: currentPage,
              pageSize: rowsPerPage,
              createdById: user?.id ? Number(user.id) : undefined,
            })
          ]);

          // Merge & Deduplicate
          const merged = [...(resByCode.Items || []), ...(resByName.Items || [])];
          const uniqueMap = new Map<number, TransferOrderListItem>();
          merged.forEach(t => {
            if (!uniqueMap.has(t.Id)) uniqueMap.set(t.Id, t);
          });

          finalItems = Array.from(uniqueMap.values());
          totalItems = Math.max(resByCode.TotalItems || 0, resByName.TotalItems || 0); // Approximation
          totalPages = Math.max(resByCode.TotalPages || 0, resByName.TotalPages || 0);
        } else {
          const data = await transferOrdersApi.getTransferOrders({
            status: statusFilter !== "all" ? statusFilter : undefined,
            page: currentPage,
            pageSize: rowsPerPage,
            createdById: user?.id ? Number(user.id) : undefined,
          });
          finalItems = data.Items || [];
          totalItems = data.TotalItems;
          totalPages = data.TotalPages;
        }

        setTransfers(finalItems);
        setTotalItems(totalItems);
        setTotalPages(totalPages);
      } catch (error) {
        console.error("Lỗi fetch transfer orders:", error);
      }
    };
    fetchTransfers();
  }, [statusFilter, searchTerm, currentPage, refreshKey, user?.id]);
  const handleDateRangeFilter = (_from: string, _to: string) => {
    setCurrentPage(1); // Reset về trang 1 khi lọc
  };

  // Filter logic
  // const filteredTransfers = useMemo(() => {
  //   return transfers.filter((t) => {
  //     const matchesSearch =
  //       t.TransferNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       t.ToLocationName.toLowerCase().includes(searchTerm.toLowerCase());
  //     const matchesStatus = statusFilter === "all" || t.Status === statusFilter;
  //     const transferDate = new Date(t.CreatedAt).getTime();
  //     const matchesDateFrom = !dateFrom || transferDate >= new Date(dateFrom).getTime();
  //     const matchesDateTo = !dateTo || transferDate <= new Date(dateTo + "T23:59:59").getTime();
  //     return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  //   });
  // }, [transfers, searchTerm, statusFilter, dateFrom, dateTo]);

  // const totalPages = Math.ceil(filteredTransfers.length / rowsPerPage);
  // const currentItems = filteredTransfers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="space-y-6">
      <TransferFilter
        onSearch={setSearchTerm}
        onCreateClick={() => setShowCreate(true)}
        onStatusFilter={setStatusFilter}
        onDateChange={handleDateRangeFilter}
      />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">
        <TransferTable transfers={transfers} onSelect={async (item) => {
          const detail = await transferOrdersApi.getTransferById(item.Id);
          setSelectedTransfer(detail);
        }} />
        <div className="mt-auto">
          <TransferPagination
            currentPage={currentPage}
            totalPages={totalPages || 1}
            totalItems={totalItems}
            pageSize={rowsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {selectedTransfer && (
        <EditTransferForm
          transferId={selectedTransfer.Id}
          onClose={() => setSelectedTransfer(null)}
          onSave={() => setRefreshKey(prev => prev + 1)}
        />
      )}

      {showCreate && (
        <CreateTransferForm
          onClose={() => setShowCreate(false)}
          onSave={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
