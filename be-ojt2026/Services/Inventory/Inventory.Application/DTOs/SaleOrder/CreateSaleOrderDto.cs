namespace Inventory.Application.DTOs;

public class CreateSaleOrderDto
{
    public DateTime PlannedDate { get; set; }
    public int CustomerId { get; set; }
    public int? LocationId { get; set; }
    public int? ToLocationId { get; set; }
    public string? Note { get; set; }
    public List<CreateSaleOrderItemDto> Items { get; set; } = new();
}
