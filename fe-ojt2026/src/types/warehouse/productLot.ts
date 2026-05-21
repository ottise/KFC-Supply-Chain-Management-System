export interface LotLocation {
    LocationId: number;
    LocationName: string;
    Quantity: number;
}
export interface ProductLot {
    Id: number;
    ProductId: number | null;
    ProductName: string | null;
    ProductCode: string | null;
    LotNumber: string;
    ExpirationDate: string;
    Locations: LotLocation[];

}

export interface UpdateProductLotRequest {
    ProductId: number;
    LotNumber: string;
    ExpirationDate: string;
}