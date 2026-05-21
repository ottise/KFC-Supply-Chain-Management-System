using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.Customer
{
    public class UpdateCustomerRequest
    {
        public string? customerName { get; set; }
        public string? phone { get; set; }
        public string? email { get; set; }
        public string? address { get; set; }
    }
}
