using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class InventoryAdjustment
{
    public int Id { get; set; }

    public string? AdjustmentNo { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }
    public int? AssigneeId { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual ICollection<InventoryAdjustmentItem> InventoryAdjustmentItems { get; set; } = new List<InventoryAdjustmentItem>();
}
