using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class CreateDraftPurchaseOrderItemDto
    {
        public int ProductId { get; set; }
        public int LotId { get; set; }
        public string? LotName { get; set; }
        public decimal Quantity { get; set; }
        public DateTime ExpirationDate { get; set; }
    }
}
