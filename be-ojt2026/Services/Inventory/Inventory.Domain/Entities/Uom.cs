using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class Uom
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Category { get; set; }

    public decimal? ConversionRatio { get; set; }

    public bool? IsBaseUnit { get; set; }

    public virtual ICollection<Product> ProductBaseUoms { get; set; } = new List<Product>();

    public virtual ICollection<Product> ProductPurchaseUoms { get; set; } = new List<Product>();

    public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}
