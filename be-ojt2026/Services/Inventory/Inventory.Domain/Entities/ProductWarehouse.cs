using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class ProductWarehouse
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int WarehouseId { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public int? CreatedById { get; set; }

    public virtual Product Product { get; set; } = null!;

    public virtual Warehouse Warehouse { get; set; } = null!;

    public virtual ICollection<ReorderingRule> ReorderingRules { get; set; } = new List<ReorderingRule>();
}
