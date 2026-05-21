using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Inventory.Application.DTOs.PurchaseOrder
{
    public class StockDocumentDto
    {
        public int Id { get; set; }

        public string? DocumentNo { get; set; }

        public string? DocumentType { get; set; }

        public string? ReferenceType { get; set; }

        public int? ReferenceId { get; set; }

        public string? Origin { get; set; }

        public int? FromLocationId { get; set; }

        public int? ToLocationId { get; set; }

        public string? Status { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? CompletedAt { get; set; }


    }
}
