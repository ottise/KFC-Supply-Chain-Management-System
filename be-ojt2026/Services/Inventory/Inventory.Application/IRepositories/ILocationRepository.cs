using Inventory.Domain.Entities;

namespace Inventory.Application.IRepositories;

public interface ILocationRepository
{
    Task<IEnumerable<Location>> GetAllAsync();

    Task<IEnumerable<Location>> GetByWarehouseIdAsync(int warehouseId);

    Task<(IEnumerable<Location> Items, int TotalCount)> GetPaginatedAsync(int pageIndex, int pageSize, int? warehouseId = null, bool? isActive = null, string? search = null, bool? isParent = null, int? parentId = null, int? managerId = null);

    Task<Location?> GetByIdAsync(int id);

    Task AddRangeAsync(IEnumerable<Location> locations);

    Task UpdateAsync(Location location);

    Task SetActiveStatusAsync(Location location, bool isActive);

    Task DeleteAsync(Location location);
    Task<List<Location>> GetLocationByWarehouseIdAsync(int warehouseId);
}
