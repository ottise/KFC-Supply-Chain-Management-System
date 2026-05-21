using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class StockTransactionResponse
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public decimal PlannedQty { get; set; }
        public decimal? ActualQty { get; set; }
        public decimal? Different { get; set; }
        public string Status { get; set; } = string.Empty;
    }

}
