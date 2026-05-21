using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs
{
    public class ConfirmInterWarehouseTransferDto
    {
        public int ToLocationId { get; set; }       
        public List<LotAssignmentDto> LotAssignments { get; set; } = new();
    }
}
