// Types for inventory-control APIs: adjustments and reordering rules.

export interface ReplenishmentOrder {
  code: string;
  product: string;
  currentStock: number;
  minThreshold: number;
  orderQty: number;
  status: 'NEED_REPLENISH' | 'ORDERED' | 'COMPLETED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface InventoryItem {
  product: string;
  system: number;
  actual: number;
}

export interface Adjustment {
  code: string;
  warehouse: string;
  date: string;
  start: string;
  end: string;
  status: 'COMPLETED' | 'PROCESSING';
  items: InventoryItem[];
}

export interface AdjustmentRecord {
  id: number;
  product: string;
  change: number;
  reason: string;
  date: string;
}

export interface SimpleAdjustmentItem {
  product: string;
  system: number;
  actual: number;
}

export interface SimpleAdjustment {
  code: string;
  warehouse: string;
  date: string;
  start: string;
  end: string;
  status: string;
  items: SimpleAdjustmentItem[];
}
