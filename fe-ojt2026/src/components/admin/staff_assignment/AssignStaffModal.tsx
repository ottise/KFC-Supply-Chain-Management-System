"use client";
import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { User } from '@/types/user';

interface AssignStaffModalProps {
  managerName: string;
  unassignedStaff: User[];
  isLoading: boolean;
  isSaving: boolean;
  onClose: () => void;
  onAssign: (staffIds: number[]) => Promise<void>;
}

const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  managerName,
  unassignedStaff,
  isLoading,
  isSaving,
  onClose,
  onAssign
}) => {
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = unassignedStaff.filter(staff =>
    staff.Fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectableStaff = filteredStaff.filter(s => s.IsActiveEmail);

  const toggleStaff = (id: number) => {
    const staff = unassignedStaff.find(s => s.Id === id);
    if (!staff || !staff.IsActiveEmail) return;

    const newPaths = new Set(selectedStaffIds);
    if (newPaths.has(id)) {
      newPaths.delete(id);
    } else {
      newPaths.add(id);
    }
    setSelectedStaffIds(newPaths);
  };

  const toggleAll = () => {
    if (selectableStaff.length === 0) return;

    if (selectedStaffIds.size === selectableStaff.length) {
      // Deselect all
      setSelectedStaffIds(new Set());
    } else {
      // Select all visible and verified
      const allVisibleIds = selectableStaff.map(s => s.Id);
      setSelectedStaffIds(new Set(allVisibleIds));
    }
  };

  const handleSave = async () => {
    if (selectedStaffIds.size === 0) return;
    await onAssign(Array.from(selectedStaffIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E4002B] to-[#B8001F] p-6 text-white relative flex shrink-0 items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Thêm Nhân Viên Vào Nhóm</h2>
            <p className="text-xs text-white/80 mt-1">
              Chọn các nhân viên chưa được phân công để gán vào quản lý <strong>{managerName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="absolute right-6 top-1/2 -translate-y-1/2 hover:rotate-90 transition-all p-2.5 bg-white/10 hover:bg-white/25 rounded-2xl border border-white/10"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-3 shrink-0">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white rounded-xl text-sm font-medium text-gray-800 border-gray-200 focus:border-red-300 focus:ring-2 focus:ring-red-50 outline-none transition-all shadow-sm"
            />
          </div>

          <button
            onClick={toggleAll}
            className="px-4 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-xs uppercase hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded flex items-center justify-center border ${selectedStaffIds.size === selectableStaff.length && selectableStaff.length > 0 ? 'bg-[#E4002B] border-[#E4002B]' : 'bg-white border-gray-300'}`}>
              {(selectedStaffIds.size === selectableStaff.length && selectableStaff.length > 0) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            Chọn Tất Cả
          </button>
        </div>

        {/* List content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <svg className="w-8 h-8 animate-spin text-gray-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V12a4 4 0 012 2h4a2 2 0 002 2h-4a2 2 0 016 2h-4"></path>
              </svg>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'Không tìm thấy nhân viên nào phù hợp' : 'Không có nhân viên nào chưa có quản lý'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStaff.map((staff) => {
                const isSelected = selectedStaffIds.has(staff.Id);
                const isSelectable = staff.IsActiveEmail;

                return (
                  <div
                    key={staff.Id}
                    onClick={() => isSelectable && toggleStaff(staff.Id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${!isSelectable
                      ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
                      : isSelected
                        ? 'border-[#E4002B] bg-red-50 shadow-sm cursor-pointer'
                        : 'border-gray-100 bg-white hover:border-red-200 hover:shadow-md cursor-pointer'
                      }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${isSelected ? 'bg-[#E4002B] border-[#E4002B]' : 'bg-white border-gray-300'
                      }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-[#E4002B]' : 'text-gray-900'}`}>
                          {staff.Fullname}
                        </p>
                        {staff.IsActiveEmail ? (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                            Đã xác nhận
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-gray-50 text-gray-400 border border-gray-100 rounded text-[9px] font-bold uppercase tracking-wider shrink-0">
                            Chưa xác nhận
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{staff.Email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 shrink-0 justify-between items-center">
          <div className="text-sm">
            <span className="text-gray-500">Đã chọn:</span> <strong className="text-gray-900 text-base">{selectedStaffIds.size}</strong> nhân viên
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={selectedStaffIds.size === 0 || isSaving}
              className="px-8 py-3.5 bg-[#E4002B] text-white font-bold rounded-xl text-xs uppercase tracking-wide shadow-lg shadow-red-200 hover:bg-[#B8001F] transition-all disabled:opacity-50 disabled:shadow-none disabled:bg-gray-300 disabled:text-gray-500 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V12a4 4 0 012 2h4a2 2 0 002 2h-4a2 2 0 016 2h-4"></path>
                  </svg>
                  Đang Gán...
                </>
              ) : (
                'Gán Nhân Viên'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStaffModal;
