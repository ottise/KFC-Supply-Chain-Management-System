import axios from "../../axios";

const INVENTORY_API_PREFIX = "/api/v1/inventory";
const PURCHASE_ORDER_ITEM_API_PREFIX = "/api/PurchaseOrderItem";

// Orders API group: purchase, sale, transfer, scrap
export const ordersApi = {
  updatePurchaseOrderItemReceivedQty: async (itemId: number, receivedQty: number): Promise<any> => {
    const response = await axios.put(`${PURCHASE_ORDER_ITEM_API_PREFIX}/${itemId}/receivedQty/${receivedQty}`);
    return response.data;
  }
};
