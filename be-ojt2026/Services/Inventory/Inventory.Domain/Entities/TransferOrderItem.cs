using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class TransferOrderItem
{
    public int Id { get; set; }

    public int TransferOrderId { get; set; }

    public int ProductId { get; set; }

    public decimal? RequestedQty { get; set; }

    public decimal? TransferredQty { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual TransferOrder TransferOrder { get; set; } = null!;
}
