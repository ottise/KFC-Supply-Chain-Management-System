namespace Inventory.Application.DTOs.ScrapOrder;

public class ScrapOrderDto
{
    public int Id { get; set; }
    public string ScrapNo { get; set; } = null!;
    public int WarehouseId { get; set; }
    public int LocationId { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<ScrapOrderItemDto> Items { get; set; } = new();
}
