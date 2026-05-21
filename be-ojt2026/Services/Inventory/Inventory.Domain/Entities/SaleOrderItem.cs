using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class SaleOrderItem
{
    public int Id { get; set; }

    public int SaleOrderId { get; set; }

    public int ProductId { get; set; }

    public decimal OrderedQty { get; set; }

    public decimal? ShippedQty { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual SaleOrder SaleOrder { get; set; } = null!;
}
