namespace Inventory.Application.DTOs;

public class UomDto
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Category { get; set; }

    public decimal? ConversionRatio { get; set; }

    public bool? IsBaseUnit { get; set; }
}