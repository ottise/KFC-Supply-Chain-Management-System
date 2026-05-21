"use client";
import React, { memo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { Customer } from '@/types/customer';

// Lazy load modals for better bundle splitting
const CreateCustomerModal = dynamic(() => import('@/components/customer/CreateCustomerModal'), {
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>,
  ssr: false
});

const UpdateCustomerModal = dynamic(() => import('@/components/customer/UpdateCustomerModal'), {
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>,
  ssr: false
});

const CustomerDetailModal = dynamic(() => import('@/components/customer/CustomerDetailModal'), {
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>,
  ssr: false
});

const ConfirmDeleteModal = dynamic(() => import('@/components/customer/ConfirmDeleteModal'), {
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>,
  ssr: false
});

const ConfirmReactivateModal = dynamic(() => import('@/components/customer/ConfirmReactivateModal'), {
  loading: () => <div className="flex items-center justify-center p-8">Loading...</div>,
  ssr: false
});

interface CustomerModalsProps {
  showCreateModal: boolean;
  showUpdateModal: boolean;
  showDetailModal: boolean;
  showDeleteModal: boolean;
  showReactivateModal: boolean;
  selectedCustomer: Customer | null;
  customerToDelete: Customer | null;
  customerToReactivate: Customer | null;
  setShowCreateModal: (value: boolean) => void;
  setShowUpdateModal: (value: boolean) => void;
  setShowDetailModal: (value: boolean) => void;
  setShowDeleteModal: (value: boolean) => void;
  setShowReactivateModal: (value: boolean) => void;
  handleCreate: (data: any) => Promise<void>;
  handleUpdate: (id: number, data: any) => Promise<void>;
  handleDelete: () => Promise<void>;
  handleReactivate: () => Promise<void>;
  onStartEdit?: (customer: Customer) => void;
  openDeleteModal?: (id: number) => void;
}

export default memo(function CustomerModals(props: CustomerModalsProps) {
  return (
    <Suspense fallback={null}>
      <>
        {props.showCreateModal && (
          <CreateCustomerModal
            isOpen={props.showCreateModal}
            onClose={() => props.setShowCreateModal(false)}
            onCreate={props.handleCreate}
          ></CreateCustomerModal>
        )}

        {props.showUpdateModal && (
          <UpdateCustomerModal
            isOpen={props.showUpdateModal}
            onClose={() => props.setShowUpdateModal(false)}
            customer={props.selectedCustomer}
            onUpdate={props.handleUpdate}
            onDeleteRequest={props.openDeleteModal}
          ></UpdateCustomerModal>
        )}

        {props.showDetailModal && (
          <CustomerDetailModal
            isOpen={props.showDetailModal}
            onClose={() => props.setShowDetailModal(false)}
            customer={props.selectedCustomer}
            onStartEdit={props.onStartEdit}
          ></CustomerDetailModal>
        )}

        {props.showDeleteModal && (
          <ConfirmDeleteModal
            isOpen={props.showDeleteModal}
            onClose={() => props.setShowDeleteModal(false)}
            onConfirm={props.handleDelete}
            customerEmail={props.customerToDelete?.Email}
          ></ConfirmDeleteModal>
        )}

        {props.showReactivateModal && (
          <ConfirmReactivateModal
            isOpen={props.showReactivateModal}
            onClose={() => props.setShowReactivateModal(false)}
            onConfirm={props.handleReactivate}
            customerEmail={props.customerToReactivate?.Email}
          ></ConfirmReactivateModal>
        )}
      </>
    </Suspense>
  );
});
