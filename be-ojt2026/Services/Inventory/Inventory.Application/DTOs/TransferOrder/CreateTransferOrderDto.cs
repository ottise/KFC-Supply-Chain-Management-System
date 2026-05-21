namespace Inventory.Application.DTOs;

public class CreateTransferOrderDto
{
    public DateTime PlannedDate { get; set; }
    public int WarehouseId { get; set; }
    public int FromLocationId { get; set; }
    public int ToLocationId { get; set; }
    public string? Note { get; set; }
    public List<CreateTransferOrderItemDto> Items { get; set; } = new();
}
