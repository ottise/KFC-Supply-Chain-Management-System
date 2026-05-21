namespace Inventory.Application.DTOs;

public class TransferOrderItemDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string? ProductName { get; set; }
    public decimal? RequestedQty { get; set; }
    public decimal? TransferredQty { get; set; }
}
