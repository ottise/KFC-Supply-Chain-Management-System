namespace Inventory.Application.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? ProductType { get; set; }
    public int BaseUomId { get; set; }
    public string? BaseUomName { get; set; }
    public int? PurchaseUomId { get; set; }
    public string? PurchaseUomName { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? StockPrice { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
