using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class CompleteAdjustmentRequest
    {
        public int TransactionId { get; set; }   
        public decimal Quantity { get; set; }   
        public string Origin { get; set; } = string.Empty; 
    }
}

