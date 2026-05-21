using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class CompleteAdjustmentListDto
    {
        public string Origin { get; set; } = string.Empty;
        public List<CompleteAdjustmentItemDto> Items { get; set; } = new();
    }

}
