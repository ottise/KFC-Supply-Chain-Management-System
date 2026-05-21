using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Inventory.Infrastructure.Repositories
{
    public class LocationRepository : ILocationRepository
    {
        private readonly InventoryDbContext _context;

        public LocationRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Location>> GetAllAsync()
        {
            return await _context.Locations.ToListAsync();
        }

        public async Task<IEnumerable<Location>> GetByWarehouseIdAsync(int warehouseId)
        {
            return await _context.Locations
                .Where(l => l.WarehouseId == warehouseId)
                .ToListAsync();
        }

        public async Task<(IEnumerable<Location> Items, int TotalCount)> GetPaginatedAsync(int pageIndex, int pageSize, int? warehouseId = null, bool? isActive = null, string? search = null, bool? isParent = null, int? parentId = null, int? managerId = null)
        {
            var query = _context.Locations.AsQueryable();
            if (warehouseId.HasValue)
            {
                query = query.Where(l => l.WarehouseId == warehouseId.Value);
            }

            if (managerId.HasValue)
            {
                var warehouseIdsByManager = _context.Warehouses
                    .Where(w => w.ManagerId == managerId.Value)
                    .Select(w => w.Id);
                query = query.Where(l => l.WarehouseId != null && warehouseIdsByManager.Contains(l.WarehouseId.Value));
            }

            if (isActive.HasValue)
            {
                query = query.Where(l => l.IsActive == isActive.Value);
            }

            if (isParent.HasValue)
            {
                query = isParent.Value
                    ? query.Where(l => l.ParentId == null)
                    : query.Where(l => l.ParentId != null);
            }

            if (parentId.HasValue)
            {
                query = query.Where(l => l.ParentId == parentId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim().ToLower();
                query = query.Where(l => l.Name != null && l.Name.ToLower().Contains(searchTerm));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(l => l.Id)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<Location?> GetByIdAsync(int id)
        {
            return await _context.Locations.FirstOrDefaultAsync(l => l.Id == id);
        }

        public async Task AddRangeAsync(IEnumerable<Location> locations)
        {
            await _context.Locations.AddRangeAsync(locations);
        }

        public Task UpdateAsync(Location location)
        {
            _context.Locations.Update(location);
            return Task.CompletedTask;
        }

        public Task SetActiveStatusAsync(Location location, bool isActive)
        {
            location.IsActive = isActive;
            _context.Locations.Update(location);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Location location)
        {
            _context.Locations.Remove(location);
            return Task.CompletedTask;
        }

        public async Task<List<Location>> GetLocationByWarehouseIdAsync(int warehouseId)
        {
            return await _context.Locations
                .Where(l => l.WarehouseId == warehouseId)
                .ToListAsync();
        }
    }
}
