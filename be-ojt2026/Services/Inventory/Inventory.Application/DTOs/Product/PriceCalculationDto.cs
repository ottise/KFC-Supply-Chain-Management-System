namespace Inventory.Application.DTOs;

public class PriceCalculationDto
{
    public decimal StockPrice { get; set; }
    public int BaseUomId { get; set; }
    public int? PurchaseUomId { get; set; }
    public decimal? MarkupPercentage { get; set; }
}

public class PriceCalculationResponseDto
{
    public decimal SuggestedSalePrice { get; set; }
}
