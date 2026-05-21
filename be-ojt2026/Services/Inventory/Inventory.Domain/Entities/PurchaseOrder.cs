using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Inventory.Domain.Entities;

public partial class PurchaseOrder
{
    public int Id { get; set; }

    public int SupplierId { get; set; }

    public int? CreatedById { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public int? ToLocationId { get; set; }
    public DateTime? PlannedDate { get; set; }

    [JsonIgnore]
    public virtual ICollection<PurchaseOrderItem> PurchaseOrderItems { get; set; } = new List<PurchaseOrderItem>();

    public virtual Supplier Supplier { get; set; } = null!;

    public virtual Location? ToLocation { get; set; }
}
