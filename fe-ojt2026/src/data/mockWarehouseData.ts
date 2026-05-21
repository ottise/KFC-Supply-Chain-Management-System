// ============================================
// Mock Data for Warehouse Stock Operations
// ============================================

// Products
export interface MockProduct {
  id: number;
  code: string;
  name: string;
  category: string;
  uomIds: number[];
}

export const mockProducts: MockProduct[] = [
  { id: 1, code: 'SP001', name: 'Tuong Ca (Goi)', category: 'Gia vi', uomIds: [1, 2] },
  { id: 2, code: 'SP002', name: 'Dui Ga Ran', category: 'Thit', uomIds: [1, 3] },
  { id: 3, code: 'SP003', name: 'Khoai Tay Chien', category: 'Rau cu', uomIds: [1, 2] },
  { id: 4, code: 'SP004', name: 'Banh Mi Burger', category: 'Banh', uomIds: [1] },
  { id: 5, code: 'SP005', name: 'Salad Caesar', category: 'Rau', uomIds: [1] },
  { id: 6, code: 'SP006', name: 'Nuoc Ngot Lon', category: 'Do uong', uomIds: [1, 4] },
  { id: 7, code: 'SP007', name: 'Ga Nuong', category: 'Thit', uomIds: [1, 3] },
  { id: 8, code: 'SP008', name: 'Pho Mai Lat', category: 'Gia vi', uomIds: [1, 2] },
  { id: 9, code: 'SP009', name: 'Tom Chien', category: 'Hai san', uomIds: [1, 3] },
  { id: 10, code: 'SP010', name: 'Com Tron', category: 'Com', uomIds: [1, 5] },
];

// Units of Measure
export interface MockUoM {
  id: number;
  name: string;
  symbol: string;
  ratio?: number;
}

export const mockUoMs: MockUoM[] = [
  { id: 1, name: 'Goi', symbol: 'goi' },
  { id: 2, name: 'Thung', symbol: 'thung', ratio: 24 },
  { id: 3, name: 'Kg', symbol: 'kg' },
  { id: 4, name: 'Chai', symbol: 'chai' },
  { id: 5, name: 'Hop', symbol: 'hop', ratio: 10 },
];

// Product Lots
export interface MockProductLot {
  id: number;
  productId: number;
  lotNumber: string;
  expirationDate: string;
  quantity: number;
}

export const mockProductLots: MockProductLot[] = [
  { id: 1, productId: 1, lotNumber: 'LOT-202401', expirationDate: '2026-06-15', quantity: 500 },
  { id: 2, productId: 1, lotNumber: 'LOT-202402', expirationDate: '2026-08-20', quantity: 300 },
  { id: 3, productId: 2, lotNumber: 'LOT-202403', expirationDate: '2026-04-10', quantity: 200 },
  { id: 4, productId: 2, lotNumber: 'LOT-202404', expirationDate: '2026-05-25', quantity: 150 },
  { id: 5, productId: 3, lotNumber: 'LOT-202405', expirationDate: '2026-03-20', quantity: 400 },
  { id: 6, productId: 3, lotNumber: 'LOT-202406', expirationDate: '2026-07-15', quantity: 350 },
  { id: 7, productId: 4, lotNumber: 'LOT-202407', expirationDate: '2026-04-05', quantity: 100 },
  { id: 8, productId: 5, lotNumber: 'LOT-202408', expirationDate: '2026-03-18', quantity: 80 },
  { id: 9, productId: 6, lotNumber: 'LOT-202409', expirationDate: '2026-12-31', quantity: 600 },
  { id: 10, productId: 7, lotNumber: 'LOT-202410', expirationDate: '2026-05-30', quantity: 250 },
  { id: 11, productId: 8, lotNumber: 'LOT-202411', expirationDate: '2026-09-10', quantity: 180 },
  { id: 12, productId: 9, lotNumber: 'LOT-202412', expirationDate: '2026-04-20', quantity: 120 },
  { id: 13, productId: 10, lotNumber: 'LOT-202413', expirationDate: '2026-06-01', quantity: 300 },
];

// Warehouses/Locations
export interface MockLocation {
  id: number;
  code: string;
  name: string;
  type: string;
  address: string;
}

export const mockLocations: MockLocation[] = [
  { id: 1, code: 'WH001', name: 'Kho Chinh Ha Noi', type: 'warehouse', address: 'So 1 Nguyen Trai, Thanh Xuan, Ha Noi' },
  { id: 2, code: 'WH002', name: 'Kho Chi Nhanh HCM', type: 'warehouse', address: 'So 100 Nguyen Van Linh, Q7, Ho Chi Minh' },
  { id: 3, code: 'WH003', name: 'Kho Nguyen Lieu', type: 'internal', address: 'Khu B - Nha may Che Bien, Ha Noi' },
  { id: 4, code: 'WH004', name: 'Kho Thanh Pham', type: 'internal', address: 'Khu A - Nha may Che Bien, Ha Noi' },
  { id: 5, code: 'WH005', name: 'Kho Da Nang', type: 'warehouse', address: 'So 50 Tran Phu, Hai Chau, Da Nang' },
];

// Sale Orders
export interface MockSaleOrder {
  id: number;
  orderNo: string;
  customerId: number;
  customerName: string;
  status: string;
  orderDate: string;
  totalAmount: number;
}

