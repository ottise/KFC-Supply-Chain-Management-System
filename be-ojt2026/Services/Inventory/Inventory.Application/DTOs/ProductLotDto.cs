namespace Inventory.Application.DTOs;

public class ProductLotDto
{
    public int Id { get; set; }
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public string? ProductCode { get; set; }
    public string? LotNumber { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public List<LotLocationDto> Locations { get; set; } = new();
}

public class LotLocationDto
{
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
}
