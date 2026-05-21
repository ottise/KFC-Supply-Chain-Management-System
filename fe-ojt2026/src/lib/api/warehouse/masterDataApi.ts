import axios from "../../axios";
import type {
	Category,
	Uom,
} from "@/types/warehouse/masterData";

const WAREHOUSE_API_PREFIX = "/api/v1/inventory";

// Legacy/Shared Master data API group: categories, uom
// Specific modules (Products, ProductLots, Locations) have their own files.
export const masterDataApi = {
	getUoms: async (): Promise<Uom[]> => {
		const response = await axios.get<Uom[]>(`${WAREHOUSE_API_PREFIX}/Uoms/all`);
		return response.data;
	},

	getCategories: async (): Promise<Category[]> => {
		const response = await axios.get<Category[]>(`${WAREHOUSE_API_PREFIX}/categories`);
		return response.data;
	},

	checkProductCode: async (code: string): Promise<{ exists: boolean }> => {
		try {
			// Using the products endpoint as per productsApi.ts prefix
			const response = await axios.get(`${WAREHOUSE_API_PREFIX}/products/code/${code}`);
			return { exists: !!response.data };
		} catch (error: any) {
			if (error.response?.status === 404) {
				return { exists: false };
			}
			throw error;
		}
	},
};
