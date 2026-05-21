using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.ReorderingRule
{
    public class UpdateReorderingRuleRequest
    {
        public decimal? MinQty { get; set; }
        public decimal? MaxQty { get; set; }
        public string? TriggerType { get; set; }
    }
}
