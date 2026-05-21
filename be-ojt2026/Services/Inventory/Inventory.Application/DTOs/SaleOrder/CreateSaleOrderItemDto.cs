namespace Inventory.Application.DTOs;

public class CreateSaleOrderItemDto
{
    public int ProductId { get; set; }
    public decimal OrderedQty { get; set; }
    public decimal UnitPrice { get; set; }
}
