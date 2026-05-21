namespace Inventory.Application.DTOs;

public class StockDocumentStatusCountDto
{
    public int Pending { get; set; }
    public int Done { get; set; }
    public int Cancelled { get; set; }
}
