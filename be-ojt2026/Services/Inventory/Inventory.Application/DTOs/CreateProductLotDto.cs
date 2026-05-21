namespace Inventory.Application.DTOs;

public class CreateProductLotDto
{
    public int ProductId { get; set; }
    public string LotNumber { get; set; } = null!;
    public DateTime? ExpirationDate { get; set; }
}
