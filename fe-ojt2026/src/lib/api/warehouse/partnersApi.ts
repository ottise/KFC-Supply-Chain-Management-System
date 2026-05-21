// Partners API group: customers, suppliers
import axios from "../../axios";
const API_PREFIX = "/api/v1/inventory";
export const partnersApi = {
  getCustomers: async (pageIndex = 1, pageSize = 100) => {
    const response = await axios.get(`${API_PREFIX}/Customers`, {
      params: { pageIndex, pageSize }
    });
    return response.data;
  }
};

export { supplierApi } from './supplierApi';
export type { GetSuppliersParams } from './supplierApi';
