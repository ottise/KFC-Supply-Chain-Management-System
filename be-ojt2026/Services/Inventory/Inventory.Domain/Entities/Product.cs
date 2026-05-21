using System;

namespace Inventory.Domain.Entities;

public partial class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Code { get; set; } = null!;

    public string? ProductType { get; set; }

    public int BaseUomId { get; set; }

    public int? PurchaseUomId { get; set; }

    public int? CategoryId { get; set; }

    public decimal? SalePrice { get; set; }

    public decimal? StockPrice { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Uom BaseUom { get; set; } = null!;

    public virtual Category? Category { get; set; }

    public virtual ICollection<CurrentInventory> CurrentInventories { get; set; } = new List<CurrentInventory>();

    public virtual ICollection<InventoryAdjustmentItem> InventoryAdjustmentItems { get; set; } = new List<InventoryAdjustmentItem>();

    public virtual ICollection<ProductLot> ProductLots { get; set; } = new List<ProductLot>();

    public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();

    public virtual Uom? PurchaseUom { get; set; }

    public virtual ICollection<ProductWarehouse> ProductWarehouses { get; set; } = new List<ProductWarehouse>();

    public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}
