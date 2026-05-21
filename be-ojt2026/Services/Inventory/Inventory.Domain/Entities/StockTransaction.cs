using System;

namespace Inventory.Domain.Entities;

public partial class StockTransaction
{
    public int Id { get; set; }

    public int? DocumentId { get; set; }

    public int? ProductId { get; set; }

    public int? UomId { get; set; }

    public int? FromLocationId { get; set; }

    public int? ToLocationId { get; set; }

    public decimal? PlannedQty { get; set; }

    public decimal? ActualQty { get; set; }

    public decimal? ReservedQty { get; set; }

    public int? LotId { get; set; }

    public string? TransactionType { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? PlannedDate { get; set; }

    public virtual StockDocument? Document { get; set; }

    public virtual Location? FromLocation { get; set; }

    public virtual Product? Product { get; set; }

    public virtual Location? ToLocation { get; set; }

    public virtual Uom? Uom { get; set; }

    public virtual ProductLot? Lot { get; set; }
}
