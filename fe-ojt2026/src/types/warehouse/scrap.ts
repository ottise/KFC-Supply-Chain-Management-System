// ===== Scrap Order Types (PascalCase to match .NET Backend DTOs) =====

export type ScrapStatus = 'draft' | 'ready' | 'done' | 'cancelled';

// Khớp ScrapOrderListItemDto
export interface ScrapOrderListItem {
  Id: number;
  ScrapNo: string;
  WarehouseId: number;
  WarehouseName?: string;
  LocationId: number;
  LocationName?: string;
  ToLocationId?: number | null;
  ToLocationName?: string | null;
  Status?: ScrapStatus;
  CreatedAt?: string;
  ConfirmedAt?: string | null;
  CompletedAt?: string | null;
  CreatedByName?: string;
}

// Khớp ScrapOrderItemDto
export interface ScrapOrderItem {
  Id: number;
  ScrapOrderId?: number;
  ProductId?: number;
  ProductCode?: string;
  ProductName?: string;
  Quantity?: number;
  UomId?: number;
  UomName?: string;
  LotId?: number;
  LotNumber?: string;
  Reason?: string;
}

// Khớp ScrapOrderDetailDto
export interface ScrapOrderDetail {
  Id: number;
  ScrapNo: string;
  WarehouseId: number;
  WarehouseName?: string;
  LocationId: number;
  LocationName?: string;
  ToLocationId?: number | null;
  ToLocationName?: string | null;
  Status?: ScrapStatus;
  CreatedAt?: string;
  ConfirmedAt?: string | null;
  CompletedAt?: string | null;
  CreatedById?: number;
  CreatedByName?: string;
  StockDocumentId?: number;
  Items: ScrapOrderItem[];
}

// Khớp CreateScrapOrderItemDto
export interface CreateScrapOrderItem {
  ProductId: number;
  Quantity: number;
  UomId: number;
  LotId: number;
  Reason?: string;
}

// Khớp CreateScrapOrderDto
export interface CreateScrapOrderRequest {
  WarehouseId: number;
  LocationId: number;
  Item: CreateScrapOrderItem;
}

// Khớp ScrapOrderStatusCountDto
export interface ScrapOrderStatusCount {
  Draft: number;
  Ready: number;
  Done: number;
  Cancelled: number;
}

// Khớp PagedResultDto
export interface PagedScrapResult {
  Items: ScrapOrderListItem[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

// Dùng cho ScrapFail popup
export interface InventoryCheck {
  location: string;
  lot: string;
  qty: number;
  uom: string;
  product?: string;
  requiredQty?: number;
}