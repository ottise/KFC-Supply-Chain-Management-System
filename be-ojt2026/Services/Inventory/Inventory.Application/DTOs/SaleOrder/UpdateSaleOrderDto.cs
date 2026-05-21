namespace Inventory.Application.DTOs;

public class UpdateSaleOrderDto
{
    public int? CustomerId { get; set; }
    public int? LocationId { get; set; }
    public int? ToLocationId { get; set; }
    public string? Note { get; set; }
    public DateTime? PlannedDate { get; set; }
}
