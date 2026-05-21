namespace Inventory.Application.DTOs;

public class CreateTransferOrderItemDto
{
    public int ProductId { get; set; }
    public decimal RequestedQty { get; set; }
}
