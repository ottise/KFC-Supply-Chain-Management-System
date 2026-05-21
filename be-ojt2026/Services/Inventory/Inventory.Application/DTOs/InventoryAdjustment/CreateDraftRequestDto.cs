using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.InventoryAdjustment
{
    public class CreateDraftRequestDto
    {
        public int InventoryId { get; set; }
        public int AssigneeId { get; set; }  
        public DateTime PlanDate { get; set; }
    }


}
