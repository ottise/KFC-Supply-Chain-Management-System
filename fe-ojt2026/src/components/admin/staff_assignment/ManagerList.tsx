"use client";
import React from 'react';
import type { User } from '@/types/user';
import { Virtuoso } from 'react-virtuoso';

interface ManagerListProps {
  managers: User[];
  selectedManagerId: number | null;
  onSelectManager: (id: number) => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  managerStaffCounts: Record<number, number>;
  loadingStaffCounts: boolean;
}

const ManagerList: React.FC<ManagerListProps> = ({
  managers,
  selectedManagerId,
  onSelectManager,
  isLoading,
  searchQuery,
  onSearchChange,
  managerStaffCounts,
  loadingStaffCounts
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
            Danh Sách Quản Lý
          </h3>
          <p className="text-[10px] text-gray-500 font-medium tracking-wide mt-0.5">
            Chọn quản lý để xem nhân viên
          </p>
        </div>
        <div className="bg-white text-xs font-bold text-gray-500 px-2 py-1 rounded-lg border border-gray-200">
          {managers.length}
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
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
      
      <div className="flex-1 p-2">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : managers.length === 0 ? (
          <div className="text-center p-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-xs font-semibold">Chưa có quản lý nào</p>
          </div>
        ) : (
          <Virtuoso
            style={{ height: '100%' }}
            data={managers}
            itemContent={(_index, manager) => {
              const isSelected = manager.Id === selectedManagerId;
              return (
                <div className="pb-1">
                  <button
                    onClick={() => onSelectManager(manager.Id)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all border ${
                      isSelected 
                        ? 'bg-red-50 border-red-200 pointer-events-none' 
                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-[#E4002B]' : 'text-gray-900'}`}>
                        {manager.Fullname}
                        {loadingStaffCounts ? null : (() => {
                          const count = managerStaffCounts[manager.Id] || 0;
                          return count === 0 ? (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700'}`}>
                              0 nhân viên
                            </span>
                          ) : (
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isSelected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                              {count} nhân viên
                            </span>
                          );
                        })()}
                      </h4>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {manager.Email}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="shrink-0">
                        <svg className="w-5 h-5 text-[#E4002B]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              );
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ManagerList;