export const mockSaleOrders: MockSaleOrder[] = [
  { id: 1, orderNo: 'SO-2024-001', customerId: 1, customerName: 'GrabFood', status: 'READY', orderDate: '2026-03-10', totalAmount: 15000000 },
  { id: 2, orderNo: 'SO-2024-002', customerId: 2, customerName: 'ShopeeFood', status: 'READY', orderDate: '2026-03-09', totalAmount: 22500000 },
  { id: 3, orderNo: 'SO-2024-003', customerId: 3, customerName: 'Baemin', status: 'READY', orderDate: '2026-03-08', totalAmount: 8500000 },
  { id: 4, orderNo: 'SO-2024-004', customerId: 1, customerName: 'GrabFood', status: 'WAITING', orderDate: '2026-03-11', totalAmount: 12000000 },
  { id: 5, orderNo: 'SO-2024-005', customerId: 4, customerName: 'GoFood', status: 'READY', orderDate: '2026-03-07', totalAmount: 18750000 },
];

// Customers
export interface MockCustomer {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
}

export const mockCustomers: MockCustomer[] = [
  { id: 1, name: 'GrabFood', phone: '0901234567', email: 'grab@example.com', address: 'Q1, HCM' },
  { id: 2, name: 'ShopeeFood', phone: '0902345678', email: 'shopee@example.com', address: 'Q3, HCM' },
  { id: 3, name: 'Baemin', phone: '0903456789', email: 'baemin@example.com', address: 'Binh Thanh, HCM' },
  { id: 4, name: 'GoFood', phone: '0904567890', email: 'go@example.com', address: 'Q7, HCM' },
];

// Carriers
export interface MockCarrier {
  id: number;
  name: string;
  phone: string;
}

export const mockCarriers: MockCarrier[] = [
  { id: 1, name: 'Giao Hang Tiet Kiem', phone: '19001234' },
  { id: 2, name: 'Giao Hang Nhanh', phone: '19005678' },
  { id: 3, name: 'Viettel Post', phone: '19009876' },
  { id: 4, name: 'Grab Express', phone: '19001233' },
  { id: 5, name: 'Ahamove', phone: '19005432' },
];

// Sale Order Lines (for populating transfer items from SO)
export interface MockSaleOrderLine {
  id: number;
  saleOrderId: number;
  productId: number;
  productName: string;
  quantity: number;
  uomId: number;
  uomName: string;
}

export const mockSaleOrderLines: MockSaleOrderLine[] = [
  // SO-2024-001
  { id: 1, saleOrderId: 1, productId: 1, productName: 'Tuong Ca (Goi)', quantity: 100, uomId: 1, uomName: 'Goi' },
  { id: 2, saleOrderId: 1, productId: 2, productName: 'Dui Ga Ran', quantity: 50, uomId: 3, uomName: 'Kg' },
  // SO-2024-002
  { id: 3, saleOrderId: 2, productId: 3, productName: 'Khoai Tay Chien', quantity: 200, uomId: 1, uomName: 'Goi' },
  { id: 4, saleOrderId: 2, productId: 6, productName: 'Nuoc Ngot Lon', quantity: 80, uomId: 4, uomName: 'Chai' },
  // SO-2024-003
  { id: 5, saleOrderId: 3, productId: 4, productName: 'Banh Mi Burger', quantity: 150, uomId: 1, uomName: 'Goi' },
  // SO-2024-004
  { id: 6, saleOrderId: 4, productId: 5, productName: 'Salad Caesar', quantity: 60, uomId: 1, uomName: 'Goi' },
  { id: 7, saleOrderId: 4, productId: 7, productName: 'Ga Nuong', quantity: 40, uomId: 3, uomName: 'Kg' },
  // SO-2024-005
  { id: 8, saleOrderId: 5, productId: 8, productName: 'Pho Mai Lat', quantity: 90, uomId: 1, uomName: 'Goi' },
  { id: 9, saleOrderId: 5, productId: 9, productName: 'Tom Chien', quantity: 30, uomId: 3, uomName: 'Kg' },
  { id: 10, saleOrderId: 5, productId: 10, productName: 'Com Tron', quantity: 120, uomId: 1, uomName: 'Goi' },
];

// Helper functions
export const getProductById = (id: number): MockProduct | undefined => {
  return mockProducts.find(p => p.id === id);
};

export const getLotsByProductId = (productId: number): MockProductLot[] => {
  return mockProductLots.filter(lot => lot.productId === productId);
};

export const getUoMsByProductId = (productId: number): MockUoM[] => {
  const product = getProductById(productId);
  if (!product) return [];
  return mockUoMs.filter(uom => product.uomIds.includes(uom.id));
};

export const getCustomerById = (id: number): MockCustomer | undefined => {
  return mockCustomers.find(c => c.id === id);
};

export const getSaleOrderLinesByOrderId = (saleOrderId: number): MockSaleOrderLine[] => {
  return mockSaleOrderLines.filter(line => line.saleOrderId === saleOrderId);
};

export const getLocationById = (id: number): MockLocation | undefined => {
  return mockLocations.find(loc => loc.id === id);
};

export const getCarrierById = (id: number): MockCarrier | undefined => {
  return mockCarriers.find(c => c.id === id);
};
