namespace Inventory.Application.DTOs;

public class LocationDto
{
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Type { get; set; }
    public int? ParentId { get; set; }
    public int? WarehouseId { get; set; }
    public bool IsActive { get; set; }
}

