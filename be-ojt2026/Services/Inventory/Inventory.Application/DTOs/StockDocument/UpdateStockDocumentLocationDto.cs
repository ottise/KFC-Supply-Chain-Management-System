using System.ComponentModel.DataAnnotations;

namespace Inventory.Application.DTOs
{
    public class UpdateStockDocumentLocationDto
    {
        public int? FromLocationId { get; set; }
        public int? ToLocationId { get; set; }
    }
}
