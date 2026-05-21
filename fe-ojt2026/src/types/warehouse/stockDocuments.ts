export interface StockDocumentListItem {
  Id: number;
  DocumentNo: string;
  DocumentType: string;
  Status: string;
  Origin: string;
  FromLocationId: number | null;
  FromLocationName: string | null;
  ToLocationId: number | null;
  ToLocationName: string | null;
  CreatedById?: number | null;
  CreatedByName?: string | null;
  CreatedAt: string;
  CompletedAt: string | null;
}

export interface StockDocumentItem {
  Id: number;
  ProductId: number | null;
  ProductName: string | null;
  UomId: number | null;
  UomName: string | null;
  FromLocationId: number | null;
  FromLocationName: string | null;
  ToLocationId: number | null;
  ToLocationName: string | null;
  LotId: number | null;
  LotNumber?: string | null;
  PlannedQty: number;
  ReservedQty: number;
  ActualQty: number;
  Status: string;
  PlannedDate: string | null;
}

export interface StockDocumentDetail {
  Id: number;
  DocumentNo: string;
  DocumentType: string;
  ReferenceType: string | null;
  ReferenceId: number | null;
  Origin: string | null;
  FromLocationId: number | null;
  FromLocationName: string | null;
  ToLocationId: number | null;
  ToLocationName: string | null;
  CreatedById?: number | null;
  CreatedByName?: string | null;
  Status: string;
  CreatedAt: string;
  CompletedAt: string | null;
  Items: StockDocumentItem[];
}

export interface PagedStockDocumentResult {
  Items: StockDocumentListItem[];
  TotalItems: number;
  Page: number;
  PageSize: number;
  TotalPages?: number;
}

import type { TransferStatus } from './transferOrders';
export type { TransferStatus } from './transferOrders';

export interface TransferItem {
  id: number;
  productId: number | null;
  productName: string;
  lotId: number | null;
  lotNumber: string;
  expirationDate: string | null;
  plannedQty: number;
  actualQty: number;
  unitPrice: number;
  uomId: number | null;
  unitName: string;
  availableQty: number;
}

export interface Transfer {
  id: number;
  code: string;
  documentType: "OUT" | "IN" | "TRANSFER";
  status: TransferStatus;
  referenceType: string;
  referenceId: number;
  saleOrderNo: string;
  fromLocationId: number | null;
  fromLocationName: string;
  toLocationId: number | null;
  destination: string;
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  date: string;
  completedAt: string | null;
  carrierId: number | null;
  carrierName: string;
  responsible: string;
  carrier: string;
  notes: string;
  items: TransferItem[];
}

export interface SimpleTransferItem {
  product: string;
  quantity: number;
  unit: string;
}

export interface SimpleTransfer {
  code: string;
  date: string;
  source: string;
  destination: string;
  responsible: string;
  status: string;
  items: SimpleTransferItem[];
}
