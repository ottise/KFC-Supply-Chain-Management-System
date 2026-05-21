namespace Inventory.Application.DTOs;

public class CreateUomDto
{
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public decimal ConversionRatio { get; set; }
}
