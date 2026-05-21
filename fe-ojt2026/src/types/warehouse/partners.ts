// Types for partner APIs: customers and suppliers.

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  address: string;
}

// API Response type (without IsActive)
export interface SupplierFromAPI {
  Id: number;
  Code?: string;
  Name: string;
  Email: string;
  Phone: string;
  Address: string;
  City?: string;
  Country?: string;
  ContactPerson?: string;
  TaxId?: string;
  IsActive?: boolean;
  DeletedAt?: string | null;
  CreatedAt?: string;
  UpdatedAt?: string;
}

// FE type (with IsActive for local filtering)
export interface Supplier extends SupplierFromAPI {
  IsActive: boolean;
}

export interface SupplierResponseFromAPI {
  Items: SupplierFromAPI[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export interface SupplierResponse {
  Items: Supplier[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export interface CreateSupplierRequest {
  Name: string;
  ContactPerson?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
}

export interface UpdateSupplierRequest {
  Name: string;
  ContactPerson?: string;
  Phone?: string;
  Email?: string;
  Address?: string;
}
