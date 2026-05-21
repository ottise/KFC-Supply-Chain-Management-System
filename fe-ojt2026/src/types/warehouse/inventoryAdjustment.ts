import React from "react";
import { Location } from "./locations";
import { Warehouse } from "./warehouse";
import { User } from "../user";
import { UserInfo } from "../auth";

export interface CreateVoucherRequest {
  Items: {
    InventoryId: number;
    CountedQty: number | null;
  }[];
  AssigneeId: number | null;
}

export interface CreateVoucherResponse {
  Message: string;
  InventoryIds: number[];
  Vouchers: VoucherItem[];
}

export interface VoucherItem {
  InventoryId: number;
  ProductId: number;
  TransactionId: number;
  SystemQty: number;
  CountQty: number;
  Different: number;
}

export interface CompleteAdjustmentList {
  InventoryId: number;
  Quantity: number;
  TransactionId: number;
}

export interface CompleteAdjustmentDto {
  Origin: string | null;
  CompleteAdjustmentLists: CompleteAdjustmentList[];
}

export interface CompleteVoucherResponse {
  Message: string;
  CompletedVouchers: CompletedVoucherItem[];
}

export interface CompletedVoucherItem {
  TransactionId: number;
  InventoryId: number;
  ProductId: number;
  SystemQty: number;
  CountQty: number;
  Different: number;
  CreatedAt: string;
  CompletedAt: string;
}

export interface InventoryItemResponse {
  Id: number;
  ProductId: number;
  Quantity: number;
  ReservedQuantity: number;
  LotId: number | null;
  Location: {
    Id: number;
    Name: string;
    WarehouseId: number;
  };
}

export interface EnrichedInventoryItem extends InventoryItemResponse {
  ProductName?: string;
  LotNumber?: string;
  CountedQty?: number | "";
  Difference?: number;
  AssignedUser: string;
  ScheduledDate: string;
  isManual?: boolean;
  TransactionId?: number;
  AssigneeId?: number;
  Status?: string;
}

export interface AdjustmentTransaction {
  TransactionId: number;
  InventoryId: number;
  ProductId: number;
  SystemQty: number;
  CountQty: number;
  Different: number;
  CreatedAt: string;
  CompletedAt: string;
  Status: string;
  AssigneeId: number;
  DocNo: string;
  warehouseCode: number;
}

export interface StaffWorkItem {
  InventoryId: number;
  WarehouseId: number;
  AssigneeId: number;
  ProductId: number;
  LocationId: number;
  LotId: number | null;
  TranId: number;
  PlanDate: string;
  SystemQty: number;
  CountQty: number | null;
  DifferenceQty: number | null;
  Status: string;
  LocationName?: string;
}

export interface UpdateCountRequest {
  TranId: number;
  CountQty: number;
}

export interface UseAdjustmentDataResult {
  items: EnrichedInventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<EnrichedInventoryItem[]>>;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  currentPage: number;
  setCurrentPage: (val: number) => void;
  loading: boolean;
  warehouses: Warehouse[];
  allLocations: Location[];
  employees: User[];
  selectedWarehouse: number | null;
  setSelectedWarehouse: (id: number | null) => void;
  selectedLocation: number | null;
  setSelectedLocation: (id: number | null) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  filteredItems: EnrichedInventoryItem[];
  paginatedItems: EnrichedInventoryItem[];
  totalPages: number;
  refreshItems: () => Promise<void>;
}

export interface UseAdjustmentActionsProps {
  items: EnrichedInventoryItem[];
  setItems: React.Dispatch<React.SetStateAction<EnrichedInventoryItem[]>>;
  currentUser: UserInfo | null;
  employees: User[];
  onSuccess: () => void;
}

export interface UseAdjustmentActionsResult {
  isApplying: boolean;
  setIsApplying: (val: boolean) => void;
  selectedIds: number[];
  setSelectedIds: (ids: number[]) => void;
  handleCountChange: (id: number, value: number | "") => void;
  handleAssigneeChange: (id: number, assigneeId: number) => void;
  handleProductChange: (id: number, name: string) => void;
  handleLotChange: (id: number, lot: string) => void;
  handleScheduleChange: (id: number, date: string) => void;
  handleClearRow: (id: number) => Promise<void>;
  handleSaveDraft: () => Promise<void>;
  handleConfirmAccept: () => Promise<void>;
  batchDate: string;
  setBatchDate: (val: string) => void;
  batchAssigneeId: number | null;
  setBatchAssigneeId: (val: number | null) => void;
}
