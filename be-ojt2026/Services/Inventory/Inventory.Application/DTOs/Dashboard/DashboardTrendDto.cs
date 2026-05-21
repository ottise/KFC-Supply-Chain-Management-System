using System;
using System.Collections.Generic;

namespace Inventory.Application.DTOs.Dashboard
{
    public class DashboardTrendResponseDto
    {
        public List<InventoryTrendItemDto> Trend { get; set; } = new List<InventoryTrendItemDto>();
        public PendingSummaryDto Pending { get; set; } = new PendingSummaryDto();
        public NoDateSummaryDto NoDate { get; set; } = new NoDateSummaryDto();
    }

    public class InventoryTrendItemDto
    {
        public string Date { get; set; } = string.Empty;
        public string DayOfWeek { get; set; } = string.Empty;
        public int ReceiptCount { get; set; }
        public int SaleOrderCount { get; set; }
        public int ScrapOrderCount { get; set; }
        public int TransferOrderCount { get; set; }
        public int AdjustmentCount { get; set; } // Added AdjustmentCount
        public int TotalInbound { get; set; }
        public int TotalOutbound { get; set; }
    }

    public class PendingSummaryDto
    {
        public int Receipt { get; set; }
        public int SaleOrder { get; set; }
        public int ScrapOrder { get; set; }
        public int TransferOrder { get; set; }
        public int Adjustment { get; set; } // Added Adjustment
    }

    public class NoDateSummaryDto
    {
        public int Receipt { get; set; }
        public int SaleOrder { get; set; }
        public int ScrapOrder { get; set; }
        public int TransferOrder { get; set; }
        public int Adjustment { get; set; } // Added Adjustment
    }
}
