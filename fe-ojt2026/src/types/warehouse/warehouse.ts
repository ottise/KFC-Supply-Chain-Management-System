// Types for warehouse structure APIs.

export interface Location {
  Id: number;
  Code: string;
  Name: string;
  Type: string;
  Address?: string;
  WarehouseId: number;
  IsActive: boolean;
  ParentId?: number;
}

export interface Carrier {
  id: number;
  name: string;
  phone: string;
}

export interface Warehouse {
  Id: number;
  WarehouseCode: string;
  Name: string;
  Address: string | null;
  Phone: string | null;
  Email: string | null;
  ManagerId: number | null;
  WarehouseType: string | null;
  AreaSqm: number | null;
  IsActive: boolean;
  Notes: string | null;
  CreatedAt: string | null;
  UpdatedAt: string | null;
}
