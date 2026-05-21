"use client";
import { useState } from 'react';
import ScrapTable from './ScrapTable';
import ScrapFilter from './ScrapFilter';
import ScrapCreateForm from './ScrapCreateForm';
import ScrapDetail from './ScrapDetail';
import ScrapFail from './ScrapFail';
import StockPagination from '../stock-operations/StockPagination';
import { useScrapOrders } from '@/hooks/useScrap';
import type { ScrapOrderListItem, InventoryCheck, ScrapOrderDetail } from '@/types/warehouse/scrap';
import { FullScreenLoader } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastProvider';

export default function ScrapDashboard() {
  const {
    scrapOrders,
    loading,
    error,
    actionLoading,
    pagination,
    changePage,
    filterByStatus,
    search,
    getDetail,
    createScrapOrder,
    updateScrapOrder,
    checkAvailability,
    completeScrap,
    cancelScrap,
    deleteScrapOrder,
  } = useScrapOrders();

  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [selectedScrap, setSelectedScrap] = useState<ScrapOrderListItem | null>(null);
  const [editingScrap, setEditingScrap] = useState<ScrapOrderListItem | null>(null);
  const [editingScrapDetail, setEditingScrapDetail] = useState<ScrapOrderDetail | null>(null);
  const [failData, setFailData] = useState<InventoryCheck[]>([]);
  const [failMessage, setFailMessage] = useState<string | undefined>();

  // Fetch full detail for editing to populate form
  const handleEdit = async (scrap: ScrapOrderListItem) => {
    const detail = await getDetail(scrap.Id);
    if (detail) {
      setEditingScrap(scrap);
      setEditingScrapDetail(detail);
      setShowCreate(true);
      // Close detail modal so create form overlay takes precedence
      setSelectedScrap(null);
    }
  };

  return (
    <div className="space-y-6">
      <ScrapFilter
        onSearch={(v) => search(v)}
        onCreateClick={() => setShowCreate(true)}
        onStatusFilter={(status) => filterByStatus(status)}
      />

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-bold text-red-600">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden relative min-h-[420px] flex flex-col">
        {loading && <FullScreenLoader />}
        <ScrapTable scraps={scrapOrders} onSelect={setSelectedScrap} />
        <div className="mt-auto">
          <StockPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages || 1}
            totalItems={pagination.totalItems}
            onPageChange={changePage}
          />
        </div>
      </div>

      {showCreate && (
        <ScrapCreateForm
          initialData={editingScrapDetail}
          onClose={() => {
            // Nếu đang ở mode chỉnh sửa thì quay lại popup chi tiết thay vì về table
            if (editingScrap) {
              setSelectedScrap(editingScrap);
            }
            setShowCreate(false);
            setEditingScrap(null);
            setEditingScrapDetail(null);
          }}
          onSave={async (data) => {
            let res;
            if (editingScrap) {
              res = await updateScrapOrder(editingScrap.Id, data);
              if (res.success) {
                toast.success('Cập nhật thành công');
                setSelectedScrap(editingScrap);
              }
            } else {
              res = await createScrapOrder(data);
              if (res.success) {
                toast.success('Tạo thành công');
                if (res.createdScrap) {
                  setSelectedScrap(res.createdScrap);
                }
              }
            }

            if (!res.success) {
              setFailData(res.failData || []);
              setFailMessage(res.errorMessage);
              setShowFail(true);
            }
            return res;
          }}
          actionLoading={actionLoading}
        />
      )}

      {showFail && <ScrapFail inventoryData={failData} errorMessage={failMessage} onClose={() => setShowFail(false)} />}

      {selectedScrap && (
        <ScrapDetail
          scrap={selectedScrap}
          onClose={() => setSelectedScrap(null)}
          onGetDetail={getDetail}
          onCheckAvailability={async (id) => {
            const res = await checkAvailability(id);
            if (!res.success && res.failData) {
              setFailData(res.failData);
              setFailMessage(res.errorMessage);
              setShowFail(true);
            }
            return res;
          }}
          onComplete={completeScrap}
          onCancel={cancelScrap}
          onDelete={deleteScrapOrder}
          onEdit={handleEdit}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}