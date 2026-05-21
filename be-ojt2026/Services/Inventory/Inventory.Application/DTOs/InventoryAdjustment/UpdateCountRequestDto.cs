using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.InventoryAdjustment
{
    public class UpdateCountRequestDto
    {
        public int TranId { get; set; }
        public decimal CountQty { get; set; }
    }

}