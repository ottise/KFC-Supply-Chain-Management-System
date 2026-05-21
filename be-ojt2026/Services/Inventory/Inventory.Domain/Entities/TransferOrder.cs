using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class TransferOrder
{
    public int Id { get; set; }

    public string TransferNo { get; set; } = null!;

    public int FromLocationId { get; set; }

    public int ToLocationId { get; set; }

    public string? Status { get; set; }

    public int? CreatedById { get; set; }

    public string? CreatedByName { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual Location FromLocation { get; set; } = null!;

    public virtual ICollection<TransferOrderItem> TransferOrderItems { get; set; } = new List<TransferOrderItem>();

    public virtual Location ToLocation { get; set; } = null!;
}
