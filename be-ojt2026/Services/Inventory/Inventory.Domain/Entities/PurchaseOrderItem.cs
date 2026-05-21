using System.Text.Json.Serialization;

namespace Inventory.Domain.Entities;

public partial class PurchaseOrderItem
{
    public int Id { get; set; }

    public int? PurchaseOrderId { get; set; }

    public int? ProductId { get; set; }

    public int? LotId { get; set; }

    public decimal? OrderedQty { get; set; }

    public decimal? ReceivedQty { get; set; }

    public decimal? UnitPrice { get; set; }

    public decimal? Subtotal { get; set; }

    [JsonIgnore]
    public virtual Product? Product { get; set; }

    [JsonIgnore]
    public virtual PurchaseOrder? PurchaseOrder { get; set; }

    public virtual ProductLot? Lot { get; set; }
}
