namespace Inventory.Application.DTOs;

public class SaleOrderItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal OrderedQty { get; set; }
    public decimal? ShippedQty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}
