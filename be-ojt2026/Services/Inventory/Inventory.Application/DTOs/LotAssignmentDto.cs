using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs
{
    public class LotAssignmentDto
    {
        public int ProductId { get; set; }              
        public int? LotId { get; set; }    
    }
}
