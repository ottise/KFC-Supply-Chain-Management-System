using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class ProductLot
{
    public int Id { get; set; }

    public int? ProductId { get; set; }

    public string? LotNumber { get; set; }

    public DateTime? ExpirationDate { get; set; }

    public virtual ICollection<CurrentInventory> CurrentInventories { get; set; } = new List<CurrentInventory>();

    public virtual ICollection<InventoryAdjustmentItem> InventoryAdjustmentItems { get; set; } = new List<InventoryAdjustmentItem>();

    public virtual Product? Product { get; set; }
}
