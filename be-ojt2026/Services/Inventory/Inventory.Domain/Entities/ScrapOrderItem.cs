using System.Text.Json.Serialization;

namespace Inventory.Domain.Entities;

public partial class ScrapOrderItem
{
    public int Id { get; set; }

    public int? ScrapOrderId { get; set; }

    public int? ProductId { get; set; }

    public decimal? Quantity { get; set; }

    public int? UomId { get; set; }

    public int? LotId { get; set; }

    public string? Reason { get; set; }

    [JsonIgnore]
    public virtual ScrapOrder? ScrapOrder { get; set; }

    [JsonIgnore]
    public virtual Product? Product { get; set; }

    [JsonIgnore]
    public virtual Uom? Uom { get; set; }

    [JsonIgnore]
    public virtual ProductLot? Lot { get; set; }
}
