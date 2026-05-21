import { inventoryAdjustmentApi } from './inventoryAdjustmentApi';

// Inventory control API group: inventory adjustments and reordering rules
export const inventoryControlApi = {
  adjustments: inventoryAdjustmentApi,
  reorderingRules: {
    // TODO: implement reordering rule endpoints
  },
};
