namespace Inventory.Application.DTOs;

public class CreateLocationDto
{
    public string Name { get; set; } = null!;
    public string Type { get; set; } = null!;
    public int WarehouseId { get; set; }
    public int? ParentId { get; set; }
}
