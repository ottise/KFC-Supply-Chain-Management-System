import apiClient from "../../axios";

export interface DashboardTrendParams {
    startDate: string;
    endDate: string;
    managerId: number;
    warehouseId?: number;
}

export interface InventoryTrendItem {
    Date: string;
    DayOfWeek: string;
    ReceiptCount: number;
    SaleOrderCount: number;
    ScrapOrderCount: number;
    TransferOrderCount: number;
    AdjustmentCount: number;
    TotalInbound: number;
    TotalOutbound: number;
}

export interface DashboardTrendResponse {
    Trend: InventoryTrendItem[];
    Pending: {
        Receipt: number;
        SaleOrder: number;
        ScrapOrder: number;
        TransferOrder: number;
        Adjustment: number;
    };
    NoDate: {
        Receipt: number;
        SaleOrder: number;
        ScrapOrder: number;
        TransferOrder: number;
        Adjustment: number;
    };
}

export interface ProductTypePercentageDto {
    ProductType: string;
    Count: number;
    Percentage: number;
}

export interface WarehouseInventoryDto {
    WarehouseId: number;
    WarehouseName: string;
    TotalCount: number;
    ProductTypeBreakdown: ProductTypePercentageDto[];
}

export interface SummaryBreakdownDto {
    ProductType: string;
    TotalCount: number;
    Percentage: number;
}

export interface InventorySummaryDto {
    GrandTotalCount: number;
    TotalWarehouses: number;
    SummaryBreakdown: SummaryBreakdownDto[];
}

export interface ManagerInventoryDashboardResponse {
    Summary: InventorySummaryDto;
    Warehouses: WarehouseInventoryDto[];
}

const DASHBOARD_API_PREFIX = "/api/v1/inventory/dashboard";

export const dashboardApi = {
    getInventoryTrend: async (params: DashboardTrendParams): Promise<DashboardTrendResponse> => {
        const response = await apiClient.get<DashboardTrendResponse>(
            `${DASHBOARD_API_PREFIX}/trend`,
            { params }
        );
        return response.data;
    },

    getManagerWarehouseInventory: async (warehouseId?: number): Promise<ManagerInventoryDashboardResponse> => {
        const response = await apiClient.get<ManagerInventoryDashboardResponse>(
            `${DASHBOARD_API_PREFIX}/manager-warehouse-inventory`,
            { params: { warehouseId } }
        );
        return response.data;
    }
};