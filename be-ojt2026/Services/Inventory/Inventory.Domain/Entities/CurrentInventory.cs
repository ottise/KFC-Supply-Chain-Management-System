using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class CurrentInventory
{
    public int Id { get; set; }

    public int? ProductId { get; set; }

    public int? LocationId { get; set; }

    public int? LotId { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? ReservedQuantity { get; set; }

    public virtual Location? Location { get; set; }

    public virtual ProductLot? Lot { get; set; }

    public virtual Product? Product { get; set; }
}
