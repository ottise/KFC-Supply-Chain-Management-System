using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class Location
{
    public int Id { get; set; }

    public string? Name { get; set; }

    public string? Type { get; set; }

    public int? ParentId { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<CurrentInventory> CurrentInventories { get; set; } = new List<CurrentInventory>();

    public virtual ICollection<InventoryAdjustmentItem> InventoryAdjustmentItems { get; set; } = new List<InventoryAdjustmentItem>();

    public virtual ICollection<Location> InverseParent { get; set; } = new List<Location>();

    public virtual Location? Parent { get; set; }

    public virtual ICollection<StockDocument> StockDocumentFromLocations { get; set; } = new List<StockDocument>();

    public virtual ICollection<StockDocument> StockDocumentToLocations { get; set; } = new List<StockDocument>();

    public virtual ICollection<StockTransaction> StockTransactionFromLocations { get; set; } = new List<StockTransaction>();

    public virtual ICollection<StockTransaction> StockTransactionToLocations { get; set; } = new List<StockTransaction>();

    public int? WarehouseId { get; set; }

    public virtual Warehouse? Warehouse { get; set; }
}
