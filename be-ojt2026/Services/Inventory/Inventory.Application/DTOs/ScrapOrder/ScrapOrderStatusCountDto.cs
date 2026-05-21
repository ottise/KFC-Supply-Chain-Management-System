namespace Inventory.Application.DTOs.ScrapOrder;

public class ScrapOrderStatusCountDto
{
    public int Draft { get; set; }
    public int Ready { get; set; }
    public int Done { get; set; }
    public int Cancelled { get; set; }
}
