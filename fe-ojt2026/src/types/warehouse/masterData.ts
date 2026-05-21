// Types for master-data APIs: products, categories, and units of measure.

export interface Product {
  Id: number;
  Name: string;
  Code: string;
  ProductType: string;
  BaseUomId: number;
  BaseUomName: string;
  PurchaseUomId: number;
  PurchaseUomName?: string;
  CategoryId: number;
  CategoryName?: string;
  SalePrice: number;
  StockPrice: number;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ProductResponse {
  Items: Product[];
  Page: number;
  PageSize: number;
  TotalItems: number;
  TotalPages: number;
  HasNext: boolean;
  HasPrevious: boolean;
}

export interface UoM {
  id: number;
  name: string;
  symbol: string;
  ratio?: number;
}

export interface Uom {
  Id: number;
  Name: string;
  Symbol: string;
  Category: string;
  ConversionFactor: number;
  ConversionRatio: number;
  IsBaseUnit: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface Category {
  Id: number;
  Name: string;
  Description?: string;
  IsActive: boolean;
  CreatedAt: string;
}

export interface CreateProductRequest {
  Name: string;
  Code?: string;
  ProductType?: string;
  BaseUomId: number;
  PurchaseUomId?: number;
  CategoryId?: number;
  SalePrice?: number;
  StockPrice?: number;
  IsActive?: boolean;
}

export interface UpdateProductRequest {
  Id: number;
  Name?: string;
  ProductType?: string;
  BaseUomId?: number;
  PurchaseUomId?: number;
  CategoryId?: number;
  SalePrice?: number;
  StockPrice?: number;
  IsActive?: boolean;
}

export interface CheckCodeResponse {
  exists: boolean;
  message?: string;
}

export interface CalculatePriceRequest {
  StockPrice: number;
  MarkupPercentage: number;
  BaseUomId: number;
  PurchaseUomId?: number;
}

export interface CalculatePriceResponse {
  SuggestedSalePrice: number;
}

export interface ProductLotCode {
  Id: number;
  ProductId: number;
  LotNumber: string;
  ExpirationDate: string;
  Quantity: number;
}
