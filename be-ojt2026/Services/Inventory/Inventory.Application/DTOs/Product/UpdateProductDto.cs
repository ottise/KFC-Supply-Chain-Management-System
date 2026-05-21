namespace Inventory.Application.DTOs;

public class UpdateProductDto
{
    public string? Name { get; set; }
    public string? ProductType { get; set; }
    public int? BaseUomId { get; set; }
    public int? PurchaseUomId { get; set; }
    public int? CategoryId { get; set; }
    public decimal? SalePrice { get; set; }
    public decimal? StockPrice { get; set; }
    public bool? IsActive { get; set; }
}
