"use client";
import React from 'react';
import type { User } from '@/types/user';
import { formatPhoneNumber } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSpinner';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface AssignedStaffListProps {
  manager: User | null;
  staffList: User[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onUnassign: (staffId: number) => void;
  onBulkUnassign: (staffIds: number[]) => void;
  onOpenAssignModal: () => void;
}

const AssignedStaffList: React.FC<AssignedStaffListProps> = ({
  manager,
  staffList,
  isLoading,
  searchQuery,
  onSearchChange,
  onUnassign,
  onBulkUnassign,
  onOpenAssignModal
}) => {
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [confirmState, setConfirmState] = React.useState<{
    isOpen: boolean;
    type: 'single' | 'bulk' | null;
    staffId?: number;
    staffName?: string;
  }>({
    isOpen: false,
    type: null,
  });

  React.useEffect(() => {
    setSelectedIds([]);
  }, [manager?.Id, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(staffList.map(s => s.Id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  const executeUnassign = () => {
    if (confirmState.type === 'bulk') {
      onBulkUnassign(selectedIds);
      setSelectedIds([]);
    } else if (confirmState.type === 'single' && confirmState.staffId) {
      onUnassign(confirmState.staffId);
      setSelectedIds(prev => prev.filter(x => x !== confirmState.staffId));
    }
    setConfirmState({ isOpen: false, type: null });
  };

  if (!manager) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-gray-900 font-bold mb-1">Chưa chọn Quản lý</h3>
        <p className="text-gray-500 text-sm text-center">Vui lòng chọn một quản lý từ danh sách bên trái để xem nhân viên trực thuộc.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-col justify-between items-start gap-4">
        <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              Nhân Viên Của {manager.Fullname}
              <span className="bg-red-50 text-[#E4002B] text-xs px-2 py-0.5 rounded-full border border-red-100">
                {staffList.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Quản lý việc phân bổ nhân viên cho {manager.Email}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={() => setConfirmState({ isOpen: true, type: 'bulk' })}
                className="px-4 py-2.5 bg-red-50 text-[#E4002B] font-bold rounded-xl text-xs uppercase shadow-sm hover:bg-red-100 border border-red-200 transition-all flex items-center gap-2 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Xóa {selectedIds.length} Đã Chọn
              </button>
            )}
            <button
              onClick={onOpenAssignModal}
              className="px-4 py-2.5 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase shadow-sm hover:bg-[#B8001F] transition-all flex items-center gap-2 shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Thêm Nhân Viên
            </button>
          </div>
        </div>

        {/* Search Input for Staff */}
        <div className="relative w-full sm:max-w-md">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E4002B]/20 focus:border-[#E4002B] transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={3} />
          </div>
        ) : staffList.length === 0 ? (
          <div className="p-8 h-full flex items-center justify-center">
            <EmptyState
              type="accounts"
              title="Chưa có nhân viên nào"
              description={`Quản lý ${manager.Fullname} hiện chưa được phân công quản lý nhân viên nào.`}
              action={{
                label: '+ Thêm Nhân Viên',
                onClick: onOpenAssignModal
              }}
            />
          </div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap w-[5%]">
                  <input
                    type="checkbox"
                    checked={staffList.length > 0 && selectedIds.length === staffList.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#E4002B] bg-gray-100 border-gray-300 rounded focus:ring-[#E4002B] focus:ring-2 cursor-pointer transition-colors"
                  />
                </th>
                <th className="px-6 py-4 whitespace-nowrap w-[20%]">NHÂN VIÊN</th>
                <th className="px-6 py-4 whitespace-nowrap w-[25%] hidden md:table-cell">EMAIL</th>
                <th className="px-6 py-4 whitespace-nowrap w-[15%] text-center">XÁC THỰC</th>
                <th className="px-6 py-4 whitespace-nowrap w-[15%] text-center">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staffList.map((staff) => (
                <tr key={staff.Id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.includes(staff.Id) ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-5">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(staff.Id)}
                      onChange={(e) => handleSelectOne(staff.Id, e.target.checked)}
                      className="w-4 h-4 text-[#E4002B] bg-gray-100 border-gray-300 rounded focus:ring-[#E4002B] focus:ring-2 cursor-pointer transition-colors"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-gray-900 text-sm">{staff.Fullname}</span>
                      <span className="text-[10px] text-gray-400">#{staff.Id}</span>
                      <span className="text-[11px] text-gray-500 md:hidden mt-0.5">{staff.Email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="font-medium text-gray-600">{staff.Email}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {staff.IsActiveEmail === true ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full whitespace-nowrap">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Đã Xác Nhận
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full whitespace-nowrap">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1 8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Chưa Xác Nhận
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {!staff.IsActiveEmail ? (
                      <span className="text-gray-400 text-xs font-medium">—</span>
                    ) : staff.Status === 'Active' ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                        <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Hoạt Động</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400 shadow-[0_0_8px_rgba(156,163,175,0.4)]"></span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Đã Khóa</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title="Xác Nhận Xóa Phân Công"
        message={
          confirmState.type === 'bulk'
            ? `Bạn có chắc chắn muốn gỡ ${selectedIds.length} nhân viên đã chọn khỏi sự quản lý của ${manager.Fullname}? Hành động này có thể hoàn tác sau bằng việc thêm lại.`
            : `Bạn có chắc chắn muốn gỡ nhân viên ${confirmState.staffName} khỏi quản lý này?`
        }
        confirmText="Xóa Quyền"
        cancelText="Hủy"
        onConfirm={executeUnassign}
        onCancel={() => setConfirmState({ ...confirmState, isOpen: false })}
      />
    </div>
  );
};

export default AssignedStaffList;
