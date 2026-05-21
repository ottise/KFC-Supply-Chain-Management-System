using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class InventoryAdjustmentItem
{
    public int Id { get; set; }

    public int? AdjustmentId { get; set; }

    public int? ProductId { get; set; }

    public int? LocationId { get; set; }

    public int? LotId { get; set; }

    public decimal? SystemQty { get; set; }

    public decimal? CountedQty { get; set; }

    public decimal? DifferenceQty { get; set; }

    public virtual InventoryAdjustment? Adjustment { get; set; }

    public virtual Location? Location { get; set; }

    public virtual ProductLot? Lot { get; set; }

    public virtual Product? Product { get; set; }
}
