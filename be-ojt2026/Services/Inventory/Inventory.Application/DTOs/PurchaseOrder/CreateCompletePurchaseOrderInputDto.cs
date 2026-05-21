using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class CreateCompletePurchaseOrderInputDto
    {
        public int SupplierId { get; set; }
        public DateTime PlannedDate { get; set; }
        public int DocId { get; set; }
        public int? ToLocationId { get; set; }
        public string origin { get; set; }

        public bool IsSplit { get; set; }     
        public List<CreateCompletedPurchaseOrderItemDto> Items { get; set; }
    }
}
