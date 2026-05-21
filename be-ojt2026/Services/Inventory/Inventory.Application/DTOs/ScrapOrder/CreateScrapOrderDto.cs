namespace Inventory.Application.DTOs.ScrapOrder;

public class CreateScrapOrderDto
{
    public int WarehouseId { get; set; }
    public int LocationId { get; set; }
    public CreateScrapOrderItemDto Item { get; set; } = new();
}
