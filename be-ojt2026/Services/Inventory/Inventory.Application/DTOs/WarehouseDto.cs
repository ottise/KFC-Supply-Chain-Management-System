using System;

namespace Inventory.Application.DTOs;

public class WarehouseDto
{
    public int Id { get; set; }
    public string WarehouseCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public int? ManagerId { get; set; }
    public string? WarehouseType { get; set; }
    public decimal? AreaSqm { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

