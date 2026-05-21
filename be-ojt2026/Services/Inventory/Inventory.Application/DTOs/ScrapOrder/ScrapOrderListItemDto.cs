namespace Inventory.Application.DTOs.ScrapOrder;

public class ScrapOrderListItemDto
{
    public int Id { get; set; }
    public string ScrapNo { get; set; } = null!;
    public int WarehouseId { get; set; }
    public string? WarehouseName { get; set; }
    public int LocationId { get; set; }
    public string? LocationName { get; set; }
    public int? ToLocationId { get; set; }
    public string? ToLocationName { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CreatedByName { get; set; }
}
