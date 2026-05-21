using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs
{
    public class CreateInterWarehouseTransferDto
    {
        public int FromLocationId { get; set; }       
        public int ToWarehouseId { get; set; }        
        public int ToLocationId { get; set; }         
        public DateTime PlannedDate { get; set; }     
        public string? Note { get; set; }  
        public List<TransferOrderItemUpsertDto> Items { get; set; } = new();
    }
}
