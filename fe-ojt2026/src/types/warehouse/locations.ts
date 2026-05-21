export interface Location {
    Id: number;
    Code?: string;
    Name: string;
    Type: string;
    ParentId?: number | null;
    WarehouseId: number;
    IsActive: boolean;
}

export interface CreateLocationRequest {
    Name: string;
    Type: string;
    WarehouseId: number;
    ParentId?: number | null;
}

export interface UpdateLocationRequest extends CreateLocationRequest {
    Id: number;
    IsActive: boolean;
}