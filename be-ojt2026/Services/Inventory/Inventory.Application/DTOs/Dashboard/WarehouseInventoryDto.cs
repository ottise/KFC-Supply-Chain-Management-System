using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace Inventory.Application.DTOs.Dashboard
{
    public class ManagerInventoryDashboardDto
    {
        public InventorySummaryDto Summary { get; set; } = new InventorySummaryDto();
        public List<WarehouseInventoryDto> Warehouses { get; set; } = new List<WarehouseInventoryDto>();
    }

    public class InventorySummaryDto
    {
        public long GrandTotalCount { get; set; }
        public int TotalWarehouses { get; set; }
        public List<SummaryBreakdownDto> SummaryBreakdown { get; set; } = new List<SummaryBreakdownDto>();
    }

    public class SummaryBreakdownDto
    {
        public string ProductType { get; set; } = string.Empty;
        public long TotalCount { get; set; }
        public double Percentage { get; set; }
    }

    public class WarehouseInventoryDto
    {
        public int WarehouseId { get; set; }
        public string WarehouseName { get; set; } = string.Empty;
        public long TotalCount { get; set; }
        public List<ProductTypePercentageDto> ProductTypeBreakdown { get; set; } = new List<ProductTypePercentageDto>();
    }

    public class ProductTypePercentageDto
    {
        public string ProductType { get; set; } = string.Empty;
        public long Count { get; set; }
        public double Percentage { get; set; }
    }
}
