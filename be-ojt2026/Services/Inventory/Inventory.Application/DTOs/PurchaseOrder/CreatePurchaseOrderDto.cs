using Inventory.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class CreatePurchaseOrderDto
    {
        public int SupplierId { get; set; }
        public int ProductId { get; set; }
        public decimal OrderedQty { get; set; }
        public decimal ReceivedQty { get; set; }

        public decimal UnitPrice { get; set; }
    }
}

