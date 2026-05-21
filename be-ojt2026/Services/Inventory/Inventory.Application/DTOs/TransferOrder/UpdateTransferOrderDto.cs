namespace Inventory.Application.DTOs;

public class UpdateTransferOrderDto
{
    public int? FromLocationId { get; set; }
    public int? ToLocationId { get; set; }
    public string? Note { get; set; }
    public DateTime? PlannedDate { get; set; }
}
