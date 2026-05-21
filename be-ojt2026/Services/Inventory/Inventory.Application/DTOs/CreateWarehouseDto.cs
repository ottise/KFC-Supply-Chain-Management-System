using System;

namespace Inventory.Application.DTOs
{
    public class CreateWarehouseDto
    {
        public string WarehouseCode { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Address { get; set; }

        public string? Phone { get; set; }

        public string? Email { get; set; }

        public int? ManagerId { get; set; }

        public string? WarehouseType { get; set; }

        public decimal? AreaSqm { get; set; }

        public string? Notes { get; set; }

        public bool? IsActive { get; set; }
    }
}
