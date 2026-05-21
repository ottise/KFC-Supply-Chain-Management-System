namespace Inventory.Application.DTOs;

public class TransferOrderListItemDto
{
    public int Id { get; set; }
    public string? TransferNo { get; set; }
    public int FromLocationId { get; set; }
    public string? FromLocationName { get; set; }
    public int ToLocationId { get; set; }
    public string? ToLocationName { get; set; }
    public string? Status { get; set; }
    public string? CreatedByName { get; set; }
    public string? Note { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? PlannedDate { get; set; }
}
