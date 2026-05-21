namespace Inventory.Application.DTOs.ReorderingRule;

public class ReorderingRuleWarningDto
{
    public int RuleId { get; set; }
    public int ProductWarehouseId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public decimal MinQty { get; set; }
    public decimal? MaxQty { get; set; }
    public decimal CurrentAvailableQty { get; set; }
    public string Message { get; set; } = string.Empty;
    public string BaseUomName { get; set; } = string.Empty;
}
