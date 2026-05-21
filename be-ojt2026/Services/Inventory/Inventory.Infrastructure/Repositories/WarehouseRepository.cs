using Inventory.Application.IRepositories;
using Inventory.Domain.Entities;
using Inventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Inventory.Infrastructure.Repositories
{
    public class WarehouseRepository : IWarehouseRepository
    {
        private readonly InventoryDbContext _context;

        public WarehouseRepository(InventoryDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Warehouse>> GetAllAsync()
        {
            return await _context.Warehouses.ToListAsync();
        }

        public async Task<(IEnumerable<Warehouse> Items, int TotalCount)> GetPaginatedAsync(int pageIndex, int pageSize, bool? isActive = null, string? search = null, int? managerId = null)
        {
            var query = _context.Warehouses.AsQueryable();
            if (isActive.HasValue)
            {
                query = query.Where(w => w.IsActive == isActive.Value);
            }

            if (managerId.HasValue)
            {
                query = query.Where(w => w.ManagerId == managerId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchTerm = search.Trim().ToLower();
                query = query.Where(w =>
                    (w.Name != null && w.Name.ToLower().Contains(searchTerm)) ||
                    (w.WarehouseCode != null && w.WarehouseCode.ToLower().Contains(searchTerm)));
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderBy(w => w.Id)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, totalCount);
        }

        public async Task<Warehouse?> GetByIdAsync(int id)
        {
            return await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == id);
        }

        public async Task<Warehouse?> GetByCodeAsync(string warehouseCode)
        {
            return await _context.Warehouses
                .FirstOrDefaultAsync(w => w.WarehouseCode.ToLower() == warehouseCode.ToLower());
        }

        public async Task<Warehouse?> GetByCodeWithLocationsAsync(string warehouseCode)
        {
            return await _context.Warehouses
                .Include(w => w.Locations)
                .FirstOrDefaultAsync(w => w.WarehouseCode.ToLower() == warehouseCode.ToLower());
        }

        public async Task<IEnumerable<Warehouse>> GetByManagerIdAsync(int managerId)
        {
            return await _context.Warehouses
                .Where(w => w.ManagerId == managerId)
                .ToListAsync();
        }

        public Task UpdateAsync(Warehouse warehouse)
        {
            _context.Warehouses.Update(warehouse);
            return Task.CompletedTask;
        }

        public Task SetActiveStatusAsync(Warehouse warehouse, bool isActive)
        {
            warehouse.IsActive = isActive;
            _context.Warehouses.Update(warehouse);
            return Task.CompletedTask;
        }

        public async Task AddAsync(Warehouse warehouse)
        {
            await _context.Warehouses.AddAsync(warehouse);
        }

        public Task DeleteAsync(Warehouse warehouse)
        {
            _context.Warehouses.Remove(warehouse);
            return Task.CompletedTask;
        }

        public async Task<Warehouse?> GetWarehouseByManagerIdAsync(int managerId)
        {
            return await _context.Warehouses.FirstOrDefaultAsync(w => w.ManagerId == managerId);
        }
        public async Task<List<Warehouse>> GetWarehousesByManagerIdAsync(int managerId)
        {
            return await _context.Warehouses
                .Where(w => w.ManagerId == managerId)
                .ToListAsync();
        }
        public async Task<Warehouse?> GetWarehouseByLocationIdAsync(int locationId)
        {
            if (locationId <= 0)
                throw new ArgumentException("LocationId không hợp lệ");

            var location = await _context.Locations.FindAsync(locationId);
            if (location == null)
                return null;

            var warehouse = await _context.Warehouses.FindAsync(location.WarehouseId);
            return warehouse;
        }

        }
    }
