namespace Inventory.Application.DTOs;

public class UpdateStockDocumentDto
{
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public string? Origin { get; set; }
    public int? FromLocationId { get; set; }
    public int? ToLocationId { get; set; }
    public DateTime? PlannedDate { get; set; }
}
