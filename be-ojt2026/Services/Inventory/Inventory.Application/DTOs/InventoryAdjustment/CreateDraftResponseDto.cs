using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.InventoryAdjustment
{
    public class CreateDraftResponseDto
    {
        public int InventoryId { get; set; }
        public int WarehouseId { get; set; }
        public int AssigneeId { get; set; }
        public int ProductId { get; set; }
        public int LocationId { get; set; }
        public int? LotId { get; set; }
        public int TranId { get; set; }
        public DateTime PlanDate { get; set; }
        public decimal SystemQty { get; set; }
        public decimal? CountQty { get; set; }
        public decimal? DifferenceQty { get; set; }
        public string Status { get; set; }
    }


}
