using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.InventoryAdjustment
{
    public class ManagerInventoryResponseDto
    {
        public int InventoryId { get; set; }
        public int ProductId { get; set; }
        public decimal SystemQty { get; set; }
        public decimal? CountQty { get; set; }      
        public decimal? DifferenceQty { get; set; }
        public int? AssigneeId { get; set; }   
        public DateTime? PlanDate { get; set; }    
        public string Status { get; set; }
        public int? TransactionId { get; set; }
    }
}
