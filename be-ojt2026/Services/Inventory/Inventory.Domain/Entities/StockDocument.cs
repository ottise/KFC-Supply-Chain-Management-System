using System;
using System.Collections.Generic;

namespace Inventory.Domain.Entities;

public partial class StockDocument
{
    public int Id { get; set; }

    public string? DocumentNo { get; set; }

    public string? DocumentType { get; set; }

    public string? ReferenceType { get; set; }

    public int? ReferenceId { get; set; }

    public string? Origin { get; set; }

    public int? FromLocationId { get; set; }

    public int? ToLocationId { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual Location? FromLocation { get; set; }

    public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();

    public virtual Location? ToLocation { get; set; }
}
