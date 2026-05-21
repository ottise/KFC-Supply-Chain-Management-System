using System;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class PurchaseOrderItemResponseDto
    {
        public int Id { get; set; } // StockTransaction.Id
        public int? PurchaseOrderItemId { get; set; }
        public int ProductId { get; set; }
        public string? ProductName { get; set; }
        public int? LotId { get; set; }
        public string? LotNumber { get; set; }
        public DateTime? ExpirationDate { get; set; }
        public decimal? PlannedQty { get; set; }
        public decimal? ActualQty { get; set; }
        public string? Unit { get; set; }
        public decimal? UnitPrice { get; set; }
        public DateTime? PlannedDate { get; set; }
        public string? Status { get; set; }
    }
}
