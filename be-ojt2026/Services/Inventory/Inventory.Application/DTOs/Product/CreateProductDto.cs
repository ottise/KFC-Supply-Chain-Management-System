namespace Inventory.Application.DTOs;

public class CreateProductDto
{
    public string Name { get; set; } = null!;
    public string ProductType { get; set; } = null!;
    public int BaseUomId { get; set; }
    public int? PurchaseUomId { get; set; }
    public int? CategoryId { get; set; }
    public decimal SalePrice { get; set; }
    public decimal StockPrice { get; set; }
}
