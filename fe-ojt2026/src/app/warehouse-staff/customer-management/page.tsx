"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { customersApi } from '@/lib/api/warehouse/customersApi';
import type { Customer, GetCustomerParams, CreateCustomerRequest, UpdateCustomerRequest } from '@/types/customer';
import CustomerFilter from '@/components/customer/CustomerFilter';
import CustomerTable from '@/components/customer/CustomerTable';
import CustomerModals from '@/components/customer/CustomerModals';
import WarehouseStaffSidebar from '@/components/warehouse_staff/layout/WarehouseStaffSidebar';
import WarehouseStaffNavbar from '@/components/warehouse_staff/layout/WarehouseStaffNavbar';
import { FullScreenLoader } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/ToastProvider';
import { useSidebarContext } from '@/lib/contexts/SidebarContext';

type ApiError = {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const toApiError = (error: unknown): ApiError => {
  if (typeof error === 'object' && error !== null) {
    return error as ApiError;
  }
  return {};
};

export default function CustomerManagementPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isCollapsed } = useSidebarContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [filterParams, setFilterParams] = useState<GetCustomerParams>({});

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [customerToReactivate, setCustomerToReactivate] = useState<Customer | null>(null);

  const toast = useToast();

  // Memoized fetchCustomers to prevent recreation
  const fetchCustomers = useCallback(async (params?: GetCustomerParams) => {
    setLoading(true);
    try {
      const response = await customersApi.getCustomers(params);
      // Validate and set data
      setCustomers(response.Items || []);
      setPage(response.Page);
      setPageSize(response.PageSize);
      setTotalPages(response.TotalPages);
      setTotalItems(response.TotalItems);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized handleFilter
  const handleFilter = useCallback((filters: GetCustomerParams) => {
    setFilterParams(filters);
    setPage(1);
  }, []);

  // Memoized handleCreate
  const handleCreate = useCallback(async (data: CreateCustomerRequest) => {
    try {
      await customersApi.createCustomer(data);
      toast.success('Thành Công', 'Tạo khách hàng thành công');
      await fetchCustomers({ ...filterParams, page, pageSize });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      if (apiError.response?.status === 422) {
        toast.error('Lỗi', apiError.response.data?.message || 'Dữ liệu không hợp lệ');
      } else {
        toast.error('Lỗi', 'Không thể tạo khách hàng');
      }
      throw error;
    }
  }, [page, pageSize, filterParams, fetchCustomers, toast]);

  // Memoized handleReactivate
  const handleReactivate = useCallback(async () => {
    if (!customerToReactivate) return;

    try {
      await customersApi.reactivateCustomer(customerToReactivate.Id);
      toast.success('Thành Công', 'Kích hoạt khách hàng thành công');
      setShowReactivateModal(false);
      setCustomerToReactivate(null);
      await fetchCustomers({ ...filterParams, page, pageSize });
    } catch (error) {
      console.error('Error reactivating customer:', error);
      toast.error('Lỗi', 'Không thể kích hoạt khách hàng');
    }
  }, [customerToReactivate, page, pageSize, filterParams, fetchCustomers, toast]);

  // Memoized handleView
  const handleView = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  }, []);

  // Memoized handleStartEdit
  const handleStartEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(false);
    setShowUpdateModal(true);
  }, []);

  // Memoized handleUpdate
  const handleUpdate = useCallback(async (id: number, data: UpdateCustomerRequest) => {
    try {
      await customersApi.updateCustomer(id, data);
      toast.success('Thành Công', 'Cập nhật khách hàng thành công');
      setShowUpdateModal(false);
      await fetchCustomers({ ...filterParams, page, pageSize });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      if (apiError.response?.status === 422) {
        toast.error('Lỗi', apiError.response.data?.message || 'Dữ liệu không hợp lệ');
      } else {
        toast.error('Lỗi', 'Không thể cập nhật khách hàng');
      }
      throw error;
    }
  }, [page, pageSize, filterParams, fetchCustomers, toast]);

  // Memoized handleToggleStatus
  const handleToggleStatus = useCallback(async (id: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await customersApi.softDeleteCustomer(id);
        toast.success('Thành Công', 'Đã ngừng hoạt động khách hàng');
      } else {
        await customersApi.reactivateCustomer(id);
        toast.success('Thành Công', 'Đã kích hoạt khách hàng');
      }
      await fetchCustomers({ ...filterParams, page, pageSize });
    } catch (error: unknown) {
      const apiError = toApiError(error);
      toast.error('Lỗi', apiError.message || 'Không thể thay đổi trạng thái khách hàng');
    }
  }, [page, pageSize, filterParams, fetchCustomers, toast]);

  // Memoized handleDelete
  const handleDelete = useCallback(async () => {
    if (!customerToDelete) return;

    try {
      await customersApi.softDeleteCustomer(customerToDelete.Id);
      toast.success('Thành Công', 'Xóa khách hàng thành công');
      setShowDeleteModal(false);
      setCustomerToDelete(null);
      await fetchCustomers({ ...filterParams, page, pageSize });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Lỗi', 'Không thể xóa khách hàng');
    }
  }, [customerToDelete, page, pageSize, filterParams, fetchCustomers, toast]);



  // Memoized handleOpenCreateModal
  const handleOpenCreateModal = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  useEffect(() => {
    fetchCustomers({ ...filterParams, page, pageSize });
  }, [page, pageSize, filterParams, fetchCustomers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {loading && <FullScreenLoader />}
      <WarehouseStaffNavbar
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex">
        <WarehouseStaffSidebar
          activePage="customer-management"
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />

        <main className={`flex-1 mt-20 p-6 md:p-8 transition-all duration-500 ${isCollapsed ? "ml-20" : "ml-64"}`}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900">
            Quản Lý <span className='text-[#E4002B]'>Khách Hàng</span>
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#E4002B] rounded-full"></span>
            Quản lý thông tin khách hàng
          </p>
        </div>
        <CustomerFilter onFilter={handleFilter} onCreate={handleOpenCreateModal} />

        {/* Customer Table */}
        <div className="mt-8">
          <CustomerTable
            customers={customers}
            onRowClick={handleView}
            onToggleStatus={handleToggleStatus}
            currentPage={page}
            itemsPerPage={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(newPage) => {
              setPage(newPage);
            }}
          />
        </div>

        <CustomerModals
            showCreateModal={showCreateModal}
            showUpdateModal={showUpdateModal}
            showDetailModal={showDetailModal}
            showDeleteModal={showDeleteModal}
            showReactivateModal={showReactivateModal}
            selectedCustomer={selectedCustomer}
            customerToDelete={customerToDelete}
            customerToReactivate={customerToReactivate}
            setShowCreateModal={setShowCreateModal}
            setShowUpdateModal={setShowUpdateModal}
            setShowDetailModal={setShowDetailModal}
            setShowDeleteModal={setShowDeleteModal}
            setShowReactivateModal={setShowReactivateModal}
            handleCreate={handleCreate}
            handleUpdate={handleUpdate}
            handleDelete={handleDelete}
            handleReactivate={handleReactivate}
            onStartEdit={handleStartEdit}
          ></CustomerModals>
      </main>
      </div>
    </div>
  );
}
