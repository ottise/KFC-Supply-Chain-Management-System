using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Domain.Common.Constants
{
    public enum PurchaseOrderStatus
    {
        Pending,
        Confirmed,
        Completed,
        PartiallyReceived,
        Draft,
        Cancelled
    }
}

