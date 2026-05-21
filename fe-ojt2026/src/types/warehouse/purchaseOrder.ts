import type { SupplierFromAPI } from "./partners";

export type PurchaseOrderStatus = "Draft" | "Confirmed" | "PartiallyReceived" | "Completed" | "Cancelled";

export interface PurchaseOrderItem {
  Id: number;
  PurchaseOrderId: number;
  ProductId: number;
  ProductName?: string;
  Quantity: number;
  ReceivedQty: number;
  UnitPrice: number;
  Subtotal: number;
  UomId?: number;
  UomName?: string;
  LotId?: number;
  LotNumber?: string;
}

export interface PurchaseOrder {
  Id: number;
  DocumentNo: string;
  SupplierId: number;
  SupplierName?: string;
  Status: PurchaseOrderStatus;
  TotalAmount: number;
  TotalQuantity: number;
  ItemCount: number;
  Notes?: string;
  CreatedAt: string;
  CreatedBy?: number;
  PlannedDate?: string;
  ConfirmedAt?: string;
  CompletedAt?: string;
  Origin?: string;
  ToLocationId?: number;
  ToLocationName?: string;
}

export interface PurchaseOrderListItem extends PurchaseOrder {
  Supplier?: SupplierFromAPI;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  Items: PurchaseOrderItem[];
}

export interface PurchaseOrderResponse {
  Items: PurchaseOrderListItem[];
  TotalItems: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export interface CreatePurchaseOrderRequest {
  SupplierId: number;
  PlannedDate?: string;
  Notes?: string;
  Items: {
    ProductId: number;
    Quantity: number;
    UnitPrice: number;
    UomId?: number;
  }[];
}

export interface PurchaseOrderSearchParams {
  search?: string;
  status?: string;
  supplierId?: number;
  fromDate?: string;
  toDate?: string;
  fromPlannedDate?: string;
  toPlannedDate?: string;
  page?: number;
  pageSize?: number;
  managerId?: number;
  createdById?: number;
}
