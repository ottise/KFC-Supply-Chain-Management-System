namespace Inventory.Application.DTOs;

public class StockDocumentListItemDto
{
    public int Id { get; set; }
    public string? DocumentNo { get; set; }
    public string? DocumentType { get; set; }
    public string? Status { get; set; }
    public string? Origin { get; set; }
    public int? FromLocationId { get; set; }
    public string? FromLocationName { get; set; }
    public int? ToLocationId { get; set; }
    public string? ToLocationName { get; set; }
    public int? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
