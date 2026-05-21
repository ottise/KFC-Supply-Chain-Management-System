namespace Inventory.Application.DTOs;

public class StockTransactionDto
{
    public int Id { get; set; }
    public int? DocumentId { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int? UomId { get; set; }
    public string? UomName { get; set; }
    public int? FromLocationId { get; set; }
    public string? FromLocationName { get; set; }
    public int? ToLocationId { get; set; }
    public string? ToLocationName { get; set; }
    public decimal? PlannedQty { get; set; }
    public decimal? ActualQty { get; set; }
    public decimal? ReservedQty { get; set; }
    public int? LotId { get; set; }
    public string? LotName { get; set; }
    public string? TransactionType { get; set; }
    public string? Status { get; set; }
    public int? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? PlannedDate { get; set; }
}
