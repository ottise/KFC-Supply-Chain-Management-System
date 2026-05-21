using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.ReorderingRule
{
    public class ReOrderingRuleDto
    {
        public int Id { get; set; }

        public int? ProductWarehouseId { get; set; }

        public decimal? MinQty { get; set; }

        public decimal? MaxQty { get; set; }

        public string? TriggerType { get; set; }

        public bool? IsActive { get; set; }

        public DateTime? CreatedAt { get; set; }
    }
}
