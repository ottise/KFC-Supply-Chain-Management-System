namespace Inventory.Application.DTOs;

public class TransferOrderItemUpsertDto
{
    public int ProductId { get; set; }
    public decimal RequestedQty { get; set; }
}
