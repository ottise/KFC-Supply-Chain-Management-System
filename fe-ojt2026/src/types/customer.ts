// Types for Customer Management API

export interface Customer {
  Id: number;
  CustomerName: string;
  Email: string;
  Phone: string;
  Address: string | null;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string | null;
}

export interface CustomerResponse {
  Items: Customer[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export interface CreateCustomerRequest {
  email: string;
  name: string;
  phone: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateCustomerRequest {
  email: string;
  name: string;
  phone: string;
  address?: string;
  isActive?: boolean;
}

export interface GetCustomerParams {
  page?: number;
  pageSize?: number;
  isActive?: boolean;
  search?: string;
}
