namespace Inventory.Application.DTOs.ScrapOrder;

public class ScrapOrderItemDto
{
    public int Id { get; set; }
    public int? ScrapOrderId { get; set; }
    public int? ProductId { get; set; }
    public decimal? Quantity { get; set; }
    public int? UomId { get; set; }
    public int? LotId { get; set; }
    public string? Reason { get; set; }
}
