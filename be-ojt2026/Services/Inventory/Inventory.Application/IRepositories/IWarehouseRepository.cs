using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface IWarehouseRepository
{
    Task<IEnumerable<Warehouse>> GetAllAsync();

    Task<(IEnumerable<Warehouse> Items, int TotalCount)> GetPaginatedAsync(int pageIndex, int pageSize, bool? isActive = null, string? search = null, int? managerId = null);

    Task<Warehouse?> GetByIdAsync(int id);

    Task<Warehouse?> GetByCodeAsync(string warehouseCode);
    Task<Warehouse?> GetByCodeWithLocationsAsync(string warehouseCode);

    Task<IEnumerable<Warehouse>> GetByManagerIdAsync(int managerId);

    Task UpdateAsync(Warehouse warehouse);

    Task SetActiveStatusAsync(Warehouse warehouse, bool isActive);

    Task AddAsync(Warehouse warehouse);

    Task DeleteAsync(Warehouse warehouse);
    Task<Warehouse?> GetWarehouseByManagerIdAsync(int managerId);
    Task<List<Warehouse>> GetWarehousesByManagerIdAsync(int managerId);
    Task<Warehouse?> GetWarehouseByLocationIdAsync(int locationId);
}
