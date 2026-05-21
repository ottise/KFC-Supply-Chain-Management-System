namespace Inventory.Application.DTOs.ProductWarehouse;

public class ProductWarehouseDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int? CategoryId { get; set; }
    public int? BaseUomId { get; set; }
    public string BaseUomName { get; set; } = string.Empty;
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public int? CreatedById { get; set; }

    // Reordering Rule fields
    public decimal? MinQty { get; set; }
    public decimal? MaxQty { get; set; }
    public decimal? SalePrice { get; set; }
    public bool HasReorderingRule { get; set; }
}
