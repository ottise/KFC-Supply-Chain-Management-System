namespace Inventory.Application.DTOs;

public class SaleOrderStatusCountDto
{
    public int Draft { get; set; }
    public int Waiting { get; set; }
    public int Ready { get; set; }
    public int Done { get; set; }
    public int Cancelled { get; set; }
}
