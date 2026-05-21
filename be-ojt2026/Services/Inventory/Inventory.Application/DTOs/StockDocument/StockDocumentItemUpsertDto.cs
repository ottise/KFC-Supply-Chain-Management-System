namespace Inventory.Application.DTOs;

public class StockDocumentItemUpsertDto
{
    public int ProductId { get; set; }
    public int UomId { get; set; }
    public decimal PlannedQty { get; set; }
    public int? LotId { get; set; }
    public int? FromLocationId { get; set; }
    public int? ToLocationId { get; set; }
}
