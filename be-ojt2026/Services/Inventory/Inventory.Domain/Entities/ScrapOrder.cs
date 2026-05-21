using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Inventory.Domain.Entities;

public partial class ScrapOrder
{
    public int Id { get; set; }
    public string ScrapNo { get; set; } = null!;
    public int WarehouseId { get; set; }
    public int LocationId { get; set; }
    public int? ToLocationId { get; set; }
    public string? Status { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    [JsonIgnore]
    public virtual ICollection<ScrapOrderItem> ScrapOrderItems { get; set; } = new List<ScrapOrderItem>();
    public virtual Warehouse Warehouse { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
    public virtual Location? ToLocation { get; set; }
}
