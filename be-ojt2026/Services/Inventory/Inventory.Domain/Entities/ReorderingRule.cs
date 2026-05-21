using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class ReorderingRule
{
    public int Id { get; set; }

    public int? ProductWarehouseId { get; set; }

    public decimal? MinQty { get; set; }

    public decimal? MaxQty { get; set; }

    public string? TriggerType { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ProductWarehouse? ProductWarehouse { get; set; }
}
