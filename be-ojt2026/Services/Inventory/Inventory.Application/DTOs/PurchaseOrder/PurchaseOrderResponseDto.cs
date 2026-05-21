namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class PurchaseOrderResponseDto
    {
        public int Id { get; set; }
        public int DocId { get; set; }
        public string? DocumentNo { get; set; }     // stock_document.document_no
        public string? Origin { get; set; }          // stock_document.origin
        public int SupplierId { get; set; }
        public string? SupplierName { get; set; }   // Chuyển từ supplierId
        public int? ToLocationId { get; set; }
        public string? ToLocationName { get; set; } // Chuyển từ to_location_id
        public string? Status { get; set; }          // Status của PO
        public DateTime? CreatedAt { get; set; }
        public DateTime? ConfirmedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int ItemCount { get; set; }
        public decimal TotalQuantity { get; set; }
        public DateTime? PlannedDate { get; set; }
    }
}
