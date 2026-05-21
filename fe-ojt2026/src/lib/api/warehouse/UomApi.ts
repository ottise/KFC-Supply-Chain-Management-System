import axios from "@/lib/axios";

export interface Uom {
  Id?: number;
  Name: string;
  Category: string;
  ConversionRatio: number;
  IsBaseUnit?: boolean;
}

export const uomService = {
  getAll: async (): Promise<Uom[]> => {
    // Gọi: /api/v1/inventory/Uoms/all
    const { data } = await axios.get<Uom[]>('/api/v1/inventory/Uoms/all');
    return data;
  },

  create: async (uomData: Omit<Uom, 'Id'>): Promise<Uom> => {
    // Gọi: /api/v1/inventory/Uoms
    const { data } = await axios.post<Uom>('/api/v1/inventory/Uoms', uomData);
    return data;
  },

  updateUoms: async (id: number, uomData: Omit<Uom, 'Id'>): Promise<Uom> => {
    // Gọi: /api/v1/inventory/Uoms/{id}
    const { data } = await axios.put<Uom>(`/api/v1/inventory/Uoms/${id}`, uomData);
    return data;
  },

  updateUomsBaseUnit: async (id: number, uomData: { Name: string }): Promise<Uom> => {
    // URL: /api/v1/inventory/Uoms/{id}/base-unit
    // Body: { "Name": "Chà" }
    const { data } = await axios.put<Uom>(`/api/v1/inventory/Uoms/${id}/base-unit`, uomData);
    return data;
  },

  deleteUoms: async (id: number): Promise<void> => {
    // Gọi: /api/v1/inventory/Uoms/{id}
    await axios.delete(`/api/v1/inventory/Uoms/${id}`);
  },

  getUomById: async (id: number): Promise<Uom> => {
    const { data } = await axios.get<Uom>(`/api/v1/inventory/Uoms/${id}`);
    return data;
  }
};