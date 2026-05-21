namespace Inventory.Application.DTOs;

public class SaleOrderItemUpsertDto
{
    public int ProductId { get; set; }
    public decimal OrderedQty { get; set; }
    public decimal UnitPrice { get; set; }
}
