using Inventory.Application.DTOs;
using Inventory.Domain.Entities;

namespace Inventory.Application.IServices;

public interface IWarehouseService
{
    Task<IEnumerable<WarehouseDto>> GetAllAsync();

    Task<PagedResultDto<WarehouseDto>> GetPaginatedAsync(int page, int pageSize, bool? isActive = null, string? search = null, int? managerId = null);

    Task<WarehouseDto?> GetByIdAsync(int id);

    Task<WarehouseDto> UpdateAsync(int id, CreateWarehouseDto dto);

    Task DeactivateAsync(int id);

    Task ActivateAsync(int id);

    Task<WarehouseDto> CreateAsync(CreateWarehouseDto dto);

    Task DeleteAsync(int id);
    Task<Warehouse?> GetWarehouseByManagerIdAsync(int managerId);
    Task<List<Warehouse>> GetWarehousesByManagerIdAsync(int managerId);
    Task<Warehouse> GetWarehouseByLocationIdAsync(int locationId);

}
