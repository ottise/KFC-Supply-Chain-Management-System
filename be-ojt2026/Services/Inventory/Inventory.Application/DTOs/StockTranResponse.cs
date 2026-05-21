using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs
{
    public class StockTranResponse
    {
        public int TransactionId { get; set; }
        public int InventoryId { get; set; }
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
    }
}
