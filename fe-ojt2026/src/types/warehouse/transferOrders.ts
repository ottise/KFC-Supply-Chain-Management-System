// Request types
export type TransferStatus = "DRAFT" | "WAITING" | "READY" | "DONE" | "CANCELLED";

export interface CreateTransferOrderRequest {
    PlannedDate: string;
    WarehouseId: number;
    FromLocationId: number;
    ToLocationId: number;
    Note?: string;
    Items: { ProductId: number; RequestedQty: number; LotId?: number; UomId?: number }[];
}
export interface UpdateTransferOrderRequest {
    FromLocationId?: number;
    ToLocationId?: number;
    PlannedDate?: string;
    Note?: string;
}
export interface AddTransferItemRequest {
    ProductId: number;
    LotId: number;
    UomId: number;
    RequestedQty: number;
}
// Response types
export interface TransferOrderListItem {
    Id: number;
    TransferNo: string;
    FromLocationId: number;
    FromLocationName: string;
    ToLocationId: number;
    ToLocationName: string;
    Status: string;
    CreatedByName: string;
    Note: string;
    CreatedAt: string;
    PlannedDate: string | null;
    ConfirmedAt: string | null;
    CompletedAt: string | null;
}
export interface TransferOrderDetail extends TransferOrderListItem {
    Items: TransferOrderItem[];
}
export interface TransferOrderItem {
    Id: number;
    ProductId: number;
    ProductName: string;
    LotId: number;
    LotNumber: string;
    UomId: number;
    UomName: string;
    RequestedQty: number;
    Quantity: number;
    AvailableQuantity: number;
}
export interface TransferStatusCount {
    Draft: number;
    Waiting: number;
    Ready: number;
    Done: number;
    Cancelled: number;
}
export interface PagedTransferOrders {
    Items: TransferOrderListItem[];
    Page: number;
    PageSize: number;
    TotalPages: number;
    TotalItems: number;
}
export interface CheckAvailabilityResult {
    Status: string;
    Message: string;
}