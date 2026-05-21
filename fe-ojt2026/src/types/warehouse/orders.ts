// Types for order APIs: purchase, sale, transfer, and scrap.

export interface SaleOrder {
  id: number;
  orderNo: string;
  customerId: number;
  customerName: string;
  FromLocationId: number;
  ToLocationId: number;
  status: string;
  CreateAt: string;
  totalAmount: number;
}

export interface SaleOrderResponse {
  Items: any[]; // Hoặc dùng SaleOrderListItemDto[] nếu bạn đã có
  Page: number;
  TotalPages: number;
  TotalItems: number;
}

export {};
