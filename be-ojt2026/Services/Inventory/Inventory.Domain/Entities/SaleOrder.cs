using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class SaleOrder
{
    public int Id { get; set; }

    public string OrderNo { get; set; } = null!;

    public int CustomerId { get; set; }

    public string? Status { get; set; }

    public decimal? TotalAmount { get; set; }

    public int? CreatedById { get; set; }

    public string? CreatedByName { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual Customer Customer { get; set; } = null!;

    public virtual ICollection<SaleOrderItem> SaleOrderItems { get; set; } = new List<SaleOrderItem>();
}
