"use client";
import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/admin/AdminNavbar';
import AdminSidebar from '@/components/admin/AdminSidebar';
import ManagerList from '@/components/admin/staff_assignment/ManagerList';
import AssignedStaffList from '@/components/admin/staff_assignment/AssignedStaffList';
import AssignStaffModal from '@/components/admin/staff_assignment/AssignStaffModal';
import { useStaffAssignment } from '@/hooks/useStaffAssignment';
import { useSidebarContext } from '@/lib/contexts/SidebarContext';

export default function AdminStaffAssignment() {
  const { isCollapsed } = useSidebarContext();
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  
  const {
    managers,
    staffList,
    unassignedStaff,
    loadingManagers,
    loadingStaff,
    loadingUnassigned,
    isAssigning,
    fetchManagers,
    fetchStaffByManager,
    fetchUnassignedStaff,
    fetchAllStaffCounts,
    assignStaffToManager,
    unassignStaff,
    managerSearchQuery,
    setManagerSearchQuery,
    staffSearchQuery,
    setStaffSearchQuery,
    managerStaffCounts,
    loadingStaffCounts,
    bulkUnassignStaff
  } = useStaffAssignment();

  // Load managers on mount
  useEffect(() => {
    fetchManagers();
    fetchUnassignedStaff();
    fetchAllStaffCounts();
  }, [fetchManagers, fetchUnassignedStaff, fetchAllStaffCounts]);

  const handleSelectManager = (id: number) => {
    setSelectedManagerId(id);
    fetchStaffByManager(id);
  };

  const handleOpenAssignModal = () => {
    // Refresh unassigned list before opening
    fetchUnassignedStaff().then(() => {
      setShowAssignModal(true);
    });
  };

  const handleAssignStaff = async (staffIds: number[]) => {
    if (!selectedManagerId) return;
    await assignStaffToManager(staffIds, selectedManagerId);
  };

  const selectedManager = managers.find(m => m.Id === selectedManagerId) || null;

  return (
    <>
      <AdminNavbar />
      <AdminSidebar
        activePage="staff_assignment"
      />

      <main className={`flex-1 transition-all duration-500 pt-25 p-8 min-h-screen overflow-auto ${isCollapsed ? "ml-20" : "ml-64"}`}>
        <div className="w-full max-w-[1920px] mx-auto h-[calc(100vh-140px)] flex flex-col">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-[#1F2937] uppercase tracking-tight font-sans">
                PHÂN CÔNG <span className="text-[#E4002B]">NHÂN SỰ</span>
              </h2>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
                Quản lý đội ngũ nhân viên cho từng cấp quản lý
              </p>
            </div>
            {unassignedStaff.length > 0 && (
              <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Còn {unassignedStaff.length} nhân viên chưa được phân bổ
              </div>
            )}
          </div>

          {/* Two-Column Dashboard Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Column - Managers List (3/12) */}
            <div className="lg:col-span-3 lg:col-start-1 h-full min-h-0">
              <ManagerList 
                managers={managers} 
                selectedManagerId={selectedManagerId} 
                onSelectManager={handleSelectManager}
                isLoading={loadingManagers}
                searchQuery={managerSearchQuery}
                onSearchChange={setManagerSearchQuery}
                managerStaffCounts={managerStaffCounts}
                loadingStaffCounts={loadingStaffCounts}
              />
            </div>

            {/* Right Column - Assigned Staff (9/12) */}
            <div className="lg:col-span-9 h-[500px] lg:h-full min-h-0">
              <AssignedStaffList 
                manager={selectedManager}
                staffList={staffList}
                isLoading={loadingStaff}
                searchQuery={staffSearchQuery}
                onSearchChange={setStaffSearchQuery}
                onUnassign={(staffId) => unassignStaff(staffId, selectedManagerId!)}
                onBulkUnassign={(staffIds) => bulkUnassignStaff(staffIds, selectedManagerId!)}
                onOpenAssignModal={handleOpenAssignModal}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showAssignModal && selectedManager && (
        <AssignStaffModal
          managerName={selectedManager.Fullname}
          unassignedStaff={unassignedStaff}
          isLoading={loadingUnassigned}
          isSaving={isAssigning}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssignStaff}
        />
      )}
    </>
  );
}
